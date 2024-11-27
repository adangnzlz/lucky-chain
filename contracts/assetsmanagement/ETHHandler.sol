// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IAssetHandler.sol";
import "hardhat/console.sol";
contract ETHHandler is IAssetHandler {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function getBalance() external view override returns (uint256) {
        console.log("interface", address(this).balance);
        return address(this).balance;
    }

    function transfer(
        address to,
        uint256 amount
    ) external override returns (bool) {
        require(msg.sender == owner, "Unauthorized");
        (bool success, ) = to.call{value: amount}("");
        return success;
    }

    receive() external payable {}
}
