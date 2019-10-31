const program = require('commander');
const fs = require("fs");
const { JingchangWallet, jtWallet } = require("jcc_wallet");

program
  .usage('[options] <file ...>')
  .option('-s, --secret <path>', "秘钥")
  .option('-p, --password <path>', "密码")
  .parse(process.argv);

const generateKeystore = async () => {
  const secret = program.secret;
  const password = program.password;
  const keystoreFile = "./keystore/wallet.json";
  try {
    let wallet;
    try {
      wallet = fs.readFileSync(keystoreFile, { encoding: "utf-8" });
    } catch (error) {
      wallet = null;
    }

    let newWallet;
    if (JingchangWallet.isValid(wallet)) {
      const instance = new JingchangWallet(JSON.parse(wallet), true, false);
      newWallet = await instance.importSecret(secret, password, "swt", jtWallet.getAddress);
    } else {
      newWallet = await JingchangWallet.generate(password, secret);
    }
    fs.writeFileSync(keystoreFile, JSON.stringify(newWallet, null, 2), { encoding: "utf-8" });
  } catch (error) {
    console.log(error);
  }
}

generateKeystore();