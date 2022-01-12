// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { ISecurityContract } from "./ISecurityContract.sol";

contract SecurityContract is Ownable {
  event Response(bool success, bytes data);

  mapping(address => uint256) private _balances;

  address public bot;

  function addFeeBalance() public payable {
    _balances[msg.sender] += msg.value;
  }

  function removeFeeBalance(uint256 amount) public {
    _balances[msg.sender] -= amount;
    (bool success, ) = payable(msg.sender).call{ value: amount }("");
    require(success, "Address: unable to send value, recipient may have reverted");
  }

  function setBotAddress(address bot_) public onlyOwner {
    bot = bot_;
  }

  function executeBot(
    address asset,
    uint256 initialAmount,
    uint256 expectedAmount,
    uint256 slippage,
    address user,
    uint256 maxGasPrice,
    bool isFlashLoan,
    bytes memory userSignature,
    bytes calldata params
  ) public onlyOwner returns (bool success, bytes memory data) {
    uint256 gasLeftBefore = gasleft();
    require(bot != address(0), "bot address is not setted");
    require(maxGasPrice >= tx.gasprice, "Transaction gas price is more than user specified");
    address recoveredUser = recoverSigner(
      asset,
      initialAmount,
      expectedAmount,
      slippage,
      maxGasPrice,
      isFlashLoan,
      params,
      userSignature
    );
    require(user == recoveredUser, "user is not signer of signature");

    if (isFlashLoan) {
      (success, data) = bot.call{ value: 0 }(
        abi.encodeWithSignature(
          "executeSwapsWithFlashloan(address,uint256,uint256,uint256,address,bytes)",
          asset,
          initialAmount,
          expectedAmount,
          slippage,
          user,
          params
        )
      );
    } else {
      (success, data) = bot.call{ value: 0 }(
        abi.encodeWithSignature(
          "executeSwaps(address,uint256,uint256,uint256,address,bytes)",
          asset,
          initialAmount,
          expectedAmount,
          slippage,
          user,
          params
        )
      );
    }
    emit Response(success, data);
    uint256 gasLeftAfter = gasleft();
    uint256 fee = tx.gasprice * (gasLeftBefore - gasLeftAfter + 55000);
    _balances[user] -= fee;
    (bool feeTransferred, ) = payable(msg.sender).call{ value: fee }("");
    require(feeTransferred, "cannot transfer fee to owner");
  }

  function recoverSigner(
    address asset,
    uint256 initialAmount,
    uint256 expectedAmount,
    uint256 slippage,
    uint256 maxGasPrice,
    bool isFlashloan,
    bytes memory params,
    bytes memory signature
  ) public pure returns (address) {
    bytes32 dataHash = keccak256(
      abi.encodePacked(
        asset,
        initialAmount,
        expectedAmount,
        slippage,
        maxGasPrice,
        isFlashloan,
        params
      )
    );
    return ECDSA.recover(ECDSA.toEthSignedMessageHash(dataHash), signature);
  }

  function recoverSigner2(
    address asset,
    uint256 initialAmount,
    uint256 expectedAmount,
    uint256 slippage,
    uint256 maxGasPrice,
    bool isFlashloan,
    bytes memory params,
    bytes memory signature
  ) public pure returns (bytes32, address) {
    bytes32 dataHash = keccak256(
      abi.encodePacked(
        asset,
        initialAmount,
        expectedAmount,
        slippage,
        maxGasPrice,
        isFlashloan,
        params
      )
    );
    return (dataHash, ECDSA.recover(ECDSA.toEthSignedMessageHash(dataHash), signature));
  }

  function feeBalanceOf(address account) public view returns (uint256) {
    return _balances[account];
  }
}

// contract SecurityContract {
//   using EnumerableSet for EnumerableSet.Bytes32Set;
//   mapping(address => EnumerableSet.Bytes32Set) private _userBots;
//   mapping(bytes32 => bool) private _botIsActive;

//   function saveBot(
//     address asset,
//     uint256 initialAmount,
//     uint256 expectedAmount,
//     uint256 slippage,
//     uint256 gasprice,
//     bytes memory params
//   ) external {
//     bytes32 botHash = keccak256(
//       abi.encodePacked(asset, initialAmount, expectedAmount, slippage, gasprice, params, msg.sender)
//     );
//     require(!_userBots[msg.sender].contains(botHash), "Bot with this hash already exist");
//     _userBots[msg.sender].add(botHash);
//     _botIsActive[botHash] = true;
//   }

//   function activateBot(bytes32 botHash) external {
//     require(_userBots[msg.sender].contains(botHash), "You don't have bot with given hash");
//     require(!_botIsActive[botHash], "Bot is already active");
//     _botIsActive[botHash] = true;
//   }

//   function deactivateBot(bytes32 botHash) external {
//     require(_userBots[msg.sender].contains(botHash), "You don't have bot with given hash");
//     require(_botIsActive[botHash], "Bot is already deactivated");
//     _botIsActive[botHash] = false;
//   }

//   function checkBotWithParameters(
//     address asset,
//     uint256 initialAmount,
//     uint256 expectedAmount,
//     uint256 slippage,
//     uint256 gasprice,
//     bytes memory params,
//     address user
//   ) external view returns (bool) {
//     bytes32 botHash = keccak256(
//       abi.encodePacked(asset, initialAmount, expectedAmount, slippage, gasprice, params, user)
//     );
//     return checkBot(botHash, user);
//   }

//   function checkBot(bytes32 botHash, address user) public view returns (bool) {
//     return _botIsActive[botHash] && _userBots[user].contains(botHash);
//   }
// }
