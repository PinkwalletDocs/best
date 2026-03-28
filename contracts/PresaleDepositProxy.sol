// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Presale USDT deposit proxy (BNB Chain BEP-20)
/// @notice Users send USDT with the standard ERC20 `transfer(proxy, amount)` on the official USDT contract.
///         No approve() to this contract is required. Owner withdraws USDT to treasury off-chain.
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract PresaleDepositProxy {
    IERC20 public immutable usdt;
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Withdrawn(address indexed to, uint256 amount);

    constructor(address usdtToken, address initialOwner) {
        require(usdtToken != address(0) && initialOwner != address(0), "zero addr");
        usdt = IERC20(usdtToken);
        owner = initialOwner;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Pull USDT held by this contract to a treasury address (e.g. EOA or multisig).
    function withdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "zero to");
        require(usdt.transfer(to, amount), "transfer fail");
        emit Withdrawn(to, amount);
    }

    function withdrawAll(address to) external onlyOwner {
        require(to != address(0), "zero to");
        uint256 bal = usdt.balanceOf(address(this));
        require(bal > 0, "empty");
        require(usdt.transfer(to, bal), "transfer fail");
        emit Withdrawn(to, bal);
    }
}
