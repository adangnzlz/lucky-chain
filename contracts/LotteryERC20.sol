// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./LotteryEther.sol";
import "hardhat/console.sol";

contract LotteryERC20 is LotteryEther {
    IERC20 public token;
    uint256 private defaultLotteryTicket = 1;

    event SubscriptionInfoRequested(
        uint96 balance,
        uint64 reqCount,
        address owner,
        address[] consumers
    );

    constructor(
        uint64 _subscriptionId,
        address _vrfCoordinator,
        bytes32 _keyHash,
        address _tokenAddress
    ) LotteryEther(_subscriptionId, _vrfCoordinator, _keyHash, true) {
        token = IERC20(_tokenAddress);
        lotteryTicket = defaultLotteryTicket * 10 ** getDecimals(_tokenAddress);
    }

    modifier validTicket() override {
        require(
            totalPlayerFunds + lotteryTicket <= maxTotalFunds,
            "Exceeds maximum allowed funds"
        );
        totalPlayerFunds += lotteryTicket;
        try
            token.transferFrom(msg.sender, address(this), lotteryTicket)
        returns (bool success) {
            require(success, "Token transfer failed");
            _;
        } catch {
            revert("Token transfer failed");
        }
    }

    function pickWinner() public override onlyOwner minPlayers {
        (
            uint96 balance,
            uint64 reqCount,
            address owner,
            address[] memory consumers
        ) = COORDINATOR.getSubscription(subscriptionId);
        require(
            balance >= callbackGasLimit * tx.gasprice,
            "Insufficient funds in the subscription"
        );
        emit SubscriptionInfoRequested(balance, reqCount, owner, consumers);
        super.pickWinner();
    }

    function getDecimals(address _token) public view returns (uint8) {
        uint8 value = 18;
        try IERC20Metadata(_token).decimals() returns (uint8 _value) {
            value = _value;
        } catch {}
        return value;
    }

    function transferWinner(address to, uint256 amount) internal override {
        require(token.transfer(to, amount), "Token transfer failed");
    }
}
