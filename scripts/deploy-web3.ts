import "dotenv/config";

import HDWalletProvider from "@truffle/hdwallet-provider";
import Web3 from "web3";

const compiledSecurity = require("../artifacts/contracts/SecurityContract.sol/SecurityContract.json");
const compiledBot = require("../artifacts/contracts/BotContract.sol/BotContract.json");
const compiledToken = require("../artifacts/contracts/test/ERC20.sol/ERC20Token.json");

const pk1 = process.env.PRIVATE_KEY_1;
const pk2 = process.env.PRIVATE_KEY_2;
const httpUrl = process.env.KOVAN_URL;

if (!pk1 || !pk2) {
  throw new Error("Please specify two private keys");
}
if (!httpUrl) {
  throw new Error("Please provide web socket url");
}

const httpProvider = new HDWalletProvider({
  privateKeys: [pk1, pk2],
  providerOrUrl: httpUrl,
});

const web3 = new Web3(httpProvider);
const Security = new web3.eth.Contract(compiledSecurity.abi);
const Bot = new web3.eth.Contract(compiledBot.abi);
const Token = new web3.eth.Contract(compiledToken.abi);

const constants = {
  UNISWAP: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  // SUSHISWAP: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
  SUSHISWAP_KOVAN: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506",
  ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
  WETH_KOVAN: "0xd0A1E359811322d97991E03f863a0C30C2cF029C",
  DAI_KOVAN: "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa",
  LINK_KOVAN: "0xa36085f69e2889c224210f603d836748e7dc0088",
  WETH_ETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  LINK_ETH: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
};

const signatures = {
  mintSig: web3.eth.abi.encodeFunctionSignature("mint(address,uint256)"),
  approveSig: web3.eth.abi.encodeFunctionSignature("approve(address,uint256)"),
  depositSig: web3.eth.abi.encodeFunctionSignature("deposit()"),
  addLiquiditySig: web3.eth.abi.encodeFunctionSignature(
    "addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)"
  ),
};

const parameters = {
  mintParams: ["address", "uint256"],
  approveParams: ["address", "uint256"],
  addLiquidityParams: [
    "address",
    "address",
    "uint256",
    "uint256",
    "uint256",
    "uint256",
    "address",
    "uint256",
  ],
};

async function main() {
  const [deployer, user] = await web3.eth.getAccounts();
  let nonce0 = await web3.eth.getTransactionCount(deployer);
  let nonce1 = await web3.eth.getTransactionCount(user);

  const security = await Security.deploy({ data: compiledSecurity.bytecode }).send({
    from: deployer,
    nonce: nonce0++,
  });
  console.log("Security contract deployed at address", security.options.address);

  const bot = await Bot.deploy({
    data: compiledBot.bytecode,
    arguments: [security.options.address],
  }).send({
    from: deployer,
    nonce: nonce0++,
  });
  console.log("Bot deployed at address", bot.options.address);

  // deploy token1
  const token1 = await Token.deploy({ data: compiledToken.bytecode }).send({
    from: deployer,
    nonce: nonce0++,
  });
  console.log("Token1 deployed at address", token1.options.address);

  // deploy token2
  const token2 = await Token.deploy({ data: compiledToken.bytecode }).send({
    from: deployer,
    nonce: nonce0++,
  });
  console.log("Token2 deployed at address", token2.options.address);

  await security.methods
    .setBotAddress(bot.options.address)
    .send({ from: deployer, nonce: nonce0++ });
  console.log("bot contract address added to security contract");

  const amount = "1000000000000000000";

  await web3.eth.sendTransaction({
    from: deployer,
    to: token1.options.address,
    nonce: nonce0++,
    data:
      signatures.mintSig +
      web3.eth.abi
        .encodeParameters(parameters.mintParams, [user, web3.utils.toWei(amount)])
        .slice(2),
  });
  console.log("minted token1 to user ->", amount);

  await web3.eth.sendTransaction({
    from: deployer,
    to: token1.options.address,
    nonce: nonce0++,
    data:
      signatures.mintSig +
      web3.eth.abi
        .encodeParameters(parameters.mintParams, [deployer, web3.utils.toWei(amount)])
        .slice(2),
  });
  console.log("minted token1 to deployer ->", amount);

  await web3.eth.sendTransaction({
    from: deployer,
    to: token2.options.address,
    nonce: nonce0++,
    data:
      signatures.mintSig +
      web3.eth.abi
        .encodeParameters(parameters.mintParams, [user, web3.utils.toWei(amount)])
        .slice(2),
  });
  console.log("minted token2 to user ->", amount);

  await web3.eth.sendTransaction({
    from: deployer,
    to: token2.options.address,
    nonce: nonce0++,
    data:
      signatures.mintSig +
      web3.eth.abi
        .encodeParameters(parameters.mintParams, [deployer, web3.utils.toWei(amount)])
        .slice(2),
  });
  console.log("minted token2 to deployer ->", amount);

  await web3.eth.sendTransaction({
    from: deployer,
    to: token1.options.address,
    nonce: nonce0++,
    data:
      signatures.approveSig +
      web3.eth.abi
        .encodeParameters(parameters.approveParams, [
          constants.UNISWAP,
          web3.utils.toWei("10000000"),
        ])
        .slice(2),
  });
  console.log("approve token1 to uniswap");

  await web3.eth.sendTransaction({
    from: deployer,
    to: token1.options.address,
    nonce: nonce0++,
    data:
      signatures.approveSig +
      web3.eth.abi
        .encodeParameters(parameters.approveParams, [
          constants.SUSHISWAP_KOVAN,
          web3.utils.toWei("10000000"),
        ])
        .slice(2),
  });
  console.log("approve token1 to sushiswap");

  await web3.eth.sendTransaction({
    from: deployer,
    to: token2.options.address,
    nonce: nonce0++,
    data:
      signatures.approveSig +
      web3.eth.abi
        .encodeParameters(parameters.approveParams, [
          constants.UNISWAP,
          web3.utils.toWei("10000000"),
        ])
        .slice(2),
  });
  console.log("approve token2 to uniswap");

  await web3.eth.sendTransaction({
    from: deployer,
    to: token2.options.address,
    nonce: nonce0++,
    data:
      signatures.approveSig +
      web3.eth.abi
        .encodeParameters(parameters.approveParams, [
          constants.SUSHISWAP_KOVAN,
          web3.utils.toWei("10000000"),
        ])
        .slice(2),
  });
  console.log("approve token2 to sushiswap");

  // await web3.eth.sendTransaction({
  //   from: deployer,
  //   to: constants.WETH_KOVAN,
  //   nonce: nonce0++,
  //   data: signatures.depositSig,
  //   value: web3.utils.toWei("0.001"),
  // });
  // console.log("deposited 0.001 WETH to deployer address");

  // await web3.eth.sendTransaction({
  //   from: user,
  //   to: constants.WETH_KOVAN,
  //   nonce: nonce1++,
  //   data: signatures.depositSig,
  //   value: web3.utils.toWei("0.001"),
  // });
  // console.log("deposited 0.001 WETH to user address");

  // await web3.eth.sendTransaction({
  //   from: deployer,
  //   to: constants.WETH_KOVAN,
  //   nonce: nonce0++,
  //   data:
  //     signatures.approveSig +
  //     web3.eth.abi
  //       .encodeParameters(parameters.approveParams, [
  //         constants.UNISWAP,
  //         web3.utils.toWei("1000000"),
  //       ])
  //       .slice(2),
  // });
  // console.log("approve weth to uniswap");

  // await web3.eth.sendTransaction({
  //   from: deployer,
  //   to: constants.WETH_KOVAN,
  //   nonce: nonce0++,
  //   data:
  //     signatures.approveSig +
  //     web3.eth.abi
  //       .encodeParameters(parameters.approveParams, [
  //         constants.SUSHISWAP,
  //         web3.utils.toWei("1000000"),
  //       ])
  //       .slice(2),
  // });
  // console.log("approve weth to sushiswap");

  // await web3.eth.sendTransaction({
  //   from: user,
  //   to: constants.WETH_KOVAN,
  //   nonce: nonce1++,
  //   data:
  //     signatures.approveSig +
  //     web3.eth.abi
  //       .encodeParameters(parameters.approveParams, [botAddress, web3.utils.toWei("1000000")])
  //       .slice(2),
  // });
  // console.log("approve weth to bot");

  await web3.eth.sendTransaction({
    from: deployer,
    to: constants.UNISWAP,
    nonce: nonce0++,
    data:
      signatures.addLiquiditySig +
      web3.eth.abi
        .encodeParameters(parameters.addLiquidityParams, [
          token1.options.address,
          token2.options.address,
          web3.utils.toWei("10000"),
          web3.utils.toWei("1000000"),
          "0",
          "0",
          deployer,
          "163511365136136151",
        ])
        .slice(2),
  });
  console.log("add liquidity in uniswap");

  await web3.eth.sendTransaction({
    from: deployer,
    to: constants.SUSHISWAP_KOVAN,
    nonce: nonce0,
    data:
      signatures.addLiquiditySig +
      web3.eth.abi
        .encodeParameters(parameters.addLiquidityParams, [
          token1.options.address,
          token2.options.address,
          web3.utils.toWei("1000000"),
          web3.utils.toWei("10000"),
          "0",
          "0",
          deployer,
          "163511365136136151",
        ])
        .slice(2),
  });
  console.log("add liquidity in sushiswap");
}

main()
  .then(() => {
    console.log("Success!");
    process.exit(0);
  })
  .catch((err) => {
    console.log("Error ->", err);
    process.exit(1);
  });
