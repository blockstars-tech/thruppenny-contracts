// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Token is ERC20 {
  constructor() ERC20("TOKEN", "TOKEN") {}

  function mint(address to, uint256 amount) external {
    _mint(to, amount);
  }

  function burn(address to, uint256 amount) external {
      _burn(to, amount);
  }
}
