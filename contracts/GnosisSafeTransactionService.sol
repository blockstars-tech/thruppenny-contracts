// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract GnosisSafeTransactionService {
  using SafeERC20 for IERC20;
  address private gnosisSafeAddress;

  /**
   * Initializes the contract setting the input address as the initial gnosis safe address.
   */
  constructor(address safeAddress) {
    gnosisSafeAddress = safeAddress;
  }

  /**
   * Moves `amount` tokens from the caller's account to `recipient` from the input token address.
   */
  function safeTransfer(
    address tokenAddress,
    address recipient,
    uint256 amount
  ) public returns (bool) {
    require(gnosisSafeAddress == msg.sender, "Forbidden: the caller is not the safe address");
    IERC20(tokenAddress).safeTransfer(recipient, amount);
    return true;
  }
}
