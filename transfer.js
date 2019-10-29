const program = require('commander');
const fs = require("fs");
const readlineSync = require('readline-sync');
const JCCExchange = require("jcc_exchange").JCCExchange;
const JingchangWallet = require("jcc_wallet").JingchangWallet;

program
  .usage('[options] <file ...>')
  .option('-A, --address <path>')
  .option('-c, --currency <path>')
  .option('-a, --amount <path>')
  .option('-t, --to <path>')
  .option('-m, --memo <path>')
  .parse(process.argv);

const transfer = async () => {
  const { address, amount, currency, memo, to } = program;
  const password = readlineSync.question('Password:', { hideEchoBack: true });
  try {
    const keystore = fs.readFileSync("./keystore/wallet.json", { encoding: "utf-8" });
    const instance = new JingchangWallet(JSON.parse(keystore), true, false);
    const secret = await instance.getSecretWithAddress(password, address);
    JCCExchange.init(["ejia348ffbda04.jccdex.cn"], 443, true);
    let hash = await JCCExchange.transfer(address, secret, amount, memo, to, currency);
    console.log("转账成功: ", hash);
  } catch (error) {
    console.log("转账失败: ", error.message);
  }
}

transfer();