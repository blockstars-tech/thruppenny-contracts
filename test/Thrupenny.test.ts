import { ethers } from "hardhat";
import chai from "chai";
import BN from "bn.js";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  BotContract,
  BotContract__factory,
  ThrupennyToken,
  ThrupennyToken__factory,
  IUniswapV2Router02,
  IUniswapV2Router02__factory,
  WETH9__factory,
  WETH9,
} from "../typechain-types";

const { expect } = chai;

let deployer: SignerWithAddress;
let user1: SignerWithAddress;
let user2: SignerWithAddress;

const gnosisSafeAddress = "0xA5aA45285830a49d90a4bC3b12689C8FdEC84e32";
const expectedName = "Thrupenny";
const expectedSymbol = "TRU";
const expectedDecimals = 8;
const expectedTotalSupply = new BN("1000000000")
  .mul(new BN("10").pow(new BN(expectedDecimals)))
  .toString();

//
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

describe("ThrupennyToken Contract", () => {
  let ThrupennyTokenFactory: ThrupennyToken__factory;
  let thrupennyToken: ThrupennyToken;

  before(async () => {
    [deployer, user1, user2] = await ethers.getSigners();

    ThrupennyTokenFactory = (await ethers.getContractFactory(
      "ThrupennyToken"
    )) as ThrupennyToken__factory;
  });

  beforeEach(async function () {
    thrupennyToken = await ThrupennyTokenFactory.deploy(gnosisSafeAddress);
    await thrupennyToken.deployed();
  });

  describe("Deployment", () => {
    it("Should test default total supply", async function () {
      expect(await thrupennyToken.totalSupply()).to.equal(expectedTotalSupply);
    });

    it("Should test token attributes", async function () {
      expect(await thrupennyToken.name()).to.equal(expectedName);
      expect(await thrupennyToken.symbol()).to.equal(expectedSymbol);
      expect(await thrupennyToken.decimals()).to.equal(expectedDecimals);
    });
  });

  describe("Should check balance at deployment", async () => {
    it("Should mint 1000000000 *10*8 to constructor address", async function () {
      expect(await thrupennyToken.balanceOf(gnosisSafeAddress)).to.be.equal(expectedTotalSupply);
    });
  });
});

// let UniswapRouterFactory: IUniswapV2Router02__factory;

// let uniswapRouterInstance: IUniswapV2Router02;
// let sushiswapRouterInstance: IUniswapV2Router02;

// describe("DEX", async () => {
//   let ThrupennyTokenFactory: ThrupennyToken__factory;
//   let thrupennyToken: ThrupennyToken;
//   let WETH9Factory: WETH9__factory;
//   let weth9: WETH9;
//   let BotContractFactory: BotContract__factory;
//   let botContract: BotContract;

//   let IUniswapRouterFactory: IUniswapV2Router02__factory;
//   IUniswapRouterFactory = await ethers.getContractAt(
//     "IUniswapV2Router02",
//     "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
//   );

//   let uniswapRouterInstance: IUniswapV2Router02;
//   let sushiswapRouterInstance: IUniswapV2Router02;

//   before(async () => {
//     let accounts = await ethers.getSigners();
//     let user = accounts[0];

//     uniswapRouterInstance = uniswapRouterInstance.attach(constants.UNISWAP);
//     sushiswapRouterInstance = uniswapRouterInstance.attach(constants.SUSHISWAP);

//     ThrupennyTokenFactory = (await ethers.getContractFactory(
//       "Thrupenny"
//     )) as ThrupennyToken__factory;
//     thrupennyToken = await ThrupennyTokenFactory.deploy(
//       "0xa5aa45285830a49d90a4bc3b12689c8fdec84e32"
//     );
//     await thrupennyToken.deployed();

//     let WETH9Factory = (await ethers.getContractFactory("WETH9_")) as WETH9__factory;
//     weth9 = await WETH9Factory.deploy();

//     BotContractFactory = (await ethers.getContractFactory("BotContract")) as BotContract__factory;
//     botContract = await BotContractFactory.deploy("security contract");
//     await botContract.deployed();
//   });
//   //   describe("console.log", () => {
//   //     console.log(botContract.LENDING_POOL());
//     describe("Constructor params", async () => {
//     //   botContract = await BotContractFactory.deploy("security")
//     it("Should return right {FLASHLOAN ADDRESS PROVIDER}", async () => {
//       const expected = "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5";
//       expect(await botContract.ADDRESSES_PROVIDER()).to.equal(expected);
//     });

//     it("Should return right {FLASHLOAN LENDING POOL}", async () => {
//       const expected = "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9";
//       expect(await botContract.LENDING_POOL()).to.equal(expected);
//     });
//   });

//     describe("executeSwapsWithFlashloan function because of unprofitableness", async () => {

//      })
// });

// //   it("should deploy with the constructor being security contract", async () => {});
