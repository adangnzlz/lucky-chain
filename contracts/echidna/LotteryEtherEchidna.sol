// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../LotteryEther.sol";

contract LotteryEtherEchidna is LotteryEther {
    // Constructor heredado
    constructor()
        LotteryEther(
            0,
            0x0000000000000000000000000000000000000000,
            0x0000000000000000000000000000000000000000000000000000000000000000,
            false
        )
    {}

    function echidna_ticket_price_positive() public view returns (bool) {
        return lotteryTicket > 0;
    }

    function echidna_total_player_funds_no_overflow()
        public
        view
        returns (bool)
    {
        return totalPlayerFunds <= maxTotalFunds;
    }

    function echidna_no_winner_without_players() public view returns (bool) {
        return players.length > 0 || recentWinner == address(0);
    }

    function echidna_manager_initialized() public view returns (bool) {
        return manager != address(0);
    }
}
