// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2Mock.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "hardhat/console.sol";

error NotImplementedYet();

contract Lottery is VRFConsumerBaseV2 {
    address public manager;
    address[] public players;

    VRFCoordinatorV2Interface COORDINATOR;

    uint64 internal subscriptionId;
    bytes32 private keyHash;
    uint32 private callbackGasLimit = 100000;
    uint256 public constant lotteryTicket = 0.01 ether;
    uint16 private requestConfirmations = 3;
    uint32 private numWords = 1;

    address public recentWinner;

    event PlayerEntered(address indexed player);

    constructor(
        uint64 _subscriptionId,
        address _vrfCoordinator,
        bytes32 _keyHash
    ) VRFConsumerBaseV2(_vrfCoordinator) {
        manager = msg.sender;
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
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
    modifier validTicket() virtual {
        require(msg.value == lotteryTicket, "Incorrect ticket ammount");
        _;
    }

    function enter() public payable validTicket {
        players.push(msg.sender);
        emit PlayerEntered(msg.sender);
    }

    function pickWinner() public virtual restricted minPlayers {
        COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
    }

    function getPlayers() public view returns (address[] memory) {
        return players;
    }

    // callback Chainlink
    function fulfillRandomWords(
        uint256 /* requestId */,
        uint256[] memory randomWords
    ) internal override {
        uint256 randomIndex = randomWords[0] % players.length;
        address winner = players[randomIndex];

        recentWinner = winner;
        distributePrize(winner);
    }

    function distributePrize(address winner) internal virtual {
        uint contractBalance = address(this).balance;
        (bool success, ) = winner.call{value: contractBalance}("");
        require(success, "Ether transaction failed");
    }
}
