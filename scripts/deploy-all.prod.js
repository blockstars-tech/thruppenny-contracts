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

  // console.log("deploying TestUSDC...");

  // const USDCToken = await hre.ethers.getContractFactory("TestUSDC");
  // const uSDCToken = await USDCToken.deploy();
  
  // await uSDCToken.deployed();
  
  // console.log("TestUSDC deployed to: ", uSDCToken.address);
  let stakingToken = { address: "USDCAddress" };
  //=======================
  console.log("deploying TPYToken...");

  const TPYToken = await hre.ethers.getContractFactory("TPYToken");
  const tpyToken = await TPYToken.deploy();
  
  await tpyToken.deployed();
  
  console.log("TPYToken deployed to: ", tpyToken.address);
  //let tpyToken = { address: "tpyAddress" };

  //=======================
  // console.log("deploying TestVault...");

  // const TestVault = await hre.ethers.getContractFactory("TestVault");
  // const testVault = await TestVault.deploy(uSDCToken.address);
  
  // await testVault.deployed();
  
  // console.log("TestVault deployed to: ", testVault.address);
  //=======================
  console.log("deploying USDCStrategy...");
  const USDCStrategy = await hre.ethers.getContractFactory("USDCStrategy");
  const uSDCStrategy = await USDCStrategy.deploy();
  
  await uSDCStrategy.deployed();
  
  console.log("USDCStrategy deployed to: ", uSDCStrategy.address);
  //=======================
  console.log("deploying TPCore...");

  const TPCore = await hre.ethers.getContractFactory("TPCore");
  const tPCore = await TPCore.deploy(stakingToken.address, tpyToken.address, uSDCStrategy.address);
  
  await tPCore.deployed();
  
  console.log("TPCore deployed to: ", tPCore.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
