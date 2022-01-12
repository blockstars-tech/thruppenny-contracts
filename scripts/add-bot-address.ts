import { artifacts } from 'hardhat';

const SecurityContract = artifacts.require("SecurityContract");

const main = async () => {
  const botAddress = "0x804aEfDa8B4EDF70549bC24B6a9bd8070b8377ee"
  const securityContract = await SecurityContract.at("0x22A9505f69c36404a7d4E018Bb527DBcD5F6fF33");

  await securityContract.setBotAddress(botAddress);
};

main()
  .then(() => console.log("success"))
  .catch((err) => console.log(err));
