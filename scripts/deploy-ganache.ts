import HDWalletProvider from "@truffle/hdwallet-provider";
import Web3 from "web3";
const provider = new HDWalletProvider({
  privateKeys: ["0xe9dbd00767eef0e147dce36d0c2ffffffb8ecba9edeaad63f5ce7aa738c2c3a6"],
  providerOrUrl: "http://127.0.0.1:9991",
});
const web3 = new Web3(provider);
const WETH_KOVAN = "0xd0A1E359811322d97991E03f863a0C30C2cF029C";
const constants = {
  UNISWAP: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  SUSHISWAP: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
  ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
  WETH_KOVAN: "0xd0A1E359811322d97991E03f863a0C30C2cF029C",
  DAI_KOVAN: "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa",
  LINK_KOVAN: "0xa36085f69e2889c224210f603d836748e7dc0088",
  WETH_ETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  LINK_ETH: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
};
async function main() {
  const [deployer] = await web3.eth.getAccounts();
  console.log(deployer);
  const BotJson = require("../artifacts/contracts/BotContract.sol/BotContract.json");
  const DEXFactory = new web3.eth.Contract(BotJson.abi);
  const DEXContract = await DEXFactory.deploy({ data: BotJson.bytecode }).send({ from: deployer });
  console.log("DEX contract is:", DEXContract.options.address);
  console.log("WETH address is:", WETH_KOVAN);
  console.log(
    `Your account is: ${deployer} with ${web3.utils.fromWei(
      await web3.eth.getBalance(deployer)
    )} ETH balance`
  );
  const ERC20TokenJson = require("../artifacts/contracts/test/ERC20.sol/ERC20Token.json");
  const TokenFactory = new web3.eth.Contract(ERC20TokenJson.abi);
  const tokenInstance = await TokenFactory.deploy({ data: ERC20TokenJson.bytecode }).send({
    from: deployer,
  });
  console.log("tokenInstance contract is:", tokenInstance.options.address);
  const WETHJson = require("../artifacts/contracts/test/WETH.sol/WETH9_.json");
  const wethInstance = new web3.eth.Contract(WETHJson.abi, constants.WETH_ETH);
  const RouterJson = require("../artifacts/contracts/interfaces/IUniswapV2Router02.sol/IUniswapV2Router02.json");
  const uniswapRouterInstance = new web3.eth.Contract(RouterJson.abi, constants.UNISWAP);
  const sushiswapRouterInstance = new web3.eth.Contract(RouterJson.abi, constants.SUSHISWAP);
  await tokenInstance.methods.mint(deployer, web3.utils.toWei("1000000")).send({ from: deployer });
  console.log("simple token minted to deployer account");
  await tokenInstance.methods
    .approve(constants.UNISWAP, web3.utils.toWei("100000"))
    .send({ from: deployer });
  console.log("simple token approved to uniswap router");
  await tokenInstance.methods
    .approve(constants.SUSHISWAP, web3.utils.toWei("100000"))
    .send({ from: deployer });
  console.log("simple token approved to sushiswap router");
  await wethInstance.methods.deposit().send({ from: deployer, value: web3.utils.toWei("100000") });
  console.log("deposited to Weth address from deployer");
  await wethInstance.methods
    .approve(constants.UNISWAP, web3.utils.toWei("100000"))
    .send({ from: deployer });
  console.log("weth approved to uniswap router");
  await wethInstance.methods
    .approve(constants.SUSHISWAP, web3.utils.toWei("100000"))
    .send({ from: deployer });
  console.log("weth approved to sushiswap router");
  await uniswapRouterInstance.methods
    .addLiquidity(
      constants.WETH_ETH,
      tokenInstance.options.address,
      web3.utils.toWei("200").toString(),
      web3.utils.toWei("20000").toString(),
      "0",
      "0",
      deployer,
      "163511365136136151"
    )
    .send({ from: deployer });
  console.log("added liquidity to uniswap");
  await sushiswapRouterInstance.methods
    .addLiquidity(
      constants.WETH_ETH,
      tokenInstance.options.address,
      web3.utils.toWei("20000").toString(),
      web3.utils.toWei("200").toString(),
      "0",
      "0",
      deployer,
      "163511365136136151"
    )
    .send({ from: deployer });
  console.log("added liquidity to sushiswap");
  await wethInstance.methods
    .approve(DEXContract.options.address, web3.utils.toWei("1000").toString())
    .send({ from: deployer });
  console.log("approved to our contract address");
}
main()
  .then(() => {
    console.log("End!");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
