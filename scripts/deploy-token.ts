import { ethers } from 'hardhat';

const { GNOSIS_SAFE_ADDRESS } = process.env;

if (!GNOSIS_SAFE_ADDRESS) {
  throw new Error('Please provide the gnosis safe address!');
}

const main = async () => {
  const ThrupennyToken = await ethers.getContractFactory('ThrupennyToken');
  const token = await ThrupennyToken.deploy(GNOSIS_SAFE_ADDRESS);

  await token.deployed();
  console.log('Thrupenny deployed to:', token.address);
};

main()
  .then(() => process.exit(0))
  .catch((err) => console.log(err));

export default {};
