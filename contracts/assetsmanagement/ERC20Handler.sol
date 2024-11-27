// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IAssetHandler.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract ERC20Handler is IAssetHandler {
    IERC20 public token;
    address public owner;

    constructor(address _token) {
        token = IERC20(_token);
        owner = msg.sender;
    }

    function getBalance() external view override returns (uint256) {
        return token.balanceOf(address(this));
    }

    function transfer(
        address to,
        uint256 amount
    ) external override returns (bool) {
        require(msg.sender == owner, "Unauthorized");
        return token.transfer(to, amount);
    }
}
