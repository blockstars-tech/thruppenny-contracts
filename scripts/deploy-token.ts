import { ethers } from 'hardhat';

const { GNOSIS_SAFE_ADDRESS } = process.env;

if (!GNOSIS_SAFE_ADDRESS) {
  throw new Error('Please provide the gnosis safe address!');
}

const main = async () => {
  const TrupennyToken = await ethers.getContractFactory('TrupennyToken');
  const token = await TrupennyToken.deploy(GNOSIS_SAFE_ADDRESS);

  await token.deployed();
  console.log('TrupennyToken deployed to:', token.address);
};

main()
  .then(() => process.exit(0))
  .catch((err) => console.log(err));

export default {};
