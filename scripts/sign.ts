enum SwapType {
  UNISWAP = 0,
  SUSHISWAP = 1,
}
const WETH_ADDR = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

const main = async () => {
  const [deployer, user] = await web3.eth.getAccounts();
  const path1 = [WETH_ADDR, "0xB98aEf45544ACFd5A6cD2659b6e61Ce0f003Ae58"];
  const path2 = ["0xB98aEf45544ACFd5A6cD2659b6e61Ce0f003Ae58", WETH_ADDR];
  // create encoded string for uniswap/sushiswap arguments
  const argument1 = web3.eth.abi.encodeParameters(["address[]"], [path1]);
  const argument2 = web3.eth.abi.encodeParameters(["address[]"], [path2]);
  // create arguments data for swaps
  const args = [argument1, argument2];
  // create array of swap exchanges
  const swapTypes = [SwapType.UNISWAP, SwapType.SUSHISWAP];
  // create params for function call
  const params = web3.eth.abi.encodeParameters(["bytes[]", "uint8[]"], [args, swapTypes]);

  const hash = web3.utils.soliditySha3(
    {
      t: "address",
      v: WETH_ADDR,
    },
    {
      t: "uint256",
      v: web3.utils.toWei("1").toString(),
    },
    {
      t: "uint256",
      v: web3.utils.toWei("1.2").toString(),
    },
    {
      t: "uint256",
      v: "3",
    },
    {
      t: "uint256",
      v: web3.utils.toWei("1000", "gwei").toString(),
    },
    {
      t: "bool",
      v: "",
    },
    {
      t: "bytes",
      v: params,
    }
  );
  console.log("params is ->", params);

  console.log("hash is ->", hash);

  const signature = web3.eth.accounts.sign(
    hash as string,
    "0x581c170508a6746bddebaaec79666d186133580a2082f6797853179ebcec51f9"
  );
  console.log("signature is ->", signature);
  console.log("user is ->", user);
};

main()
  .then(() => {
    console.log("Success!");
    process.exit(0);
  })
  .catch((err) => {
    console.log("err is ->", err);
    process.exit(1);
  });
