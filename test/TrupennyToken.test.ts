import { ethers } from "hardhat";
import chai from "chai";
import BN from "bn.js";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  TrupennyToken,
  TrupennyToken__factory,
} from "../typechain-types";

const { expect, use } = chai;

let deployer: SignerWithAddress;
let user1: SignerWithAddress;
let user2: SignerWithAddress;

const gnosisSafeAddress = '0xA5aA45285830a49d90a4bC3b12689C8FdEC84e32';
const expectedName = "Trupenny";
const expectedSymbol = "TRU";
const expectedDecimals = 8;
const expectedTotalSupply = new BN("1000000000")
  .mul(new BN("10").pow(new BN(expectedDecimals)))
  .toString();

describe("TrupennyToken Contract", () => {
  let TrupennyTokenFactory: TrupennyToken__factory;
  let trupennyToken: TrupennyToken;

  before(async () => {
    [deployer, user1, user2] = await ethers.getSigners();

    TrupennyTokenFactory = (await ethers.getContractFactory(
      "TrupennyToken"
    )) as TrupennyToken__factory;
  });

  beforeEach(async function () {
    trupennyToken = await TrupennyTokenFactory.deploy(gnosisSafeAddress);
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

  describe("Should check balance at deployment", async () => {
    it("Should mint 1000000000 *10*8 to constructor address", async function () {
      expect(await trupennyToken.balanceOf(gnosisSafeAddress)).to.be.equal(
        expectedTotalSupply
      );
    });
  });
});
