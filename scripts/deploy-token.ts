import { artifacts } from "hardhat";

const TrupennyToken = artifacts.require("TrupennyToken");

const main = async () => {
  const token = await TrupennyToken.new();

  console.log("TRU address is ->", token.address);
};

main()
  .then(() => process.exit(0))
  .catch((err) => console.log(err));

export default {};
