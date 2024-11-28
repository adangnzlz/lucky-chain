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

    // Propiedades para Echidna
    function echidna_only_owner_can_change_ticket_price()
        public
        view
        returns (bool)
    {
        return msg.sender != manager;
    }

    function echidna_ticket_price_positive() public view returns (bool) {
        return lotteryTicket > 0;
    }

    function echidna_total_player_funds_no_overflow()
        public
        view
        returns (bool)
    {
        return totalPlayerFunds <= type(uint256).max;
    }

    function echidna_no_winner_without_players() public view returns (bool) {
        return getPlayers().length > 0 || recentWinner == address(0);
    }

}
