// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2Mock.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error NotImplementedYet();

import "hardhat/console.sol";

contract LotteryLink is VRFConsumerBaseV2 {
    address public manager;
    address[] public players;

    VRFCoordinatorV2Interface COORDINATOR;

    uint64 private subscriptionId;
    bytes32 private keyHash;
    uint32 private callbackGasLimit = 100000;
    uint16 private requestConfirmations = 3;
    uint32 private numWords = 1;

    address public recentWinner;

    IERC20 public token;

    constructor(
        uint64 _subscriptionId,
        address _vrfCoordinator,
        bytes32 _keyHash,
        address _tokenAddress
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        manager = msg.sender;
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        token = IERC20(_tokenAddress);
    }

    function enter(uint256 amount) public {
        require(amount >= 1 * 10 ** 18, "Minimum amount not met");
        require(
            token.transferFrom(msg.sender, address(this), amount),
            "Token transfer failed"
        );
        players.push(msg.sender);
    }

    function getPlayers() public view returns (address[] memory) {
        return players;
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

    // callback Chainlink
    function fulfillRandomWords(
        uint256 /* requestId */,
        uint256[] memory randomWords
    ) internal override {
        uint256 randomIndex = randomWords[0] % players.length;
        address winner = players[randomIndex];

        recentWinner = winner;

        uint256 contractBalance = token.balanceOf(address(this));
        require(
            token.transfer(winner, contractBalance),
            "Token transfer failed"
        );
    }

    function pickWinner() external restricted minPlayers {
        (uint96 balance, , , ) = checkSubscriptionFunds();
        require(
            balance >= callbackGasLimit * tx.gasprice,
            "Insufficient funds in the subscription"
        );

        COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit, // Gas is not spent in the contract, it is spent in the chainlink subscription and you can limit it with this variable. The subscription uses LINK to calculate the randomness and to buy the gas needed to call the fulfillRandomWords callback at that time.
            numWords
        );
    }

    function setGasLimit(uint32 newGasLImit) external restricted {
        callbackGasLimit = newGasLImit;
    }

    modifier minPlayers() {
        require(players.length > 1, "No minimum players in the lottery");
        _;
    }
    modifier restricted() {
        require(
            msg.sender == manager,
            "Only the manager can call this function"
        );
        _;
    }
}
