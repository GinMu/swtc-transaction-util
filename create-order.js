const BigNumber = require("bignumber.js");
const program = require('commander');
const fs = require("fs");
const JCCExchange = require("jcc_exchange").JCCExchange;
const JingchangWallet = require("jcc_wallet").JingchangWallet;

program
  .usage('[options] <file ...>')
  .option('-A, --address <path>', "钱包地址")
  .option('-P, --password <path>', "keystore密码")
  .option('-a, --amount <path>', "数量")
  .option('-b, --base <path>', "token名称")
  .option('-c, --counter <path>', "token名称")
  .option('-p, --price <path>', "价格")
  .option('-t, --type <path>', "买或卖")
  .parse(process.argv);

const deal = async () => {
  const { counter, base, price, amount, type, address, password } = program;
  try {
    const keystore = fs.readFileSync("./keystore/wallet.json", { encoding: "utf-8" });
    const instance = new JingchangWallet(JSON.parse(keystore), true, false);
    const secret = await instance.getSecretWithAddress(password, address);
    const sum = new BigNumber(price).multipliedBy(amount).toString(10);
    JCCExchange.init(["ejia348ffbda04.jccdex.cn"], 443, true);
    const hash = await JCCExchange.createOrder(address, secret, amount, base, counter, sum, type);
    console.log("挂单成功:", hash);
  } catch (error) {
    console.log("挂单失败:", error.message);
  }
}

deal();