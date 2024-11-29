// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "hardhat/console.sol";

contract LinkTokenMock is ERC20 {
    constructor() ERC20("Mock LINK", "LINK") {
        _mint(msg.sender, 1000000 * 10 ** 18); // Mint 1,000,000 LINK tokens
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public override returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(
            sender,
            _msgSender(),
            allowance(sender, _msgSender()) - amount
        );
        return true;
    }

    
}
