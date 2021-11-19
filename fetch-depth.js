const program = require("commander");
const fetchDepth = require("@jccdex/triangular-arbitrage/lib/fetchDepth").fetchDepth;
const config = require("./config");

program
  .usage("[options] <file ...>")
  .option("-b, --base <path>", "base token")
  .option("-c, --counter <path>", "counter token")
  .option("-l, --limit <path>", "深度限制")
  .option("-s, --show <path>", "显示买单、卖单或所有")
  .parse(process.argv);

const fetch = async () => {
  const { base, counter, limit, show } = program;

  try {
    const depth = await fetchDepth({
      url: config.nodes[0],
      base,
      counter,
      limit: Number(limit) || 20
    });

    if (show === "bid") {
      console.log("bid depth: ", JSON.stringify(depth.bids.reverse(), null, 2));
    } else if (show === "ask") {
      console.log("ask depth: ", JSON.stringify(depth.asks, null, 2));
    } else {
      console.log("bid & ask depth: ", JSON.stringify(depth, null, 2));
    }
  } catch (error) {
    console.log("fetch error: ", error);
  }
};

fetch();
