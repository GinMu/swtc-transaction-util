const BigNumber = require("bignumber.js");
const program = require('commander');
const fs = require("fs");
const JCCExchange = require("jcc_exchange").JCCExchange;
const JingchangWallet = require("jcc_wallet").JingchangWallet;
const JcExchange = require("jcc_rpc").JcExchange

program
  .usage('[options] <file ...>')
  .option('-A, --address <path>')
  .option('-P, --password <path>')
  .option('-t, --to <path>')
  .parse(process.argv);


const getBalance = async (address) => {
  const inst = new JcExchange(["ejia348ffbda04.jccdex.cn"], 443, true);
  const res = await inst.getBalances(address);
  if (!res.result) {
    throw new Error(res.msg);
  }
  return res.data;
}

const transfer = (address, secret, amount, to, token, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const hash = await JCCExchange.transfer(address, secret, amount, "", to, token);
        resolve(hash);
      } catch (error) {
        reject(error);
      }
    }, timeout)
  })
}

const handleLongDigits = (value) => {
  let effectiveNumberLimit = value.sd();
  if (effectiveNumberLimit > 15) {
    return value.precision(15, 1).toString(10);
  } else {
    return value.toString(10);
  }
}

const transferTokens = async () => {
  const { address, password, to } = program;
  const keystore = fs.readFileSync("./keystore/wallet.json", { encoding: "utf-8" });
  const instance = new JingchangWallet(JSON.parse(keystore), true, false);
  const secret = await instance.getSecretWithAddress(password, address);
  JCCExchange.init(["ejia348ffbda04.jccdex.cn"], 443, true);

  while (true) {
    try {
      const balances = await getBalance(address);
      const swtBalance = balances.find((balance) => balance.currency === "SWT");
      const filterBalances = balances.filter((balance) => balance.currency !== "SWT" && new BigNumber(balance.value).minus(balance.freezed).gt(0));
      if (filterBalances.length === 0) {
        console.log("swt余额: ", swtBalance);
        // swt余额存在，且大于gas费0.0001
        if (new BigNumber(swtBalance.value).minus(swtBalance.freezed).gt(0.0001)) {
          try {
            const transferSwtValue = new BigNumber(swtBalance.value).minus(swtBalance.freezed).minus(0.0001);
            const amount = handleLongDigits(transferSwtValue);
            await transfer(address, secret, amount, to, "swt");
            console.log("转账成功:", swtBalance.currency);
            break;
          } catch (error) {
            console.log("只有SWT时, SWT转账失败: ", error);
          }
        } else {
          // 小于则跳出循环
          break;
        }
      } else {
        const gas = new BigNumber(0.0001).multipliedBy(filterBalances.length).toString(10);
        // 如果swt余额小于将要消耗的gas
        if (new BigNumber(swtBalance.value).minus(swtBalance.freezed).lt(gas)) {
          break;
        }
        let hasFailed = false;
        for (const balance of filterBalances) {
          try {
            const balanceValue = new BigNumber(balance.value).minus(balance.freezed);
            const amount = handleLongDigits(balanceValue);
            await transfer(address, secret, amount, to, balance.currency);
            console.log("转账成功:", balance.currency);
          } catch (error) {
            console.log(`${balance.currency}转账失败: `, error);
            hasFailed = true;
          }
        }
        try {
          const swtBalanceValue = new BigNumber(swtBalance.value).minus(swtBalance.freezed).minus(gas);
          const amount = handleLongDigits(swtBalanceValue);
          await transfer(address, secret, amount, to, "swt");
          console.log("转账成功:", swtBalance.currency);
        } catch (error) {
          console.log(`${swtBalance.currency}转账失败: `, error);
          hasFailed = true;
        }
        if (!hasFailed) {
          // 如果没有失败case, 跳出循环
          break;
        }
      }
    } catch (error) {
      // 获取余额失败，跳出循环, 防止钱包未激活形成死循环
      console.log(error)
      break
    }
  }
}

transferTokens()