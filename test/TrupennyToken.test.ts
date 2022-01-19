import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { TrupennyToken, TrupennyToken__factory } from '../typechain-types';
import BN from 'bn.js';

const expectedName = 'Trupenny';
const expectedSymbol = 'TRU';
const expectedDecimals = 8;
const expectedTotalSupply = new BN('1000000000')
  .mul(new BN('10').pow(new BN(expectedDecimals)))
  .toString();

let trupennyToken: TrupennyToken;
let owner: SignerWithAddress;

describe('TrupennyToken Contract', () => {
  beforeEach(async () => {
		[owner] = await ethers.getSigners();

		const trupennyTokenFactory = (await ethers.getContractFactory(
			'TrupennyToken', owner
		)) as TrupennyToken__factory;

		trupennyToken = await trupennyTokenFactory.deploy();
		await trupennyToken.deployed();
	});

  describe('Deployment', () => {
    it('Should test default total supply', async function () {
      expect(await trupennyToken.totalSupply()).to.equal(expectedTotalSupply);
    });

    it('Should test token attributes', async function() {
      expect(await trupennyToken.name()).to.equal(expectedName);
      expect(await trupennyToken.symbol()).to.equal(expectedSymbol);
      expect(await trupennyToken.decimals()).to.equal(expectedDecimals);
    });
  });
});
