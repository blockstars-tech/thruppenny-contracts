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
  ERC20Token,
  ERC20Token__factory,
  IUniswapV2Router02,
  IUniswapV2Router02__factory,
} from "../typechain-types";

const truffleAssert = require("truffle-assertions");

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

let accounts: SignerWithAddress[];
let user: SignerWithAddress;

let DEXFactory: BotContract__factory;
let DEXContract: BotContract;

let UniswapRouterFactory: IUniswapV2Router02__factory;

let uniswapRouterInstance: IUniswapV2Router02;
let sushiswapRouterInstance: IUniswapV2Router02;

let TokenFactory: ERC20Token__factory;
let tokenInstance: ERC20Token;

let wethInstance: any;

describe("Dex", () => {
  before(async () => {
    accounts = await ethers.getSigners();
    user = accounts[0];

    UniswapRouterFactory = await ethers.getContractFactory("UniswapV2Router02");

    uniswapRouterInstance = UniswapRouterFactory.attach(constants.UNISWAP);
    sushiswapRouterInstance = UniswapRouterFactory.attach(constants.SUSHISWAP);

    TokenFactory = await ethers.getContractFactory("ERC20Token");
    tokenInstance = await TokenFactory.deploy();
    await tokenInstance.deployed();

    let WETHFactory = await ethers.getContractFactory("WETH9_");
    wethInstance = WETHFactory.attach(constants.WETH_ETH);

    DEXFactory = await ethers.getContractFactory("BotContract");
    DEXContract = await DEXFactory.deploy();
    await DEXContract.deployed();
  });

  describe("Constructor params", async () => {
    it("Should return right {FLASHLOAN ADDRESS PROVIDER}", async () => {
      const expected = "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5";
      const actual = await DEXContract.ADDRESSES_PROVIDER();

      assert.equal(actual, expected);
    });

    it("Should return right {FLASHLOAN LENDING POOL}", async () => {
      const expected = "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9";
      const actual = await DEXContract.LENDING_POOL();

      assert.equal(actual, expected);
    });
  });
  describe("Swaps", () => {
    enum SwapType {
      UNISWAP = 0,
      SUSHISWAP = 1,
    }

    it("Should revert executeSwapsWithFlashloan function beacuse of unprofitableness", async () => {
      tokenInstance = await TokenFactory.deploy();

      await tokenInstance.mint(user.address, ethers.utils.parseEther("1000000"));
      await tokenInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await tokenInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await wethInstance.deposit({ value: ethers.utils.parseEther("1000000") });
      await wethInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await wethInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await uniswapRouterInstance.addLiquidity(
        constants.WETH_ETH,
        tokenInstance.address,
        ethers.utils.parseEther("20000"),
        ethers.utils.parseEther("200"),
        "0",
        "0",
        user.address,
        "163511365136136151"
      );
      await sushiswapRouterInstance.addLiquidity(
        constants.WETH_ETH,
        tokenInstance.address,
        ethers.utils.parseEther("200"),
        ethers.utils.parseEther("20000"),
        "0",
        "0",
        user.address,
        "163511365136136151"
      );

      const path1 = [constants.WETH_ETH, tokenInstance.address];
      const path2 = [tokenInstance.address, constants.WETH_ETH];
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

      await DEXContract.connect(user);
      await truffleAssert.fails(
        DEXContract.executeSwapsWithFlashloan(
          constants.WETH_ETH,
          ethers.utils.parseUnits("1", 18).toString(),
          ethers.utils.parseUnits("2", 18).toString(),
          "10",
          params
        )
      );
    });

    it("Should not revert executeSwapWithFlashLoan function", async () => {
      tokenInstance = await TokenFactory.deploy();

      await tokenInstance.mint(user.address, ethers.utils.parseEther("1000000"));
      await tokenInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await tokenInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await wethInstance.deposit({ value: ethers.utils.parseEther("1000000") });
      await wethInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await wethInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await uniswapRouterInstance
        .addLiquidity(
          constants.WETH_ETH,
          tokenInstance.address,
          ethers.utils.parseEther("10000"),
          ethers.utils.parseEther("12000"),
          "0",
          "0",
          user.address,
          "163511365136136151"
        )
        .then();
      await sushiswapRouterInstance
        .addLiquidity(
          constants.WETH_ETH,
          tokenInstance.address,
          ethers.utils.parseEther("12000"),
          ethers.utils.parseEther("10000"),
          "0",
          "0",
          user.address,
          "163511365136136151"
        )
        .then();

      const path1 = [constants.WETH_ETH, tokenInstance.address];
      const path2 = [tokenInstance.address, constants.WETH_ETH];
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

      await DEXContract.connect(user);
      await truffleAssert.passes(
        DEXContract.executeSwapsWithFlashloan(
          constants.WETH_ETH,
          ethers.utils.parseUnits("1", 18).toString(),
          ethers.utils.parseUnits("1.4", 18).toString(),
          "10",
          params
        )
      );
    });

    it("Should revert executeSwapWithFlashLoan function because of price movement", async () => {
      tokenInstance = await TokenFactory.deploy();

      await tokenInstance.mint(user.address, ethers.utils.parseEther("1000000"));
      await tokenInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await tokenInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await wethInstance.deposit({ value: ethers.utils.parseEther("1000000") });
      await wethInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await wethInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await uniswapRouterInstance
        .addLiquidity(
          constants.WETH_ETH,
          tokenInstance.address,
          ethers.utils.parseEther("10000"),
          ethers.utils.parseEther("10000"),
          "0",
          "0",
          user.address,
          "163511365136136151"
        )
        .then();
      await sushiswapRouterInstance
        .addLiquidity(
          constants.WETH_ETH,
          tokenInstance.address,
          ethers.utils.parseEther("12000"),
          ethers.utils.parseEther("10000"),
          "0",
          "0",
          user.address,
          "163511365136136151"
        )
        .then();

      const path1 = [constants.WETH_ETH, tokenInstance.address];
      const path2 = [tokenInstance.address, constants.WETH_ETH];
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

      await DEXContract.connect(user);
      await truffleAssert.reverts(
        DEXContract.executeSwapsWithFlashloan(
          constants.WETH_ETH,
          ethers.utils.parseUnits("1", 18).toString(),
          ethers.utils.parseUnits("1.4", 18).toString(),
          "10",
          params
        ),
        "Transaction will not succeed either due to price movement"
      );
    });

    it("Should not revert executeSwapWithFlashLoan function", async () => {
      tokenInstance = await TokenFactory.deploy();

      await tokenInstance.mint(user.address, ethers.utils.parseEther("1000000"));
      await tokenInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await tokenInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await wethInstance.deposit({ value: ethers.utils.parseEther("1000000") });
      await wethInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await wethInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await uniswapRouterInstance
        .addLiquidity(
          constants.WETH_ETH,
          tokenInstance.address,
          ethers.utils.parseEther("200"),
          ethers.utils.parseEther("2000"),
          "0",
          "0",
          user.address,
          "163511365136136151"
        )
        .then();
      await sushiswapRouterInstance
        .addLiquidity(
          constants.WETH_ETH,
          tokenInstance.address,
          ethers.utils.parseEther("2000"),
          ethers.utils.parseEther("200"),
          "0",
          "0",
          user.address,
          "163511365136136151"
        )
        .then();

      const path1 = [constants.WETH_ETH, tokenInstance.address];
      const path2 = [tokenInstance.address, constants.WETH_ETH];
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

      await DEXContract.connect(user);
      const profit = await DEXContract.executeSwapsWithFlashloan(
        constants.WETH_ETH,
        ethers.utils.parseUnits("1", 18).toString(),
        ethers.utils.parseUnits("2", 18).toString(),
        "10",
        params
      );
      await profit.wait();
    });

    it("Should revert execution without flashloan function beacuase of approvment", async () => {
      tokenInstance = await TokenFactory.deploy();

      await tokenInstance.mint(user.address, ethers.utils.parseEther("1000000"));
      await tokenInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await tokenInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await wethInstance.deposit({ value: ethers.utils.parseEther("1000000") });
      await wethInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await wethInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await uniswapRouterInstance.addLiquidity(
        constants.WETH_ETH,
        tokenInstance.address,
        ethers.utils.parseEther("20000"),
        ethers.utils.parseEther("200"),
        "0",
        "0",
        user.address,
        "163511365136136151"
      );
      await sushiswapRouterInstance.addLiquidity(
        constants.WETH_ETH,
        tokenInstance.address,
        ethers.utils.parseEther("200"),
        ethers.utils.parseEther("20000"),
        "0",
        "0",
        user.address,
        "163511365136136151"
      );

      const path1 = [constants.WETH_ETH, tokenInstance.address];
      const path2 = [tokenInstance.address, constants.WETH_ETH];
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

      await DEXContract.connect(user);
      await truffleAssert.reverts(
        DEXContract.executeSwaps(
          constants.WETH_ETH,
          ethers.utils.parseUnits("1", 18).toString(),
          ethers.utils.parseUnits("2", 18).toString(),
          "10",
          params
        ),
        "SafeERC20: low-level call failed"
      );
    });

    it("Should revert execution without flashloan function beacuse of unprofitableness", async () => {
      tokenInstance = await TokenFactory.deploy();

      await tokenInstance.mint(user.address, ethers.utils.parseEther("1000000"));
      await tokenInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await tokenInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await wethInstance.deposit({ value: ethers.utils.parseEther("1000000") });
      await wethInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await wethInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await uniswapRouterInstance.addLiquidity(
        constants.WETH_ETH,
        tokenInstance.address,
        ethers.utils.parseEther("20000"),
        ethers.utils.parseEther("200"),
        "0",
        "0",
        user.address,
        "163511365136136151"
      );
      await sushiswapRouterInstance.addLiquidity(
        constants.WETH_ETH,
        tokenInstance.address,
        ethers.utils.parseEther("200"),
        ethers.utils.parseEther("20000"),
        "0",
        "0",
        user.address,
        "163511365136136151"
      );

      await wethInstance.approve(DEXContract.address, ethers.utils.parseEther("100"));

      const path1 = [constants.WETH_ETH, tokenInstance.address];
      const path2 = [tokenInstance.address, constants.WETH_ETH];
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

      await DEXContract.connect(user);
      await truffleAssert.fails(
        DEXContract.executeSwaps(
          constants.WETH_ETH,
          ethers.utils.parseUnits("1", 18).toString(),
          ethers.utils.parseUnits("2", 18).toString(),
          "10",
          params
        )
      );
    });

    it("Should not revert execution without flashloan", async () => {
      tokenInstance = await TokenFactory.deploy();

      await tokenInstance.mint(user.address, ethers.utils.parseEther("1000000"));
      await tokenInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await tokenInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await wethInstance.deposit({ value: ethers.utils.parseEther("1000000") });
      await wethInstance.approve(constants.UNISWAP, ethers.utils.parseEther("100000"));
      await wethInstance.approve(constants.SUSHISWAP, ethers.utils.parseEther("100000"));

      await uniswapRouterInstance.addLiquidity(
        constants.WETH_ETH,
        tokenInstance.address,
        ethers.utils.parseEther("200"),
        ethers.utils.parseEther("20000"),
        "0",
        "0",
        user.address,
        "163511365136136151"
      );
      await sushiswapRouterInstance.addLiquidity(
        constants.WETH_ETH,
        tokenInstance.address,
        ethers.utils.parseEther("20000"),
        ethers.utils.parseEther("200"),
        "0",
        "0",
        user.address,
        "163511365136136151"
      );

      await wethInstance.approve(DEXContract.address, ethers.utils.parseEther("100"));

      const path1 = [constants.WETH_ETH, tokenInstance.address];
      const path2 = [tokenInstance.address, constants.WETH_ETH];
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

      await DEXContract.connect(user);
      await truffleAssert.passes(
        DEXContract.executeSwaps(
          constants.WETH_ETH,
          ethers.utils.parseUnits("1", 18).toString(),
          ethers.utils.parseUnits("2", 18).toString(),
          "10",
          params
        )
      );
    });
  });
});
