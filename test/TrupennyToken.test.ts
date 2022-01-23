import { ethers } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import BN from "bn.js";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  TrupennyToken,
  TrupennyToken__factory,
  GnosisSafeTransactionService,
  GnosisSafeTransactionService__factory,
} from "../typechain-types";

const { expect, use } = chai;

use(chaiAsPromised);
chai.should();

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
    let TrupennyTokenFactory: TrupennyToken__factory;
    let trupennyToken: TrupennyToken; // here we created an instance to use below

    before(async () => {
      [deployer, user1, user2] = await ethers.getSigners();

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

    describe("Should check balance at deployment", async () => {
      it("Should mint 1000000000 *10*8 to constructor address", async function () {
        expect(await trupennyToken.balanceOf(gnosisSafeTransactionService.address)).to.be.equal(
          expectedTotalSupply
        );
      });
    });

    describe("Transfer", async () => {
      it("Should not allow user1 to transfer", async function () {
        let transferAmount = new BN("1000").mul(new BN("10").pow(new BN(expectedDecimals)));
        await expect(
          gnosisSafeTransactionService
            .connect(user1)
            .safeTransfer(trupennyToken.address, user1.address, transferAmount.toString())
        ).to.eventually.be.rejectedWith(Error, "Forbidden: the caller is not the safe address");
      });

      it("Should allow only gnosis to transfer", async function () {
        let transferAmount = new BN("1000").mul(new BN("10").pow(new BN(expectedDecimals)));
        await gnosisSafeTransactionService
          .connect(user2)
          .safeTransfer(trupennyToken.address, user1.address, transferAmount.toString());
        expect(await trupennyToken.balanceOf(user1.address)).to.be.equal(
          transferAmount.toString()
        );
      });
    });
  });
});
