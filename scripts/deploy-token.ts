import { ethers } from 'hardhat';

const { GNOSIS_SAFE_ADDRESS } = process.env;

if (!GNOSIS_SAFE_ADDRESS) {
  throw new Error('Please provide the gnosis safe address!');
}

const main = async () => {
  const GnosisSafeTransactionService = await ethers.getContractFactory('GnosisSafeTransactionService');
  const contract = await GnosisSafeTransactionService.deploy(GNOSIS_SAFE_ADDRESS);

  await contract.deployed();
  console.log('GnosisSafeTransactionService deployed to:', contract.address);

  const TrupennyToken = await ethers.getContractFactory('TrupennyToken');
  const token = await TrupennyToken.deploy(contract.address);

  await token.deployed();
  console.log('TrupennyToken deployed to:', token.address);
};

main()
  .then(() => process.exit(0))
  .catch((err) => console.log(err));

export default {};
