
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


/// Openzeppelin imports
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


/**
 * @title This is just for unit tests
 *
 */
contract TestTPY is ERC20 {

    uint256 public constant INITIALSUPPLY = 1000000 * (10 ** 6);

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    constructor()
            ERC20("TPYToken", "TPY") {

        _mint(_msgSender(), INITIALSUPPLY);
    }
}