// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy

  console.log("deploying TestUSDC...");

  const USDCToken = await hre.ethers.getContractFactory("TestUSDC");
  const uSDCToken = await USDCToken.deploy();
  
  await uSDCToken.deployed();
  
  console.log("TestUSDC deployed to: ", uSDCToken.address);
  //=======================
  console.log("deploying TPYToken...");

  const TPYToken = await hre.ethers.getContractFactory("TPYToken");
  const tPYToken = await TPYToken.deploy();
  
  await tPYToken.deployed();
  
  console.log("TPYToken deployed to: ", tPYToken.address);
  //=======================
  console.log("deploying TestVault...");

  const TestVault = await hre.ethers.getContractFactory("TestVault");
  const testVault = await TestVault.deploy(uSDCToken.address);
  
  await testVault.deployed();
  
  console.log("TestVault deployed to: ", testVault.address);
  //=======================
  console.log("deploying TestUSDCStrategy...");
  const TestUSDCStrategy = await hre.ethers.getContractFactory("TestUSDCStrategy");
  const testUSDCStrategy = await TestUSDCStrategy.deploy();
  
  await testUSDCStrategy.deployed();
  
  console.log("TestUSDCStrategy deployed to: ", testUSDCStrategy.address);
  //=======================
  console.log("deploying TPCore...");

  const TPCore = await hre.ethers.getContractFactory("TPCore");
  const tPCore = await TPCore.deploy(uSDCToken.address, tPYToken.address, testUSDCStrategy.address);
  
  await tPCore.deployed();
  
  console.log("TPCore deployed to: ", tPCore.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
