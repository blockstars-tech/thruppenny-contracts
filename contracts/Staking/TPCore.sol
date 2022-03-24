// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/// Openzeppelin imports
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// Local imports
import "./LiquidityToken.sol";
import "./IStrategy.sol";

import "hardhat/console.sol";

/**
 * @title Implementation of the SyncDao Manager
 */
contract TPCore is AccessControl {

    using SafeERC20 for ERC20;
    using SafeERC20 for LiquidityToken; //token they stake with and receive the

    uint256 public ownerPercentage = 9500; //(this means we hold 5%) make sure when changing it to keep this formatting

    LiquidityToken public liquidityToken;
    IStrategy public strategy;
    ERC20 public stakingcoin;
    ERC20 public tpy;

    uint256 startingBlock;
    uint256 blockReward = 1;
    uint256 takenTPY;

    /// Events
    event Minted(address indexed minter, uint256 Amount);
    event Staked(address indexed staker, uint256 Amount);
    event Unstaked(address indexed staker, uint256 Amount);

    //todo a call to change the minter and admin role for tstakingcoin
    /// Constructor
    constructor(address stakingcoinAddress, address tpyTokenAddress, address initialStrategyAddress_) {

        startingBlock = block.number;
        strategy = IStrategy(initialStrategyAddress_);
        require(address(0x0) != address(strategy), "Initialise correct strategy!");
        liquidityToken = new LiquidityToken();
        
        stakingcoin = ERC20(stakingcoinAddress);
        tpy = ERC20(tpyTokenAddress);
        
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender()); 

    }

    /// Restricted functions
    /// LT 1
    function transferLTAdminRole(address newAdmin) public onlyRole(DEFAULT_ADMIN_ROLE) {
        liquidityToken.transferAdminRole(newAdmin);
    }

    function transferLTMinterRole(address newMinter) public onlyRole(DEFAULT_ADMIN_ROLE) {
        liquidityToken.transferMinterRole(newMinter);
    }

    function withdraw(address tokenAddress) public onlyRole(DEFAULT_ADMIN_ROLE) {
        ERC20 token = ERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        token.transfer(_msgSender(), balance);
    }

    /// Public member functions

    function changeOwnerPercentage(uint256 percentage_) public onlyRole(DEFAULT_ADMIN_ROLE) {
 
        require(0 <= percentage_ && percentage_ <= 10000, "Percentage must be from 0 to 1000");
        ownerPercentage = percentage_;
    }

    function changeStrategy(address newStrategyAddress_) public onlyRole(DEFAULT_ADMIN_ROLE) {

        require(address(0x0) != newStrategyAddress_, "strategy cannot be null");
        strategy = IStrategy(newStrategyAddress_);
    }


    function stake(uint256 amount_) public {
        console.log("=> stake", amount_);
        
        uint256 stakingcoinAmount = stakingcoin.allowance(_msgSender(), address(this));
        if (0 != amount_) {
            require(amount_ <= stakingcoinAmount, "There is no as much allowance for stakingcoin");
            stakingcoinAmount = amount_;
        }
        require(0 < stakingcoinAmount, "There is no allowance for stakingcoin at all");
        stakingcoin.safeTransferFrom(_msgSender(), address(this), stakingcoinAmount);
        
        ////Stakes into Yearn
         (bool success, bytes memory result) = address(strategy).delegatecall(abi.encodeWithSignature(
                        "farm(address,uint256)", stakingcoin, stakingcoinAmount));
        require(success, "Staking to yearn failed");
        stakingcoinAmount = abi.decode(result, (uint256));
        ////////////////
        
        //////////////////L1 calc
        uint256 liquidityAmount;
        uint256 totalReward = strategy.estimateReward(address(this));
        if(totalReward == 0 || totalReward == stakingcoinAmount || liquidityToken.totalSupply() == 0) 
        liquidityAmount = stakingcoinAmount * (10**6);
        else
        liquidityAmount =  stakingcoinAmount * liquidityToken.totalSupply() / (totalReward - stakingcoinAmount);
        

        liquidityToken.mint(_msgSender(), liquidityAmount);
        console.log("<= liquidityAmount", liquidityAmount);
        ////////////////////////////

        // todo remove
        uint256 tot = strategy.estimateReward(address(this));
        console.log("usd  tot:", tot);
        uint256 user = estimateReward(_msgSender());
        console.log("usd user:", user);
    }

    function unstake(uint256 amount_) public {

        require(0 < amount_, "The amount cannot be 0");
        
        uint256 totalReward = strategy.estimateReward(address(this));

        uint256 estimatedRewards = estimateReward(_msgSender());
        require(0 != estimatedRewards,"Dont be greedy."); 
       
        uint256 liquidityAmount = liquidityToken.balanceOf(_msgSender()); 
        console.log("liquidity Balance:", liquidityAmount);
       
        uint256 ppShare = totalReward / liquidityToken.totalSupply();  

        uint256 lToBurn = amount_  *  liquidityToken.totalSupply() / totalReward;
        if(liquidityAmount < lToBurn)
        lToBurn = liquidityAmount;
        uint256 rewardToTake = lToBurn * ppShare;

        console.log("unstake code");
        console.log("estimatedRewards=",estimatedRewards);
        console.log("totrew=",totalReward);
        console.log("ppshare=",ppShare);
        console.log("ltoburn", lToBurn, "of", liquidityAmount);

        _takeReward(rewardToTake); 
        
        stakingcoin.safeTransfer(_msgSender(), rewardToTake * ownerPercentage/10000);
       
        _takeTPYReward(lToBurn);  

        liquidityToken.burn(_msgSender(), lToBurn);

        uint256 liquidityBalanceAnfterBurn = liquidityToken.balanceOf(_msgSender()); 
        console.log("lt balance after burn=",liquidityBalanceAnfterBurn);

        emit Unstaked(_msgSender(), amount_); 
    }

//todo dzel kotoraky
//todo withdraw from this contract function for erc20s
    function estimateReward(address lpProvider) public view returns (uint256) {

        uint256 totalReward = strategy.estimateReward(address(this));
        
        if(liquidityToken.totalSupply() == 0)
        return 0;
        uint256 userReward = (totalReward * liquidityToken.balanceOf(lpProvider) / liquidityToken.totalSupply() );
        return userReward;
    }

//todo remove logs 
    function estimateTPYReward(address lpProvider) public view returns (uint256) {  

        if(liquidityToken.totalSupply() == 0) {
            return 0;
        }
       return liquidityToken.balanceOf(lpProvider) * totalTPYAvail() / liquidityToken.totalSupply();
    }

    function totalTPYAvail() public view returns (uint256) { 
            
        return (block.number - startingBlock) * blockReward - takenTPY ; 
    }

    function _takeTPYReward(uint256 lToBurn) private {
       // if (0 != amount_ && tpy.balanceOf(address(this)) >= amount_) {
        uint256 tpyReward;
        tpyReward = lToBurn * totalTPYAvail() / liquidityToken.totalSupply();

        tpy.safeTransfer(_msgSender(), tpyReward);
        takenTPY +=tpyReward;
    }

    function _takeReward(uint256 amount_) private {
        if (0 != amount_) {
            (bool success,) = address(strategy).delegatecall(
                                        abi.encodeWithSignature("takeReward(address,uint256)",
                                        address(this), amount_));
            require(success, "Failed to take the stakes from YEARN");

        }
    }
}