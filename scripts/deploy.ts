import { Web3 } from "hardhat";

const constants = {
  UNISWAP: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  SUSHISWAP: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
  SUSHISWAP_KOVAN: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
  ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
  WETH_KOVAN: "0xd0A1E359811322d97991E03f863a0C30C2cF029C",
  DAI_KOVAN: "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa",
  LINK_KOVAN: "0xa36085f69e2889c224210f603d836748e7dc0088",
  WETH_ETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  LINK_ETH: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
};

const Bot = artifacts.require("BotContract");
const SecurityContract = artifacts.require("SecurityContract");
const Token = artifacts.require("ERC20Token");
const WETH = artifacts.require("WETH9_");
const Router = artifacts.require("IUniswapV2Router02");

const main = async () => {
  const [deployer, user] = await web3.eth.getAccounts();

  const security = await SecurityContract.new({ from: deployer });
  const bot = await Bot.new(security.address);

  const token = await Token.new();

  console.log("security contract is:", security.address);
  console.log("bot contract is:", bot.address);
  console.log("tokenInstance contract is:", token.address);

  const weth = await WETH.at(constants.WETH_ETH);

  const uniswapRouter = await Router.at(constants.UNISWAP);
  const sushiswapRouter = await Router.at(constants.SUSHISWAP);

  await security.setBotAddress(bot.address, { from: deployer });

  await token.mint(user, Web3.utils.toWei("1000000"));
  console.log("mint user");
  await token.mint(deployer, Web3.utils.toWei("1000000"));
  console.log("mint");
  await token.approve(constants.UNISWAP, Web3.utils.toWei("100000"));
  console.log("approve");
  await token.approve(constants.SUSHISWAP, Web3.utils.toWei("100000"));
  console.log("approve");

  await weth.deposit({ value: Web3.utils.toWei("100000") });
  console.log("deposit");
  await weth.approve(constants.UNISWAP, Web3.utils.toWei("100000"));
  console.log("approve");
  await weth.approve(constants.SUSHISWAP, Web3.utils.toWei("100000"));
  console.log("approve");

  await uniswapRouter.addLiquidity(
    constants.WETH_ETH,
    token.address,
    Web3.utils.toWei("200"),
    Web3.utils.toWei("20000"),
    "0",
    "0",
    user,
    "163511365136136151"
  );
  await sushiswapRouter.addLiquidity(
    constants.WETH_ETH,
    token.address,
    Web3.utils.toWei("20000"),
    Web3.utils.toWei("200"),
    "0",
    "0",
    user,
    "163511365136136151"
  );

  await weth.approve(bot.address, Web3.utils.toWei("100000"));
};

main()
  .then(() => {
    console.log("Success!");
    process.exit(0);
  })
  .catch((err) => {
    console.log("error is =>", err);
    process.exit(0);
  });
