
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


/// Openzeppelin imports
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// Yearn imports
import "./VaultInterface.sol";

/// Local imports
import "./YearnStrategy.sol";

/**
 * @title Implementation of the Yearn Strategy.
 *
 */
contract USDCStrategy is YearnStrategy {

    /// Constructor
    constructor() {

    }

    /// Public override member functions

    function decimals() public override virtual pure returns(uint256) {
        return 6;
    }

    function vaultAddress() public view override virtual returns(address) {

        return 0xd16B472C1b3AB8bc40C1321D7b33dB857e823f01;
    }

    function vaultTokenAddress() public view override virtual returns(address) {

        return 0xd9145CCE52D386f254917e481eB44e9943F39138;
    }
}