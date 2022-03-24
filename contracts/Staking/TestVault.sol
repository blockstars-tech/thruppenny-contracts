
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


/// Openzeppelin imports
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// Local imports
import "./VaultInterface.sol";
import "hardhat/console.sol";
//

contract TestVault is VaultInterface {

    using SafeERC20 for ERC20;

    uint256 _reward;

    struct Stake {

            uint256 amount;
            uint256 lastBlockNumber;
    }

    mapping(address => Stake) public stakesMapping;
    ERC20 public token;
    uint256 _initialBlock;
    /// Constructor
    constructor(address tokenAddress_) {

        token = ERC20(tokenAddress_);
        _initialBlock = block.number;
    }


    function setReward(uint256 reward) public {
        _reward = reward;
    }

    function deposit(uint256 amount_) public override returns(uint256) {
        require(0 != amount_, "Amount cannot be 0");
        require(amount_ <= token.allowance(msg.sender, address(this)));
        token.safeTransferFrom(msg.sender, address(this), amount_);
        Stake storage s = stakesMapping[msg.sender];
        if (0 == s.amount) {
            s.amount = amount_;
        } else {
            s.amount = balanceOf(msg.sender) + amount_;
            //console.log("deposit-2", s.amount);
        }

        //console.log("Vault Deposit:", msg.sender, s.amount);

        s.lastBlockNumber = block.number;
        //_reward += amount_;
        return amount_;
    }

    function withdraw(uint256 amount_, address to_) public override returns(uint256) {
/*
        require(0 != amount_, "amount cannot be 0");
        require(address(0x0) != to_, "to cannot be 0x0");
        Stake storage s = stakesMapping[msg.sender];
        require(s.amount > 0, "There is no deposit");
        s.amount = balanceOf(msg.sender);
        s.lastBlockNumber = block.number;
        if (amount_ == type(uint256).max) {
            amount_ = s.amount;
            s.amount = 0;
        } else {
            require(s.amount >= amount_, "Insufficient balance");
            s.amount -= amount_;
        }
        */
        //_reward -= amount_;
        token.safeTransfer(to_, amount_);
        return amount_;
    }

    function balanceOf(address user_) public view override returns(uint256) {

        require(address(0x0) != user_, "user cannot be 0x0");
        Stake storage s = stakesMapping[user_];
        require(s.amount > 0, "There is no deposit");
        uint256 balance = token.balanceOf(address(this));
        //uint256 balance = token.balanceOf(user_);
        //console.log("Vault balance: ", balance);

        uint256 totalRew = balance;// + 300;// (block.number - _initialBlock) * 10;
        //console.log("Vault totalRew: ", totalRew);

        //return totalRew;
        return _reward;
        //return s.amount + s.amount * 10 / 100; //s.amount * (block.number - s.lastBlockNumber) / 200; /// TODO for each block
    }

    function pricePerShare() public view override returns (uint256) {
        return 10 ** token.decimals();
    }
}