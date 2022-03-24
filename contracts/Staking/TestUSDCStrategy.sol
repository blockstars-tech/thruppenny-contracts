// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// Openzeppelin imports
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// Local imports
//import "./LiquidityToken.sol";

import "./USDCStrategy.sol";
import "hardhat/console.sol";

/**
 * @title Implementation of the Yearn Strategy.
 *
 */
contract TestUSDCStrategy is USDCStrategy {
    modifier dontAllow {
        require(false, "dontAllow");
        _;
    }
 
    // address private _vault;
    // address private _stakeToken;

    // /// Constructor
    // constructor(address vault, address stakeToken) {
    //     _vault = vault;
    //     _stakeToken = stakeToken;
    //     console.log(_stakeToken);
    // }

    /// Public override member functions

    function vaultAddress() public view override returns(address) {

        return 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512;//0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0;//_vault;//0xd16B472C1b3AB8bc40C1321D7b33dB857e823f01;
    }

    function vaultTokenAddress() public view override returns(address) {

        return 0x5FbDB2315678afecb367f032d93F642f64180aa3;//_stakeToken;//0xd9145CCE52D386f254917e481eB44e9943F39138;
    }
}