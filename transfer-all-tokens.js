const BigNumber = require("bignumber.js");
const program = require('commander');
const fs = require("fs");
const {Transaction} = require("@jccdex/jingtum-lib");
const JingchangWallet = require("jcc_wallet").JingchangWallet;
const JcExchange = require("jcc_rpc").JcExchange
const config = require("./config");

program
  .usage('[options] <file ...>')
  .option('-A, --address <path>', "钱包地址")
  .option('-P, --password <path>', "keystore密码")
  .option('-t, --to <path>', "转入钱包地址")
  .parse(process.argv);

const transaction = new Transaction("jingtum", config.nodes, 3);
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
        const hash = await transaction.transfer(address, secret, amount, "", to, token);
        resolve(hash);
      } catch (error) {
        reject(error);
      }
    }, timeout)
  })
}

const transferTokens = async () => {
  const { address, password, to } = program;
  const keystore = fs.readFileSync("./keystore/wallet.json", { encoding: "utf-8" });
  const instance = new JingchangWallet(JSON.parse(keystore), true, false);
  const secret = await instance.getSecretWithAddress(password, address);

  while (true) {
    try {
      const balances = await getBalance(address);
      const swtBalance = balances.find((balance) => balance.currency === "SWT");
      const filterBalances = balances.filter((balance) => balance.currency !== "SWT" && new BigNumber(balance.value).minus(balance.freezed).gt(0));
      if (filterBalances.length === 0) {
        console.log("swt余额: ", swtBalance);
        // swt余额存在，且大于gas费0.0001
        const available = new BigNumber(swtBalance.value).minus(swtBalance.freezed)
        if (available.gt(0.0001)) {
          try {
            const amount = available.minus(0.0001).precision(15, 1).toString(10);
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
            const available = new BigNumber(balance.value).minus(balance.freezed);
            const amount = available.precision(15, 1).toString(10);
            await transfer(address, secret, amount, to, balance.currency);
            console.log("转账成功:", balance.currency);
          } catch (error) {
            console.log(`${balance.currency}转账失败: `, error);
            hasFailed = true;
          }
        }
        try {
          const available = new BigNumber(swtBalance.value).minus(swtBalance.freezed).minus(gas);
          const amount = available.precision(15, 1).toString(10);
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