// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "hardhat/console.sol";

error NotImplementedYet();

contract LotteryEther is VRFConsumerBaseV2, Ownable {
    uint64 internal subscriptionId;
    bytes32 private keyHash;
    bool private isERC20;
    bool private isLocalNetwork;

    VRFCoordinatorV2Interface COORDINATOR;
    uint32 public callbackGasLimit = 100000;
    uint16 private requestConfirmations = 3;
    uint32 private numWords = 1;

    address public manager;
    address[] public players;
    uint256 public lotteryTicket = 0.0001 ether;
    uint256 public maxTotalFunds = 1000 ether;

    uint256 public totalPlayerFunds = 0;
    address public recentWinner;

    mapping(address => uint256) public pendingWithdrawals;

    event PlayerEntered(address indexed player, uint256 amount);
    event CallbackGasLimitUpdated(uint32 newGasLimit);
    event LotteryTicketPriceUpdated(uint256 newPrice);
    event RandomWordsRequested(uint256 requestId);
    event PrizeDistributed(address indexed winner, uint256 amount);
    event PrizeClaimed();

    constructor(
        uint64 _subscriptionId,
        address _vrfCoordinator,
        bytes32 _keyHash,
        bool _isERC20,
        bool _isLocalNetwork
    ) VRFConsumerBaseV2(_vrfCoordinator) Ownable(msg.sender) {
        manager = msg.sender;
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        isERC20 = _isERC20;
        isLocalNetwork = _isLocalNetwork;
    }

    receive() external payable {
        revert("Direct transfers not allowed");
    }

    modifier lotteryOpen() {
        require(
            recentWinner == address(0),
            "Last winner pending to collect prize"
        );
        _;
    }
    modifier minPlayers() {
        require(players.length > 1, "No minimum players in the lottery");
        _;
    }

    modifier validTicket() virtual {
        require(
            totalPlayerFunds + msg.value <= maxTotalFunds,
            "Exceeds maximum allowed funds"
        );
        require(msg.value == lotteryTicket, "Incorrect ticket ammount");
        totalPlayerFunds += msg.value;
        assert(totalPlayerFunds >= 0);
        _;
    }

    function getPlayers() public view returns (address[] memory) {
        return players;
    }

    function setGasLimit(uint32 newGasLImit) external onlyOwner {
        callbackGasLimit = newGasLImit;
        emit CallbackGasLimitUpdated(newGasLImit);
    }

    function setLotteryTicket(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "The ticket price must be a positive amount.");
        lotteryTicket = newPrice;
        emit LotteryTicketPriceUpdated(newPrice);
    }

    function enter() external payable validTicket lotteryOpen {
        players.push(msg.sender);
        emit PlayerEntered(msg.sender, lotteryTicket);
    }

    function pickWinner() public virtual onlyOwner minPlayers {
        uint256 requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );
        emit RandomWordsRequested(requestId);

        // Si estamos en una red local, simular fulfillRandomWords
        if (isLocalNetwork) {
            uint256[] memory randomWords = new uint256[](numWords);
            for (uint256 i = 0; i < numWords; i++) {
                randomWords[i] = uint256(
                    keccak256(abi.encodePacked(block.timestamp, requestId, i))
                );
            }

            fulfillRandomWords(requestId, randomWords);
        }
    }

    function withdrawPrize() external {
        uint256 prizeAmount = pendingWithdrawals[msg.sender];
        pendingWithdrawals[msg.sender] = 0;
        recentWinner = address(0);
        emit PrizeClaimed();
        transferWinner(msg.sender, prizeAmount);
    }

    // callback Chainlink
    function fulfillRandomWords(
        uint256 /* requestId */,
        uint256[] memory randomWords
    ) internal override {
        uint256 randomIndex = randomWords[0] % players.length;
        address winner = players[randomIndex];

        recentWinner = winner;
        players = new address[](0);
        distributePrize(winner);
    }

    function distributePrize(address winner) private {
        uint256 prizeAmount = totalPlayerFunds;
        pendingWithdrawals[winner] += prizeAmount;
        totalPlayerFunds = 0;
        emit PrizeDistributed(winner, prizeAmount);
    }

    function transferWinner(address to, uint256 amount) internal virtual {
        require(to != address(0), "Invalid address"); // Validar dirección
        require(amount > 0, "Invalid amount"); // Validar monto

        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
