const BigNumber = require("bignumber.js");
const program = require("commander");
const fs = require("fs");
const { Transaction } = require("@jccdex/jingtum-lib");
const JingchangWallet = require("jcc_wallet").JingchangWallet;
const ExplorerFactory = require("jcc_rpc").ExplorerFactory;
const config = require("./config");
const sleep = require("./utils/sleep");

program
  .usage("[options] <file ...>")
  .option("-A, --address <path>", "钱包地址")
  .option("-P, --password <path>", "keystore密码")
  .option("-t, --to <path>", "转入钱包地址")
  .parse(process.argv);

const transaction = new Transaction("jingtum", config.nodes, 3);

const explorerInst = ExplorerFactory.init(["https://swtcscan.jccdex.cn"]);

const getBalance = async (address) => {
  const res = await explorerInst.getBalances(address, address);
  if (!res.result) {
    return null;
  }
  const data = res.data;
  delete data._id;
  delete data.feeflag;
  const balances = [];
  for (const key in data) {
    if (Object.hasOwnProperty.call(data, key)) {
      const d = data[key];
      if (key === "SWTC") {
        balances.push(Object.assign(d, { currency: "SWT" }));
      } else {
        balances.push(Object.assign(d, { currency: key.split("_")[0] }));
      }
    }
  }
  return balances;
};

const transfer = async (address, secret, amount, to, token, timeout = 1000) => {
  await sleep(timeout);
  const hash = await transaction.transfer(address, secret, amount, "", to, token);
  return hash;
};

const transferTokens = async () => {
  const { address, password, to } = program;
  const keystore = fs.readFileSync("./keystore/wallet.json", { encoding: "utf-8" });
  const instance = new JingchangWallet(JSON.parse(keystore), true, false);
  const secret = await instance.getSecretWithAddress(password, address);

  while (true) {
    try {
      const balances = await getBalance(address);
      const swtBalance = balances.find((balance) => balance.currency === "SWT");
      const filterBalances = balances.filter(
        (balance) => balance.currency !== "SWT" && new BigNumber(balance.value).minus(balance.frozen).gt(0)
      );
      if (filterBalances.length === 0) {
        console.log("swt余额: ", swtBalance);
        // swt余额存在，且大于gas费0.0001
        const available = new BigNumber(swtBalance.value).minus(swtBalance.frozen);
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
        if (new BigNumber(swtBalance.value).minus(swtBalance.frozen).lt(gas)) {
          break;
        }
        let hasFailed = false;
        for (const balance of filterBalances) {
          try {
            const available = new BigNumber(balance.value).minus(balance.frozen);
            const amount = available.precision(15, 1).toString(10);
            await transfer(address, secret, amount, to, balance.currency);
            console.log("转账成功:", balance.currency);
          } catch (error) {
            console.log(`${balance.currency}转账失败: `, error);
            hasFailed = true;
          }
        }
        try {
          const available = new BigNumber(swtBalance.value).minus(swtBalance.frozen).minus(gas);
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
      console.log(error);
      break;
    }
    await sleep(30000);
  }
};

transferTokens();
