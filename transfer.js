const BigNumber = require("bignumber.js");
const program = require("commander");
const fs = require("fs");
const { Transaction } = require("@jccdex/jingtum-lib");
const JingchangWallet = require("jcc_wallet").JingchangWallet;
const config = require("./config");

program
  .usage("[options] <file ...>")
  .option("-A, --address <path>", "钱包地址")
  .option("-P, --password <path>", "keystore密码")
  .option("-c, --currency <path>", "token名称")
  .option("-a, --amount <path>", "数量")
  .option("-t, --to <path>", "转入钱包地址")
  .option("-m, --memo <path>", "备注")
  .parse(process.argv);

const transfer = async () => {
  const { address, amount, currency, memo, password, to } = program;
  try {
    const keystore = fs.readFileSync("./keystore/wallet.json", { encoding: "utf-8" });
    const instance = new JingchangWallet(JSON.parse(keystore), true, false);
    const secret = await instance.getSecretWithAddress(password, address);
    const transaction = new Transaction("jingtum", config.nodes, 3);
    let hash = await transaction.transfer(address, secret, amount, memo, to, currency);
    console.log("转账成功: ", hash);
  } catch (error) {
    console.log("转账失败: ", error.message);
  }
};

transfer();
