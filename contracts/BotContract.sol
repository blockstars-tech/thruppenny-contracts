// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { FlashLoanReceiverBase } from "./FlashLoanReceiverBase.sol";
import { ILendingPool } from "./interfaces/ILendingPool.sol";
import { ILendingPoolAddressesProvider } from "./interfaces/ILendingPoolAddressesProvider.sol";
import { IUniswapV2Router02 } from "./interfaces/IUniswapV2Router02.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

error UnprofitableTransaction(uint256 initialValue, uint256 afterValue);

contract BotContract is FlashLoanReceiverBase {
  using SafeERC20 for IERC20;

  enum SwapType {
    UNISWAP,
    SUSHISWAP
  }

  struct LastTokenInfo {
    address addr;
    uint256 value;
  }

  IUniswapV2Router02 public constant UNISWAP_V2_ROUTER_02 =
    IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
  IUniswapV2Router02 public constant SUSHI_V2_ROUTER_02 =
    IUniswapV2Router02(0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506); // kovan
  // IUniswapV2Router02 public constant SUSHI_V2_ROUTER_02 =
  //   IUniswapV2Router02(0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F); // mainnet

  address public immutable securityContract;

  event Received(address sender, uint256 amount);

  // constructor(ILendingPoolAddressesProvider provider) FlashLoanReceiverBase(provider) {}
  constructor(address securityContract_)
    FlashLoanReceiverBase(ILendingPoolAddressesProvider(0x88757f2f99175387aB4C6a4b3067c77A695b0349))
  // solhint-disable-next-line no-empty-blocks
  {
    securityContract = securityContract_;
  } // kovan

  // constructor(address securityContract_)
  //   FlashLoanReceiverBase(ILendingPoolAddressesProvider(0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5))
  // // solhint-disable-next-line no-empty-blocks
  // {
  //   securityContract = securityContract_;
  // } // mainnet

  modifier onlySecurityContract() {
    require(msg.sender == securityContract, "Only security contract can call this function");
    _;
  }

  function _callUniswapLikeFuncions(
    IUniswapV2Router02 routerAddress,
    address[] memory path,
    address asset,
    uint256 assetAmount
  ) internal returns (LastTokenInfo memory) {
    require(path[0] == asset, "asset is not equal to path[0] asset");
    IERC20(asset).safeApprove(address(routerAddress), assetAmount);
    uint256[] memory result = routerAddress.swapExactTokensForTokens(
      assetAmount,
      0, // accept any amount of ETH
      path,
      address(this),
      block.timestamp
    );
    return LastTokenInfo(path[path.length - 1], result[result.length - 1]);
  }

  function _executeSwaps(
    address firstAsset,
    uint256 firstAssetAmount,
    bytes calldata params
  ) internal returns (uint256 balanceBefore, uint256 balanceAfter) {
    balanceBefore = IERC20(firstAsset).balanceOf(address(this));
    (bytes[] memory arguments, SwapType[] memory swapTypes) = abi.decode(
      params,
      (bytes[], SwapType[])
    );
    bool isFirst = true;
    LastTokenInfo memory lastTokenInfo;
    require(
      arguments.length == swapTypes.length,
      "arguments length must be equal to swapTypes length"
    );

    for (uint256 i = 0; i < arguments.length; i++) {
      address asset = lastTokenInfo.addr;
      uint256 amount = lastTokenInfo.value;
      if (isFirst) {
        asset = firstAsset;
        amount = firstAssetAmount;
        isFirst = false;
      }
      if (swapTypes[i] == SwapType.UNISWAP) {
        address[] memory path = abi.decode(arguments[i], (address[]));
        lastTokenInfo = _callUniswapLikeFuncions(UNISWAP_V2_ROUTER_02, path, asset, amount);
      } else if (swapTypes[i] == SwapType.SUSHISWAP) {
        address[] memory path = abi.decode(arguments[i], (address[]));
        lastTokenInfo = _callUniswapLikeFuncions(SUSHI_V2_ROUTER_02, path, asset, amount);
      }
    }
    balanceAfter = IERC20(firstAsset).balanceOf(address(this));
    return (balanceBefore, balanceAfter);
  }

  function executeSwaps(
    address asset,
    uint256 initialAmount,
    uint256 expectedAmount,
    uint256 slippage,
    address user,
    bytes calldata params
  ) external onlySecurityContract returns (uint256) {
    IERC20(asset).safeTransferFrom(user, address(this), initialAmount);
    (uint256 balanceBefore, uint256 balanceAfter) = _executeSwaps(asset, initialAmount, params);
    if (balanceAfter <= balanceBefore) {
      revert UnprofitableTransaction({
        initialValue: initialAmount,
        afterValue: initialAmount - (balanceBefore - balanceAfter)
      });
    }
    uint256 transferAmount = balanceAfter - balanceBefore;

    require(
      _checkProfitability(expectedAmount, initialAmount + transferAmount, slippage),
      "Transaction will not succeed either due to price movement"
    );
    IERC20(asset).safeTransfer(user, transferAmount + initialAmount);
    return transferAmount;
  }

  function executeSwapsWithFlashloan(
    address asset,
    uint256 initialAmount,
    uint256 expectedAmount,
    uint256 slippage,
    address user,
    bytes memory params
  ) public onlySecurityContract returns (uint256) {
    address[] memory assets = new address[](1);
    assets[0] = asset;
    uint256[] memory amounts = new uint256[](1);
    amounts[0] = initialAmount;
    // 0 = no debt, 1 = stable, 2 = variable
    uint256[] memory modes = new uint256[](1);
    modes[0] = 0;

    uint256 balanceBefore = IERC20(assets[0]).balanceOf(address(this));

    LENDING_POOL.flashLoan(address(this), assets, amounts, modes, address(this), params, 0);

    uint256 balanceAfter = IERC20(assets[0]).balanceOf(address(this));

    uint256 profit = balanceAfter - balanceBefore;

    uint256 realAmount = initialAmount + profit;
    require(
      _checkProfitability(expectedAmount, realAmount, slippage),
      "Transaction will not succeed either due to price movement"
    );
    IERC20(assets[0]).safeTransfer(user, profit);

    return profit;
  }

  function _checkProfitability(
    uint256 expectedAmount,
    uint256 realAmount,
    uint256 slippage
  ) internal pure returns (bool) {
    if (realAmount > expectedAmount) {
      return true;
    }
    if (slippage >= ((expectedAmount - realAmount) * 100) / realAmount) {
      return true;
    }
    return false;
  }

  function executeOperation(
    address[] calldata assets,
    uint256[] calldata amounts,
    uint256[] calldata premiums,
    address,
    bytes calldata params
  ) external override returns (bool) {
    //
    // This contract now has the funds requested.
    // Your logic goes here.
    //

    // At the end of your logic above, this contract owes
    // the flashloaned amounts + premiums.
    // Therefore ensure your contract has enough to repay
    // these amounts.

    (uint256 balanceBefore, uint256 balanceAfter) = _executeSwaps(assets[0], amounts[0], params);
    if (balanceAfter <= balanceBefore + premiums[0]) {
      revert UnprofitableTransaction({
        initialValue: amounts[0],
        afterValue: amounts[0] - (balanceBefore - balanceAfter)
      });
    }

    // Approve the LendingPool contract allowance to *pull* the owed amount
    for (uint256 i = 0; i < assets.length; i++) {
      IERC20(assets[i]).safeApprove(address(LENDING_POOL), amounts[i] + premiums[i]);
    }

    return true;
  }

  function withdrawERC20(IERC20 tokenAddress, uint256 amount) public returns (bool) {
    tokenAddress.transfer(msg.sender, amount);
    return true;
  }

  function getBalanceERC20(IERC20 tokenAddress) public view returns (uint256) {
    return tokenAddress.balanceOf(address(this));
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

  function getWETHAddress() public pure returns (address) {
    return UNISWAP_V2_ROUTER_02.WETH();
  }

  receive() external payable {
    emit Received(msg.sender, msg.value);
  }
}
