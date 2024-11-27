// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// import "./assetsmanagement/ERC20Handler.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./Lottery.sol";
import "hardhat/console.sol";

contract LotteryLink is Lottery {
    IERC20 public token;
    uint32 private callbackGasLimit = 100000;
    uint256 private defaultLotteryTicket = 1;

    constructor(
        uint64 _subscriptionId,
        address _vrfCoordinator,
        bytes32 _keyHash,
        address _tokenAddress
    ) Lottery(_subscriptionId, _vrfCoordinator, _keyHash) {
        token = IERC20(_tokenAddress);
        lotteryTicket = defaultLotteryTicket * 10 ** getDecimals(_tokenAddress);
        // assetHandler = new ERC20Handler(_tokenAddress);
    }

    modifier validTicket() override {
        require(
            token.transferFrom(msg.sender, address(this), lotteryTicket),
            "Token transfer failed"
        );
        // require(
        //     assetHandler.transfer(address(this), lotteryTicket),
        //     "Ticket purchase failed"
        // );
        _;
    }

    function pickWinner() public override restricted minPlayers {
        (uint96 balance, , , ) = COORDINATOR.getSubscription(subscriptionId);
        require(
            balance >= callbackGasLimit * tx.gasprice,
            "Insufficient funds in the subscription"
        );
        super.pickWinner();
    }

    function distributePrize(address winner) internal override {
        uint256 contractBalance = token.balanceOf(address(this));
        require(
            token.transfer(winner, contractBalance),
            "Token transfer failed"
        );
    }

    function getDecimals(address _token) public view returns (uint8) {
        try IERC20Metadata(_token).decimals() returns (uint8 value) {
            return value;
        } catch {
            return 18; // valor por defecto
        }
    }
}
