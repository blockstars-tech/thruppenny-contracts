const { expect } = require('chai');
const equal = require('fast-deep-equal');
const { ethers, tasks } = require('hardhat');
const console = require('console');
const {

  BigNumber,

  FixedFormat,
  FixedNumber,

  formatFixed,

  parseFixed,

  // Types

  BigNumberish

} = require("@ethersproject/bignumber");
//const BigNumber = require('bignumber');
//console.log(process.env.ownerAddress);
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function deployContract(contract, args) {
  console.log(`deploying ${contract}...`);

  let Token = await ethers.getContractFactory(contract);
  let token;
  if(args) {
    console.log(`with args ${args}...`);
    token = await Token.deploy.apply(Token, args);
  }
  else {
    token = await Token.deploy();
  }

  await token.deployed();

  console.log(`${contract} deployed to: `, token.address);

  return token;
}




describe('TP contarct', () => {
    let usdc, tpy, vault, strategy, tpCore;
    let owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8;

    let executeScenario = async (scenarioData) => {

      // Transfer 120 USDC to user 1
      const initialBalance = await usdc.balanceOf(scenarioData.user.address);
      console.log("intitialBalance: " + initialBalance);
      console.log("intitialTransfer: " + scenarioData.intitialTransfer);
      await usdc.transfer(scenarioData.user.address, scenarioData.intitialTransfer);

      // Approve 100
      console.log("approveAmount: " + scenarioData.approveAmount);
      await usdc.connect(scenarioData.user).approve(tpCore.address, scenarioData.approveAmount);

      
      // set reward
//console.log("-----------undef",scenarioData.reward == undefined);
      if(scenarioData.reward >= 0){
        console.log("add reward: " + scenarioData.reward);
        await vault.setReward(scenarioData.reward);
      }

      if(scenarioData.stakeAmount)
      {
        // Stake 20
       // console.log("stakeAmount: " + scenarioData.stakeAmount);
        await tpCore.connect(scenarioData.user).stake(scenarioData.stakeAmount);
        
        // USDC balance after stake
        const balanceAfterStake = await usdc.balanceOf(scenarioData.user.address);

        expect(balanceAfterStake).to.equal(initialBalance.add(scenarioData.intitialTransfer).sub(scenarioData.stakeAmount));
      }

      if(scenarioData.unstakeAmount){

        // Unstake 10
        console.log("unstakeAmount: " + scenarioData.unstakeAmount);
        if(scenarioData.unstakeExpectedFunc){
          console.log("=========== expected error");
          
          const result = await scenarioData.unstakeExpectedFunc(() => tpCore.connect(scenarioData.user).unstake(scenarioData.unstakeAmount));
          console.log("continue: "+result);
          if(!result) {
            return;
          }
        } else{
          await tpCore.connect(scenarioData.user).unstake(scenarioData.unstakeAmount);
        }
        // USDC balance after unstake
        const balanceAfterUnstake = await usdc.balanceOf(scenarioData.user.address);
        var fee = BigNumber.from(percent(scenarioData.unstakeAmount, 5));
        console.log("fee: " + fee);
        console.log("balanceAfterUnstake: " + balanceAfterUnstake);
        

        console.log("------------- CALC -----------");
        console.log("initialBalance:", initialBalance);
        console.log("scenarioData.intitialTransfer:", scenarioData.intitialTransfer);
        console.log("scenarioData.stakeAmount:", scenarioData.stakeAmount ?? 0);
        console.log("scenarioData.unstakeAmount:", scenarioData.unstakeAmount);
        console.log("fee:", fee);

      //   const expRes = initialBalance
      //   .add(scenarioData.intitialTransfer ?? 0)
      //   .sub(scenarioData.stakeAmount ?? 0)
      //   .add(scenarioData.unstakeAmount ?? 0)
      //   .sub(fee);

      //   expect(balanceAfterUnstake)
      //   .to.be.least(expRes);
      }

      const balance = await tpCore.estimateReward(scenarioData.user.address);
      console.log("tpCore balance: " + balance);


      return;
      // 1. estimate reward: division by 0

      // estimate reward
      const reward = await tpCore.estimateReward(scenarioData.user.address);
      console.log(`${scenarioData.user.address} Reward: ${reward}`);

      const tpyReward = await tpCore.estimateTPYReward(scenarioData.user.address);
      console.log(`${scenarioData.user.address} TPY Reward: ${reward}`);
    };

    let percent = (value, percent) => {
      return percent * value / 100;
    };

    before(async() => {
        usdc = await deployContract("TestUSDC");
        vault = await deployContract("TestVault", [usdc.address]);
    });

    beforeEach(async() => {

        [owner, addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8, _] = await ethers.getSigners();
        //usdc = await deployContract("TestUSDC");
        tpy = await deployContract("TestTPY");
        //vault = await deployContract("TestVault", [usdc.address]);
        strategy = await deployContract("TestUSDCStrategy");
        tpCore = await deployContract("TPCore", [usdc.address, tpy.address, strategy.address]);
        console.log("=========== Deployed =========");

        console.log("Resetting user balances...");
        [addr1, addr2, addr3, addr4, addr5, addr6, addr7, addr8].forEach(async (addr) => {
          await usdc.connect(addr).transfer(owner, await usdc.balanceOf(addr.address));
        });

        await tpy.transfer(tpCore.address, 10000 * (10 ** 6));
        await usdc.transfer(vault.address, 10000 * (10 ** 6));

    });

    describe('Staking', () => {
      it('a1 >10 | reward 12 | a1 <10 | a1 <2', async () => {
        let decimals = 6;
        const scenarios = [
          {
            user: addr1,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            reward: 10 * (10 ** decimals),
            stakeAmount: 10 * (10 ** decimals),
            //unstakeAmount: 10,
          },
          {
            user: addr1,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            reward: 12 * (10 ** decimals),
            //stakeAmount: 10 * (10 ** decimals),
            unstakeAmount: 10 * (10 ** decimals),
          },
          {
            user: addr1,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            reward: 2 * (10 ** decimals),
            //stakeAmount: 10 * (10 ** decimals),
            unstakeAmount: 2 * (10 ** decimals),
          },
        ];
        console.log("Transfer to vault: 1000");
        await usdc.transfer(vault.address, 10000 * (10 ** decimals));
        //await vault.setReward(500);

        for(let i = 0; i < scenarios.length; i++){
          console.log(`----------------------------------user ${scenarios[i].user.address}-----------------------------------------`);
          await executeScenario(scenarios[i], decimals);
        }
      });

      it('a1 >10 | reward 15 | a2 >10 | reward 50 | a1 <30 | a2 <20', async () => {
        let decimals = 2;
        const scenarios = [
          {
            user: addr1,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            reward: 10 * (10 ** decimals),
            stakeAmount: 10 * (10 ** decimals),
            //unstakeAmount: 10,
          },
          {
            user: addr2,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            reward: 25 * (10 ** decimals),
            stakeAmount: 10 * (10 ** decimals),
            //unstakeAmount: 13,
          },
          {
            user: addr1,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            reward: 50 * (10 ** decimals),
            //stakeAmount: 100,
            unstakeAmount: 30 * (10 ** decimals),
          },

          {
            user: addr2,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            reward: 20  * (10 ** decimals),
            //stakeAmount: 100,
            unstakeAmount: 20 * (10 ** decimals),
          },
        ];
        console.log("Transfer to vault: 1000");
        //await usdc.transfer(vault.address, 10000 * (10 ** decimals));
        //await vault.setReward(500);

        for(let i = 0; i < scenarios.length; i++){
          console.log(`----------------------------------user ${scenarios[i].user.address}-----------------------------------------`);
          await executeScenario(scenarios[i], decimals);
        }
      });

      it('Shat lav scenar Emo', async () => {
        const decimals = 6;
        const scenarios = [
          {
            user: addr1,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            reward: 1 * (10 ** decimals),
            stakeAmount: 1 * (10 ** decimals),
            //unstakeAmount: 10,
          },
          {
            user: addr2,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            reward: 3 * (10 ** decimals),
            stakeAmount: 1 * (10 ** decimals),
            //unstakeAmount: 10,
          },
          {
            user: addr1,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            reward: 4 * (10 ** decimals),
            stakeAmount: 1 * (10 ** decimals),
            //unstakeAmount: 13,
          },
          {
            user: addr1,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            //reward: 25,
            //stakeAmount: 100,
            unstakeAmount: 3 * (10 ** decimals),
          },

          {
            user: addr2,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            //reward: 25,
            //stakeAmount: 100,
            unstakeAmount: 1 * (10 ** decimals),
          },
          
        ];

        for(let i = 0; i < scenarios.length; i++){
          console.log(`----------------------------------user ${scenarios[i].user.address}-----------------------------------------`);
          await executeScenario(scenarios[i]);
        }
      });

      it('Should stake some money', async () => {
        const decimals = 3;
        const scenarios = [
          {
            user: addr1,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            stakeAmount: 100 * (10 ** decimals),
            reward: 100 * (10 ** decimals),
            //unstakeAmount: 100,
          },
          {
            user: addr2,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            stakeAmount: 100 * (10 ** decimals),
            reward: 210 * (10 ** decimals),
            //unstakeAmount: 220,
          },
          {
            user: addr1,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            //stakeAmount: 300,
            reward: 220 * (10 ** decimals),
            unstakeAmount: 110 * (10 ** decimals),
          },
          {
            user: addr2,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            //stakeAmount: 300,
            reward: 110 * (10 ** decimals),
            unstakeAmount: 110 * (10 ** decimals),
          },
          {
            user: addr7,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            //stakeAmount: 200,
            reward: 7 * (10 ** decimals),

            unstakeAmount: 1 * (10 ** decimals),
            unstakeExpectedFunc: async (func) => { await expect(func()).to.be.revertedWith('Dont be greedy.'); return false; }
          },
          {
            user: addr1,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            //stakeAmount: 200,
            reward: 10 * (10 ** decimals),

            unstakeAmount: 4 * (10 ** decimals),
            //unstakeExpectedFunc: async (func) => { await expect(func()).to.be.revertedWith('Dont be greedy.'); return false; }
          },
          {
            user: addr1,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            //stakeAmount: 200,
            reward: 6 * (10 ** decimals),

            unstakeAmount: 6 * (10 ** decimals),
            //unstakeExpectedFunc: async (func) => { await expect(func()).to.be.revertedWith('Dont be greedy.'); return false; }
          },
          {
            user: addr1,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            //stakeAmount: 200,
            reward: 10 * (10 ** decimals),

            unstakeAmount: 1 * (10 ** decimals),
            unstakeExpectedFunc: async (func) => { await expect(func()).to.be.revertedWith('Dont be greedy.'); return false; }
          },
          {
            user: addr2,
            intitialTransfer: 1200 * (10 ** decimals),
            approveAmount: 1000 * (10 ** decimals),
            //stakeAmount: 200,
            reward: 20 * (10 ** decimals),

            unstakeAmount: 1 * (10 ** decimals),
            unstakeExpectedFunc: async (func) => { await expect(func()).to.be.revertedWith('Dont be greedy.'); return false; }
          },
          // {
          //   user: addr2,
          //   intitialTransfer: 1200,
          //   approveAmount: 1000,
          //   stakeAmount: 200,
          //   unstakeAmount: 400,
          //   unstakeExpectedFunc: async (func) => { await expect(func()).to.be.revertedWith('Dont be greedy.'); return false; }
          // }
        ];
        console.log("Transfer to vault: 1000");
        await usdc.transfer(vault.address, 1000);
        //await vault.setReward(500);

        for(let i = 0; i < scenarios.length; i++){
          console.log(`----------------------------------user ${scenarios[i].user.address}-----------------------------------------`);
          await executeScenario(scenarios[i]);
        }
      });

    });

    describe('Role management', () => {
      it('Admin can transfer Admin role to another address', async () => {
        //await tpCore.transferLTAdminRole(addr1.address);
        let decimals = 6;
        //await tpCore.chan
        await tpCore.transferLTMinterRole(addr1.address);
        
        await expect(executeScenario( {
          user: addr1,
          intitialTransfer: 1200 * (10 ** decimals),
          approveAmount: 1000 * (10 ** decimals),
          reward: 10 * (10 ** decimals),
          stakeAmount: 10 * (10 ** decimals),
          //unstakeAmount: 10,
        }, decimals)).to.be
        .revertedWith(`AccessControl: account ${tpCore.address.toString().toLowerCase()} is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6`);
        
      });
    });

    describe('Withdraw any ERC20', () => {
      it('Admin can withdraw all ERC20 tokens from TPCore', async () => {

        const transferToTPCore1 = BigNumber.from("3000");
        const transferToTPCore2 = BigNumber.from("80000");
        await usdc.transfer(addr1.address, 1000 * (10 ** 3));
        await usdc.transfer(addr2.address, 1000 * (10 ** 3));

        const ownerBalance = await usdc.balanceOf(owner.address);
        console.log("ownerBalance", ownerBalance);
        await usdc.connect(addr1).transfer(tpCore.address, transferToTPCore1);
        await usdc.connect(addr2).transfer(tpCore.address, transferToTPCore2);
        await tpCore.withdraw(usdc.address);
        const ownerBalanceAfterWithdraw = await usdc.balanceOf(owner.address);
        console.log("ownerBalanceAfterWithdraw", ownerBalanceAfterWithdraw);
        expect(ownerBalanceAfterWithdraw).to.equal(ownerBalance.add(transferToTPCore1).add(transferToTPCore2));

      });

      it('User cant withdraw ERC20 token from TPCore', async () => {

        const transferToTPCore1 = BigNumber.from("3000");
        const transferToTPCore2 = BigNumber.from("80000");
        await usdc.transfer(addr1.address, 1000 * (10 ** 3));
        await usdc.transfer(addr2.address, 1000 * (10 ** 3));

        const ownerBalance = await usdc.balanceOf(owner.address);
        console.log("ownerBalance", ownerBalance);
        await usdc.connect(addr1).transfer(tpCore.address, transferToTPCore1);
        await usdc.connect(addr2).transfer(tpCore.address, transferToTPCore2);

        const user1Client = tpCore.connect(addr1);//.withdraw(usdc.address);
        await expect(user1Client.withdraw(usdc.address))
        .to.be
        .revertedWith(`AccessControl: account ${addr1.address.toString().toLowerCase()} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000`);

      });
    });

});