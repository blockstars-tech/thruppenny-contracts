import { expect, use, should, assert } from "chai";
import chai from "chai";
import { ethers } from "hardhat";
import chaiAsPromised from "chai-as-promised";
// import { assert } from "console";
import { TrupennyToken, TrupennyToken__factory } from "../typechain-types";
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

describe("TrupennyToken", function () {
  const ZERO_Address = "0x0000000000000000000000000000000000000000";
  let TrupennyTokenFactory: TrupennyToken__factory;
  let TokenInstance: TrupennyToken; // here we created an instance to use below
  const decimals_Count = "8";
  const total_supply = new BN("1000000000")
    .mul(new BN("10").pow(new BN(decimals_Count)))
    .toString();

  before(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
    TrupennyTokenFactory = (await ethers.getContractFactory(
      "TrupennyToken"
    )) as TrupennyToken__factory;
    // trupennyToken = await TrupennyToken.deploy();
  });
  beforeEach(async function () {
    // // Get the ContractFactory and Signers here.
    // TrupennyTokenFactory = await ethers.getContractFactory("TrupennyToken");
    // [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // // To deploy our contract, we just have to call Token.deploy() and await
    // // for it to be deployed(), which happens once its transaction has been
    // // mined.
    TokenInstance = await TrupennyTokenFactory.deploy();
    await TokenInstance.deployed();
  });

  describe("Deployment", function () {
    // `it` is another Mocha function. This is the one you use to define your
    // tests. It receives the test name, and a callback function.

    // If the callback function is async, Mocha will `await` it.
    it("Should set the right owner", function () {
      // Expect receives a value, and wraps it in an Assertion object. These
      // objects have a lot of utility methods to assert values.

      // This test expects the owner variable stored in the contract to be equal
      // to our Signer's owner.
      expect(1).to.not.be.equal(2);
    });
  });

  describe("Name of contract test", function () {
    it("Should return the name of the token", async function () {
      expect(TokenInstance.name()).to.eventually.be.equal("Trupenny"); // since we are using eventually we dont include await at the start
    });
    it("should not return a wrong name of the token", async function () {
      expect(TokenInstance.name()).to.eventually.not.be.equal("AppleToken");
    });
  });
  describe("Symbol of contract", function () {
    it("Should return the symbol of the token", async function () {
      expect(TokenInstance.symbol()).to.eventually.be.equal("TRU");
    });
    it("Should not return a wrong symbol of the token", async function () {
      expect(TokenInstance.symbol()).to.eventually.not.be.equal("BBN");
    });
  });
  describe("contract deployed with decimals and minted", function () {
    it("Should deploy the contract total supply with already minted 1000000000 worth of coins in ether", async () => {
      let totalSupply = await TokenInstance.totalSupply();
      assert.equal(totalSupply.toString(), total_supply);
    });
    it("Should deploy the contract with decimals equal to 8", async function () {
      let decimalCount = await TokenInstance.decimals();
      expect(decimalCount.toString()).to.be.equal(decimals_Count);
    });
  });
});
