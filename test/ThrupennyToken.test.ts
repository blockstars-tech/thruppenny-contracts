import { ethers } from "hardhat";
import chai from "chai";
import BN from "bn.js";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  ThrupennyToken,
  ThrupennyToken__factory,
} from "../typechain-types";

const { expect } = chai;

let deployer: SignerWithAddress;
let user1: SignerWithAddress;
let user2: SignerWithAddress;

const gnosisSafeAddress = '0xA5aA45285830a49d90a4bC3b12689C8FdEC84e32';
const expectedName = "Thrupenny";
const expectedSymbol = "TRU";
const expectedDecimals = 8;
const expectedTotalSupply = new BN("1000000000")
  .mul(new BN("10").pow(new BN(expectedDecimals)))
  .toString();

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
      expect(await thrupennyToken.balanceOf(gnosisSafeAddress)).to.be.equal(
        expectedTotalSupply
      );
    });
  });
});
