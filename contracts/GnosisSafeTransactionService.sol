// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GnosisSafeTransactionService {
  address private gnosisSafeAddress;

  /**
   * Initializes the contract setting the input address as the initial gnosis safe address.
   */
  constructor(address safeAddress) {
    gnosisSafeAddress = safeAddress;
  }

  /**
   * Throws if called by any account other than the gnosis safe address.
   */
  modifier onlyGnosisSafe() {
    require(gnosisSafeAddress == msg.sender, "Forbidden: the caller is not the safe address");
    _;
  }

  /**
   * Moves `amount` tokens from the caller's account to `recipient` from the input token address.
   */
  function safeTransfer(
    address tokenAddress,
    address recipient,
    uint256 amount
  ) public onlyGnosisSafe returns (bool) {
    IERC20(tokenAddress).transfer(recipient, amount);
    return true;
  }
}
