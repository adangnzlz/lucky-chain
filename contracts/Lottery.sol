// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@chainlink/contracts/src/v0.8/vrf/mocks/VRFCoordinatorV2Mock.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "hardhat/console.sol";

error NotImplementedYet();

contract Lottery is VRFConsumerBaseV2 {
    uint64 internal subscriptionId;
    bytes32 private keyHash;

    VRFCoordinatorV2Interface COORDINATOR;
    uint32 private callbackGasLimit = 100000;
    uint16 private requestConfirmations = 3;
    uint32 private numWords = 1;

    address public manager;
    address[] public players;
    uint256 public lotteryTicket = 0.01 ether;
    address public recentWinner;

    mapping(address => uint256) public pendingWithdrawals;

    event PlayerEntered(address indexed player, uint256 amount);
    event CallbackGasLimitUpdated(uint32 newGasLimit);
    event LotteryTicketPriceUpdated(uint256 newPrice);
    event WinnerPicked(address indexed winner);
    event PrizeDistributed(address indexed winner, uint256 amount);

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

    function setGasLimit(uint32 newGasLImit) external restricted {
        callbackGasLimit = newGasLImit;
        emit CallbackGasLimitUpdated(newGasLImit);
    }

    function setLotteryTicket(uint256 newPrice) external restricted {
        lotteryTicket = newPrice;
        emit LotteryTicketPriceUpdated(newPrice);
    }

    function enter() external payable validTicket {
        players.push(msg.sender);
        emit PlayerEntered(msg.sender, lotteryTicket);
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
        emit WinnerPicked(winner);
        distributePrize(winner);
    }

    function distributePrize(address winner) internal virtual {
        uint prizeAmount = address(this).balance;
        pendingWithdrawals[winner] = prizeAmount;
        emit PrizeDistributed(winner, prizeAmount);
    }

    function withdrawPrize() external virtual {
        uint256 prizeAmount = pendingWithdrawals[msg.sender];
        require(prizeAmount > 0, "No winnings to withdraw");
        pendingWithdrawals[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: prizeAmount}("");
        require(success, "Ether transaction failed");
    }
}
