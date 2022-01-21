import { expect, use, should, assert } from "chai";
import chai from "chai";
import { ethers } from "hardhat";
import chaiAsPromised from "chai-as-promised";
// import { assert } from "console";
import {
  TrupennyToken,
  TrupennyToken__factory,
  GnosisSafeTransactionService,
  GnosisSafeTransactionService__factory,
} from "../typechain-types";
import BN from "bn.js";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { chownSync } from "fs";
import { BigNumber } from "@ethersproject/bignumber";

use(chaiAsPromised);
chai.should();

let accounts: SignerWithAddress[];
let deployer: SignerWithAddress;

let user1: SignerWithAddress;
let user2: SignerWithAddress;

const expectedName = "Trupenny";
const expectedSymbol = "TRU";
const expectedDecimals = 8;
const expectedTotalSupply = new BN("1000000000")
  .mul(new BN("10").pow(new BN(expectedDecimals)))
  .toString();

describe("GnosisSafeTransactionService", () => {
  let GnosisSafeTransactionServiceFactory: GnosisSafeTransactionService__factory;
  let gnosisSafeTransactionService: GnosisSafeTransactionService;
  before(async () => {
    GnosisSafeTransactionServiceFactory = (await ethers.getContractFactory(
      "GnosisSafeTransactionService"
    )) as GnosisSafeTransactionService__factory;
  });
  describe("TrupennyToken Contract", () => {
    const ZERO_Address = "0x0000000000000000000000000000000000000000";
    let TrupennyTokenFactory: TrupennyToken__factory;
    let trupennyToken: TrupennyToken; // here we created an instance to use below
    before(async () => {
      accounts = await ethers.getSigners();
      deployer = accounts[0];
      user1 = accounts[1];
      user2 = accounts[2];

      TrupennyTokenFactory = (await ethers.getContractFactory(
        "TrupennyToken"
      )) as TrupennyToken__factory;
      gnosisSafeTransactionService = await GnosisSafeTransactionServiceFactory.deploy(
        user2.address
      );
    });
    beforeEach(async function () {
      trupennyToken = await TrupennyTokenFactory.deploy(gnosisSafeTransactionService.address);
      await trupennyToken.deployed();
    });

    describe("Deployment", () => {
      it("Should test default total supply", async function () {
        expect(await trupennyToken.totalSupply()).to.equal(expectedTotalSupply);
      });

      it("Should test token attributes", async function () {
        expect(await trupennyToken.name()).to.equal(expectedName);
        expect(await trupennyToken.symbol()).to.equal(expectedSymbol);
        expect(await trupennyToken.decimals()).to.equal(expectedDecimals);
      });
    });
    describe("Name of contract test", function () {
      it("Should return the name of the token", async function () {
        expect(trupennyToken.name()).to.eventually.be.equal("Trupenny"); // since we are using eventually we dont include await at the start
      });
      it("should not return a wrong name of the token", async function () {
        expect(trupennyToken.name()).to.eventually.not.be.equal("AppleToken");
      });
    });
    describe("Symbol of contract", function () {
      it("Should return the symbol of the token", async function () {
        expect(trupennyToken.symbol()).to.eventually.be.equal("TRU");
      });
      it("Should not return a wrong symbol of the token", async function () {
        expect(trupennyToken.symbol()).to.eventually.not.be.equal("BBN");
      });
    });
    describe("contract deployed with decimals and minted", function () {
      it("Should deploy the contract total supply with already minted 1000000000 worth of coins in ether", async () => {
        let totalSupply = await trupennyToken.totalSupply();
        assert.equal(totalSupply.toString(), expectedTotalSupply);
      });
      it("Should deploy the contract with decimals equal to 8", async function () {
        let decimalCount = await trupennyToken.decimals();
        expect(decimalCount).to.be.equal(expectedDecimals);
      });
    });
    describe("Should check balance at deployment", async () => {
      it("should mint 1000000000 *10*18 to constructor address", async function () {
        expect(await trupennyToken.balanceOf(gnosisSafeTransactionService.address)).to.be.equal(
          expectedTotalSupply
        );
      });
    });
    describe("should check if wrong balance during construction", async () => {
      it("should check for wrong amount", async () => {
        const expectedWrongTotalSupply = new BN("1000099000")
          .mul(new BN("10").pow(new BN(expectedDecimals)))
          .toString();
        expect(await trupennyToken.balanceOf(gnosisSafeTransactionService.address)).to.not.be.equal(
          expectedWrongTotalSupply
        );
      });
    });
    describe("Transfer", async () => {
      it("Should not allow user1 to transfer", async function () {
        let transfer_amount = new BN("1000").mul(new BN("10").pow(new BN(expectedDecimals)));
        await expect(
          gnosisSafeTransactionService
            .connect(user1)
            .safeTransfer(trupennyToken.address, user1.address, transfer_amount.toString())
        ).to.eventually.be.rejectedWith(Error, "Forbidden: the caller is not the safe address");
      });
      it("Should allow only gnosis to transfer", async function () {
        let transfer_amount = new BN("1000").mul(new BN("10").pow(new BN(expectedDecimals)));
        await gnosisSafeTransactionService
          .connect(user2)
          .safeTransfer(trupennyToken.address, user1.address, transfer_amount.toString());
        expect(await trupennyToken.balanceOf(user1.address)).to.be.equal(
          transfer_amount.toString()
        );
      });
    });
  });
});
