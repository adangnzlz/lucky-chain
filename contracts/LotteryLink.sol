// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Lottery.sol";
import "hardhat/console.sol";

contract LotteryLink is Lottery {
    IERC20 public token;
    uint32 private callbackGasLimit = 100000;

    constructor(
        uint64 _subscriptionId,
        address _vrfCoordinator,
        bytes32 _keyHash,
        address _tokenAddress
    )
        Lottery(_subscriptionId, _vrfCoordinator, _keyHash) // Llama al constructor de Lottery
    {
        token = IERC20(_tokenAddress); // Inicializa el token ERC20
        // lotteryTicket = 1 * 10 ** 18;
    }
 
    function enter() public payable override {
        require(
            token.transferFrom(msg.sender, address(this), lotteryTicket),
            "Token transfer failed"
        );

        players.push(msg.sender);
    }

    function checkSubscriptionFunds()
        public
        view
        returns (
            uint96 balance,
            uint64 reqCount,
            address owner,
            address[] memory consumers
        )
    {
        return COORDINATOR.getSubscription(subscriptionId);
    }

    function distributePrize(address winner) internal override {
        uint256 contractBalance = token.balanceOf(address(this));
        require(
            token.transfer(winner, contractBalance),
            "Token transfer failed"
        );
    }

    function pickWinner() public override restricted minPlayers {
        (uint96 balance, , , ) = checkSubscriptionFunds();
        require(
            balance >= callbackGasLimit * tx.gasprice,
            "Insufficient funds in the subscription"
        );
        super.pickWinner();
    }

    function setGasLimit(uint32 newGasLImit) external restricted {
        callbackGasLimit = newGasLImit;
    }
}
