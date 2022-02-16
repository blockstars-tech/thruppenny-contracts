import { isAddress } from "@ethersproject/address";
import "@nomiclabs/hardhat-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect, use } from "chai";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { task } from "hardhat/config";
import {
  BotContract,
  BotContract__factory,
  ThrupennyToken,
  ThrupennyToken__factory,
  IUniswapV2Router02,
  IUniswapV2Router02__factory,
} from "../typechain-types";

const truffleAssert = require("truffle-assertions");

const constants = {
  gnosisSafeAddress: "0xA5aA45285830a49d90a4bC3b12689C8FdEC84e32",
  UNISWAP: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  SUSHISWAP: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F",
  ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
  WETH_KOVAN: "0xd0A1E359811322d97991E03f863a0C30C2cF029C",
  DAI_KOVAN: "0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa",
  LINK_KOVAN: "0xa36085f69e2889c224210f603d836748e7dc0088",
  WETH_ETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  LINK_ETH: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
};

let accounts: SignerWithAddress[];
let user: SignerWithAddress;
let user1: SignerWithAddress;
let user2: SignerWithAddress;
let user3: SignerWithAddress;

let BotContractFactory: BotContract__factory;
let botContract: BotContract;

let IUniswapV2Router02Factory: IUniswapV2Router02__factory;
let iUniswapV2Router02: IUniswapV2Router02;

let uniswapRouterInstance: IUniswapV2Router02;
let sushiswapRouterInstance: IUniswapV2Router02;

// let ThrupennyFactory: ThrupennyToken__factory;
// let thrupennyInstance: ThrupennyToken;

let wethInstance: any;

describe("Dex", async () => {
  let ThrupennyTokenFactory: ThrupennyToken__factory;
  let thrupennyToken: ThrupennyToken;
  before(async () => {
    accounts = await ethers.getSigners();
    user = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
    user3 = accounts[3];

    // iUniswapV2Router02 = await ethers.getContractAt(
    //   "IUniswapV2Router02",
    //   "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    // );

    // uniswapRouterInstance = uniswapRouterInstance.attach(constants.UNISWAP);
    // sushiswapRouterInstance = uniswapRouterInstance.attach(constants.SUSHISWAP);

    ThrupennyTokenFactory = (await ethers.getContractFactory(
      "ThrupennyToken"
    )) as ThrupennyToken__factory;

    let WETHFactory = await ethers.getContractFactory("WETH9_");
    wethInstance = WETHFactory.attach(constants.WETH_ETH);

    BotContractFactory = (await ethers.getContractFactory("BotContract")) as BotContract__factory;
    botContract = await BotContractFactory.deploy(user.address);
    await botContract.deployed();

    beforeEach(async function () {
      thrupennyToken = await ThrupennyTokenFactory.deploy(user.address);
      await thrupennyToken.deployed();
    });
  });
  describe("Constructor params", async () => {
    it("Should return right {FLASHLOAN ADDRESS PROVIDER}", async () => {
      const expected = "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5";
      expect(await botContract.ADDRESSES_PROVIDER()).to.equal(expected);
    });

    it("Should return right {FLASHLOAN LENDING POOL}", async () => {
      const expected = "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9";
      expect(await botContract.LENDING_POOL()).to.equal(expected);
    });
  });
  describe("swaps", async () => {
    enum SwapType {
      UNISWAP = 0,
      SUSHISWAP = 1,
    }
    it("Should revert executeSwapsWithFlashloan function because of unprofitableness", async () => {
      await thrupennyToken
        .connect(user.address)
        .mint(user1.address, ethers.utils.parseEther("1000000"));
      await thrupennyToken.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await thrupennyToken.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await wethInstance.deposit({ value: ethers.utils.parseEther("1000000") });
      await wethInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await wethInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await uniswapRouterInstance.addLiquidity(
        constants.WETH_ETH,
        thrupennyToken.address,
        ethers.utils.parseEther("20000"),
        ethers.utils.parseEther("200"),
        "0",
        "0",
        user1.address,
        "163511365136136151"
      );

      await sushiswapRouterInstance.addLiquidity(
        constants.WETH_ETH,
        thrupennyToken.address,
        ethers.utils.parseEther("200"),
        ethers.utils.parseEther("20000"),
        "0",
        "0",
        user1.address,
        "163511365136136151"
      );

      const path1 = [constants.WETH_ETH, thrupennyToken.address];
      const path2 = [thrupennyToken.address, constants.WETH_ETH];
      // create encoded string for uniswap/sushiswap arguments
      const abiCoder = new ethers.utils.AbiCoder();
      const argument1 = abiCoder.encode(["address[]"], [path1]);
      const argument2 = abiCoder.encode(["address[]"], [path2]);
      // create arguments data for swaps
      const args = [argument1, argument2];
      // create array of swap exchanges
      const swapTypes = [SwapType.UNISWAP, SwapType.SUSHISWAP];
      // create params for function call
      const params = abiCoder.encode(["bytes[]", "uint8[]"], [args, swapTypes]);

      await botContract.connect(user);
      await truffleAssert.fails(
        botContract.executeSwapsWithFlashloan(
          constants.WETH_ETH,
          ethers.utils.parseUnits("1", 18).toString(),
          ethers.utils.parseUnits("2", 18).toString(),
          "10",
          user1.address,
          params
        )
      );
    });
    it("Should not revert executeSwapWithFlashLoan function", async () => {
      thrupennyToken = await ThrupennyTokenFactory.deploy(user.address);

      await thrupennyToken
        .connect(user.address)
        .mint(user1.address, ethers.utils.parseEther("1000000"));
      await thrupennyToken.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await thrupennyToken.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await wethInstance.deposit({ value: ethers.utils.parseEther("1000000") });
      await wethInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await wethInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await uniswapRouterInstance
        .addLiquidity(
          constants.WETH_ETH,
          thrupennyToken.address,
          ethers.utils.parseEther("10000"),
          ethers.utils.parseEther("12000"),
          "0",
          "0",
          user1.address,
          "163511365136136151"
        )
        .then();
      await sushiswapRouterInstance
        .addLiquidity(
          constants.WETH_ETH,
          thrupennyToken.address,
          ethers.utils.parseEther("12000"),
          ethers.utils.parseEther("10000"),
          "0",
          "0",
          user1.address,
          "163511365136136151"
        )
        .then();

      const path1 = [constants.WETH_ETH, thrupennyToken.address];
      const path2 = [thrupennyToken.address, constants.WETH_ETH];
      // create encoded string for uniswap/sushiswap arguments
      const abiCoder = new ethers.utils.AbiCoder();
      const argument1 = abiCoder.encode(["address[]"], [path1]);
      const argument2 = abiCoder.encode(["address[]"], [path2]);
      // create arguments data for swaps
      const args = [argument1, argument2];
      // create array of swap exchanges
      const swapTypes = [SwapType.UNISWAP, SwapType.SUSHISWAP];
      // create params for function call
      const params = abiCoder.encode(["bytes[]", "uint8[]"], [args, swapTypes]);

      await botContract.connect(user);
      await truffleAssert.passes(
        botContract.executeSwapsWithFlashloan(
          constants.WETH_ETH,
          ethers.utils.parseUnits("1", 18).toString(),
          ethers.utils.parseUnits("1.4", 18).toString(),
          "10",
          user1.address,
          params
        )
      );
    });
    it("Should revert executeSwapWithFlashLoan function because of price movement", async () => {
      //   thrupennyToken = await TokenFactory.deploy();

      await thrupennyToken
        .connect(user.address)
        .mint(user1.address, ethers.utils.parseEther("1000000"));
      await thrupennyToken.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await thrupennyToken.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await wethInstance.deposit({ value: ethers.utils.parseEther("1000000") });
      await wethInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await wethInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await uniswapRouterInstance
        .addLiquidity(
          constants.WETH_ETH,
          thrupennyToken.address,
          ethers.utils.parseEther("10000"),
          ethers.utils.parseEther("10000"),
          "0",
          "0",
          user1.address,
          "163511365136136151"
        )
        .then();
      await sushiswapRouterInstance
        .addLiquidity(
          constants.WETH_ETH,
          thrupennyToken.address,
          ethers.utils.parseEther("12000"),
          ethers.utils.parseEther("10000"),
          "0",
          "0",
          user1.address,
          "163511365136136151"
        )
        .then();

      const path1 = [constants.WETH_ETH, thrupennyToken.address];
      const path2 = [thrupennyToken.address, constants.WETH_ETH];
      // create encoded string for uniswap/sushiswap arguments
      const abiCoder = new ethers.utils.AbiCoder();
      const argument1 = abiCoder.encode(["address[]"], [path1]);
      const argument2 = abiCoder.encode(["address[]"], [path2]);
      // create arguments data for swaps
      const args = [argument1, argument2];
      // create array of swap exchanges
      const swapTypes = [SwapType.UNISWAP, SwapType.SUSHISWAP];
      // create params for function call
      const params = abiCoder.encode(["bytes[]", "uint8[]"], [args, swapTypes]);

      await botContract.connect(user);
      await truffleAssert.reverts(
        botContract.executeSwapsWithFlashloan(
          constants.WETH_ETH,
          ethers.utils.parseUnits("1", 18).toString(),
          ethers.utils.parseUnits("1.4", 18).toString(),
          "10",
          user1.address,
          params
        ),
        "Transaction will not succeed either due to price movement"
      );
    });

    it("Should not revert executeSwapWithFlashLoan function", async () => {
      //   thrupennyInstance = await TokenFactory.deploy();

      await thrupennyToken
        .connect(user.address)
        .mint(user1.address, ethers.utils.parseEther("1000000"));
      await thrupennyToken.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await thrupennyToken.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await wethInstance.deposit({ value: ethers.utils.parseEther("1000000") });
      await wethInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await wethInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await uniswapRouterInstance
        .addLiquidity(
          constants.WETH_ETH,
          thrupennyToken.address,
          ethers.utils.parseEther("200"),
          ethers.utils.parseEther("2000"),
          "0",
          "0",
          user1.address,
          "163511365136136151"
        )
        .then();
      await sushiswapRouterInstance
        .addLiquidity(
          constants.WETH_ETH,
          thrupennyToken.address,
          ethers.utils.parseEther("2000"),
          ethers.utils.parseEther("200"),
          "0",
          "0",
          user1.address,
          "163511365136136151"
        )
        .then();

      const path1 = [constants.WETH_ETH, thrupennyToken.address];
      const path2 = [thrupennyToken.address, constants.WETH_ETH];
      // create encoded string for uniswap/sushiswap arguments
      const abiCoder = new ethers.utils.AbiCoder();
      const argument1 = abiCoder.encode(["address[]"], [path1]);
      const argument2 = abiCoder.encode(["address[]"], [path2]);
      // create arguments data for swaps
      const args = [argument1, argument2];
      // create array of swap exchanges
      const swapTypes = [SwapType.UNISWAP, SwapType.SUSHISWAP];
      // create params for function call
      const params = abiCoder.encode(["bytes[]", "uint8[]"], [args, swapTypes]);

      await botContract.connect(user);
      const profit = await botContract.executeSwapsWithFlashloan(
        constants.WETH_ETH,
        ethers.utils.parseUnits("1", 18).toString(),
        ethers.utils.parseUnits("2", 18).toString(),
        "10",
        user1.address,
        params
      );
      await profit.wait();
    });

    it("Should revert execution without flashloan function beacuase of approvment", async () => {
      //   tokenInstance = await TokenFactory.deploy();

      await thrupennyToken
        .connect(user.address)
        .mint(user1.address, ethers.utils.parseEther("1000000"));
      await thrupennyToken.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await thrupennyToken.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await wethInstance.deposit({ value: ethers.utils.parseEther("1000000") });
      await wethInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await wethInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await uniswapRouterInstance.addLiquidity(
        constants.WETH_ETH,
        thrupennyToken.address,
        ethers.utils.parseEther("20000"),
        ethers.utils.parseEther("200"),
        "0",
        "0",
        user1.address,
        "163511365136136151"
      );
      await sushiswapRouterInstance.addLiquidity(
        constants.WETH_ETH,
        thrupennyToken.address,
        ethers.utils.parseEther("200"),
        ethers.utils.parseEther("20000"),
        "0",
        "0",
        user1.address,
        "163511365136136151"
      );

      const path1 = [constants.WETH_ETH, thrupennyToken.address];
      const path2 = [thrupennyToken.address, constants.WETH_ETH];
      // create encoded string for uniswap/sushiswap arguments
      const abiCoder = new ethers.utils.AbiCoder();
      const argument1 = abiCoder.encode(["address[]"], [path1]);
      const argument2 = abiCoder.encode(["address[]"], [path2]);
      // create arguments data for swaps
      const args = [argument1, argument2];
      // create array of swap exchanges
      const swapTypes = [SwapType.UNISWAP, SwapType.SUSHISWAP];
      // create params for function call
      const params = abiCoder.encode(["bytes[]", "uint8[]"], [args, swapTypes]);

      await botContract.connect(user);
      await truffleAssert.reverts(
        botContract.executeSwaps(
          constants.WETH_ETH,
          ethers.utils.parseUnits("1", 18).toString(),
          ethers.utils.parseUnits("2", 18).toString(),
          "10",
          user1.address,
          params
        ),
        "SafeERC20: low-level call failed"
      );
    });

    it("Should revert execution without flashloan function because of unprofitableness", async () => {
      //   tokenInstance = await TokenFactory.deploy();

      await thrupennyToken
        .connect(user.address)
        .mint(user1.address, ethers.utils.parseEther("1000000"));
      await thrupennyToken.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await thrupennyToken.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await wethInstance.deposit({ value: ethers.utils.parseEther("1000000") });
      await wethInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await wethInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await uniswapRouterInstance.addLiquidity(
        constants.WETH_ETH,
        thrupennyToken.address,
        ethers.utils.parseEther("20000"),
        ethers.utils.parseEther("200"),
        "0",
        "0",
        user1.address,
        "163511365136136151"
      );
      await sushiswapRouterInstance.addLiquidity(
        constants.WETH_ETH,
        thrupennyToken.address,
        ethers.utils.parseEther("200"),
        ethers.utils.parseEther("20000"),
        "0",
        "0",
        user1.address,
        "163511365136136151"
      );

      await wethInstance.approve(botContract.address, ethers.utils.parseEther("100"));

      const path1 = [constants.WETH_ETH, thrupennyToken.address];
      const path2 = [thrupennyToken.address, constants.WETH_ETH];
      // create encoded string for uniswap/sushiswap arguments
      const abiCoder = new ethers.utils.AbiCoder();
      const argument1 = abiCoder.encode(["address[]"], [path1]);
      const argument2 = abiCoder.encode(["address[]"], [path2]);
      // create arguments data for swaps
      const args = [argument1, argument2];
      // create array of swap exchanges
      const swapTypes = [SwapType.UNISWAP, SwapType.SUSHISWAP];
      // create params for function call
      const params = abiCoder.encode(["bytes[]", "uint8[]"], [args, swapTypes]);

      await botContract.connect(user);
      await truffleAssert.fails(
        botContract.executeSwaps(
          constants.WETH_ETH,
          ethers.utils.parseUnits("1", 18).toString(),
          ethers.utils.parseUnits("2", 18).toString(),
          "10",
          user1.address,
          params
        )
      );
    });

    it("Should not revert execution without flashloan", async () => {
      //   tokenInstance = await TokenFactory.deploy();

      await thrupennyToken
        .connect(user.address)
        .mint(user1.address, ethers.utils.parseEther("1000000"));
      await thrupennyToken.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await thrupennyToken.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await wethInstance.deposit({ value: ethers.utils.parseEther("1000000") });
      await wethInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await wethInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await uniswapRouterInstance.addLiquidity(
        constants.WETH_ETH,
        thrupennyToken.address,
        ethers.utils.parseEther("200"),
        ethers.utils.parseEther("20000"),
        "0",
        "0",
        user1.address,
        "163511365136136151"
      );
      await sushiswapRouterInstance.addLiquidity(
        constants.WETH_ETH,
        thrupennyToken.address,
        ethers.utils.parseEther("20000"),
        ethers.utils.parseEther("200"),
        "0",
        "0",
        user1.address,
        "163511365136136151"
      );

      await wethInstance.approve(botContract.address, ethers.utils.parseEther("100"));

      const path1 = [constants.WETH_ETH, thrupennyToken.address];
      const path2 = [thrupennyToken.address, constants.WETH_ETH];
      // create encoded string for uniswap/sushiswap arguments
      const abiCoder = new ethers.utils.AbiCoder();
      const argument1 = abiCoder.encode(["address[]"], [path1]);
      const argument2 = abiCoder.encode(["address[]"], [path2]);
      // create arguments data for swaps
      const args = [argument1, argument2];
      // create array of swap exchanges
      const swapTypes = [SwapType.UNISWAP, SwapType.SUSHISWAP];
      // create params for function call
      const params = abiCoder.encode(["bytes[]", "uint8[]"], [args, swapTypes]);

      await botContract.connect(user);
      await truffleAssert.passes(
        botContract.executeSwaps(
          constants.WETH_ETH,
          ethers.utils.parseUnits("1", 18).toString(),
          ethers.utils.parseUnits("2", 18).toString(),
          "10",
          user1.address,
          params
        )
      );
    });

    it("should execute Operations", async () => {
      //##TODO
      let amount = await thrupennyToken
        .connect(user.address)
        .mint(user1.address, ethers.utils.parseEther("1000000"));
      let amount1 = await thrupennyToken.approve(
        constants.UNISWAP,
        ethers.utils.parseEther("100000")
      );
      let amount2 = await thrupennyToken.approve(
        constants.SUSHISWAP,
        ethers.utils.parseEther("100000")
      );

      await wethInstance.deposit({ value: ethers.utils.parseEther("1000000") });
      await wethInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await wethInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      const path1 = [constants.WETH_ETH, thrupennyToken.address];
      const path2 = [thrupennyToken.address, constants.WETH_ETH];
      const amounts = [amount, amount1];
      const premiums = [0, 0];
      // create encoded string for uniswap/sushiswap arguments
      const abiCoder = new ethers.utils.AbiCoder();
      const argument1 = abiCoder.encode(["address[]"], [path1]);
      const argument2 = abiCoder.encode(["address[]"], [path2]);
      // create arguments data for swaps
      const args = [argument1, argument2];
      // create array of swap exchanges
      const swapTypes = [SwapType.UNISWAP, SwapType.SUSHISWAP];
      // create params for function call
      const params = abiCoder.encode(["bytes[]", "uint8[]"], [args, swapTypes]);
      await botContract
        .connect("0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9")
        .executeOperation(path1, amounts, premiums, constants.gnosisSafeAddress, params);
    });
    it("should withdraw the funds", async () => {
      await thrupennyToken
        .connect(user.address)
        .mint(user1.address, ethers.utils.parseEther("1000000"));
      await thrupennyToken.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await thrupennyToken.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await wethInstance.deposit({ value: ethers.utils.parseEther("1000000") });
      await wethInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await wethInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));
      await botContract.connect(user.address).withdrawERC20(thrupennyToken.address, "10000");
    });
    it("should get balance of the contract", async () => {
      await thrupennyToken
        .connect(user.address)
        .mint(user1.address, ethers.utils.parseEther("1000000"));
      await thrupennyToken.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await thrupennyToken.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await wethInstance.deposit({ value: ethers.utils.parseEther("1000000") });
      await wethInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await wethInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      let answer = await botContract.connect(user.address).getBalanceERC20(thrupennyToken.address);
      console.log(answer);
    });
  });
});
