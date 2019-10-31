const BigNumber = require("bignumber.js");
const program = require('commander');
const fs = require("fs");
const JCCExchange = require("jcc_exchange").JCCExchange;
const JingchangWallet = require("jcc_wallet").JingchangWallet;

program
  .usage('[options] <file ...>')
  .option('-A, --address <path>', "钱包地址")
  .option('-P, --password <path>', "keystore密码")
  .option('-b, --base <path>', "token名称")
  .option('-c, --counter <path>', "token名称")
  .option('-H, --highAmount <path>', "数量上限")
  .option('-L, --lowAmount <path>', "数量下限")
  .option('-h, --highPrice <path>', "价格上限")
  .option('-l, --lowPrice <path>', "价格下限")
  .option('-q, --quantity <path>', "挂单数量")
  .option('-t, --type <path>', "买或卖")
  .parse(process.argv);

const createOrder = (address, secret, amount, base, counter, sum, type, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const hash = await JCCExchange.createOrder(address, secret, amount, base, counter, sum, type);
        resolve(hash);
      } catch (error) {
        reject(error);
      }
    }, timeout)
  })
}

const limitRandom = (min, max) => {
  const value = Math.random() * (parseFloat(max) - parseFloat(min)) + parseFloat(min);
  return value;
}

const deal = async () => {
  const { address, password, base, counter, highAmount, lowAmount, highPrice, lowPrice, quantity, type } = program;
  try {
    JCCExchange.init(["ejia348ffbda04.jccdex.cn"], 443, true);
    const keystore = fs.readFileSync("./keystore/wallet.json", { encoding: "utf-8" });
    const instance = new JingchangWallet(JSON.parse(keystore), true, false);
    const secret = await instance.getSecretWithAddress(password, address);
    const amount = limitRandom(lowAmount, highAmount).toFixed(6);
    const price = limitRandom(lowPrice, highPrice).toFixed(6);

    for (let index = 0; index < Number(quantity); index++) {
      try {
        const sum = new BigNumber(price).multipliedBy(amount).precision(16, 1).toString(10);
        const hash = await createOrder(address, secret, amount, base, counter, sum, type, index === 0 ? 0 : 2000);
        console.log("挂单成功:", hash);
      } catch (error) {
        console.log("挂单失败:", error.message);
      }
    }
  } catch (error) {
    console.log("挂单失败:", error.message);
  }
}

deal();