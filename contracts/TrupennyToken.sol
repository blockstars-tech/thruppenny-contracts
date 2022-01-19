// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TrupennyToken is ERC20 {

    /**
     * Create an initial amount of tokens for the deployer.
     */
    constructor() ERC20("Trupenny", "TRU") {
        _mint(msg.sender, 1000000000 * 10 ** decimals());
    }

    /**
     * Returns the number of decimals used to get its user representation.
     */
    function decimals() public view virtual override returns (uint8) {
        return 8;
    }
}