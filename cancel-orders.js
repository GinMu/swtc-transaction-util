const axios = require("axios");
const program = require('commander');
const fs = require("fs");
const JingchangWallet = require("jcc_wallet").JingchangWallet;
const {Transaction} = require("@jccdex/jingtum-lib");
const config = require("./config");

program
  .usage('[options] <file ...>')
  .option('-A, --address <path>', "钱包地址")
  .option('-P, --password <path>', "keystore密码")
  .parse(process.argv);

const transaction = new Transaction("jingtum", config.nodes, 3);  

const getOrders = async (address) => {
  const res = await axios.get("https://explorer.jccdex.cn/wallet/offer/e6236895?p=0&s=100&w=" + address);
  if (res.status === 200 && res.data.code === "0") {
    return res.data.data;
  }
}

const cancelOrder = (address, secret, seq, timeout) => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const hash = await transaction.cancelOrder(address, secret, seq);
        resolve(hash);
      } catch (error) {
        reject(error);
      }
    }, timeout)
  })
}

const cancelOrders = async () => {
  const { address, password } = program;
  const keystore = fs.readFileSync("./keystore/wallet.json", { encoding: "utf-8" });
  const instance = new JingchangWallet(JSON.parse(keystore), true, false);
  const secret = await instance.getSecretWithAddress(password, address);

  while (true) {
    try {
      const { list, count } = await getOrders(address)
      if (!Array.isArray(list) || list.length === 0) {
        break;
      }
      let hasFailed = false;
      for (const key in list) {
        const seq = list[key].seq;
        try {
          const hash = await cancelOrder(address, secret, seq, key === 0 ? 0 : 500);
          console.log("撤销成功: ", hash);
        } catch (error) {
          console.log("撤销失败: ", error);
          hasFailed = true;
        }
      }
      if (!hasFailed && list.length === count) {
        break;
      }
    } catch (error) {
      console.log(error);
    }
  }
}

cancelOrders()