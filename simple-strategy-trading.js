const BigNumber = require("bignumber.js");
const program = require("commander");
const fs = require("fs");
const { Transaction } = require("@jccdex/jingtum-lib");
const JingchangWallet = require("jcc_wallet").JingchangWallet;
const config = require("./config");
const sleep = require("./utils/sleep");

program
  .usage("[options] <file ...>")
  .option("-A, --address <path>", "钱包地址")
  .option("-P, --password <path>", "keystore密码")
  .option("-b, --base <path>", "token名称")
  .option("-c, --counter <path>", "token名称")
  .option("-H, --highAmount <path>", "数量上限")
  .option("-L, --lowAmount <path>", "数量下限")
  .option("-h, --highPrice <path>", "价格上限")
  .option("-l, --lowPrice <path>", "价格下限")
  .option("-q, --quantity <path>", "挂单数量")
  .option("-t, --type <path>", "买或卖")
  .parse(process.argv);

const transaction = new Transaction("jingtum", config.nodes, 3);

const createOrder = async (address, secret, amount, base, counter, sum, type, timeout = 1000) => {
  await sleep(timeout);
  const hash = await transaction.createOrder(address, secret, amount, base, counter, sum, type);
  return hash;
};

const limitRandom = (min, max) => {
  const value = Math.random() * (parseFloat(max) - parseFloat(min)) + parseFloat(min);
  return value;
};

const deal = async () => {
  const { address, password, base, counter, highAmount, lowAmount, highPrice, lowPrice, quantity, type } = program;
  try {
    const keystore = fs.readFileSync("./keystore/wallet.json", { encoding: "utf-8" });
    const instance = new JingchangWallet(JSON.parse(keystore), true, false);
    const secret = await instance.getSecretWithAddress(password, address);
    for (let index = 0; index < Number(quantity); index++) {
      try {
        const amount = limitRandom(lowAmount, highAmount).toFixed(6);
        const price = limitRandom(lowPrice, highPrice).toFixed(6);
        const sum = new BigNumber(price).multipliedBy(amount).precision(16, 1).toString(10);
        const hash = await createOrder(address, secret, amount, base, counter, sum, type, index === 0 ? 0 : 500);
        console.log("挂单成功:", hash);
      } catch (error) {
        console.log("挂单失败:", error.message);
      }
    }
  } catch (error) {
    console.log("挂单失败:", error.message);
  }
};

deal();
