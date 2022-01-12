import { artifacts } from "hardhat";

const SecurityContract = artifacts.require("SecurityContract");

const main = async () => {
  const securityContract = await SecurityContract.new();
  console.log("security address is ->", securityContract.address);
};

main().then(() => console.log("success"));
