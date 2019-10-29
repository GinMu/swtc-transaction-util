const fs = require("fs");
const readlineSync = require('readline-sync');

const { JingchangWallet, jtWallet } = require("jcc_wallet");

const generateKeystore = async () => {
  const keystoreFile = "./keystore/wallet.json";
  try {
    let wallet;
    try {
      wallet = fs.readFileSync(keystoreFile, { encoding: "utf-8" });
    } catch (error) {
      wallet = null;
    }

    let newWallet;
    const secret = readlineSync.question('Secret:', { hideEchoBack: true });
    if (!jtWallet.isValidSecret(secret)) {
      console.log('secret invalid, abort.');
      return;
    }
    const password = readlineSync.question('Password:', { hideEchoBack: true });
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