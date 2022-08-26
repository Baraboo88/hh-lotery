//SPDX-License-Identifier:MIT

pragma solidity ^0.8.7;
//Enter the lottery

//Pick a random winner
// winner to be selected every x minutes -> completely automate
//chainlink oracle -> Randomness, Automated Execution (Chainlink Keeper)

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

error Raffle__NotEnoughEthEntered();

contract Raffle is VRFConsumerBaseV2 {
    //State variables
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    bytes32 private immutable i_gasLane;


    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    //EVENTS
    event RaffleEnter(address indexed player);

    constructor(address vrfCoordinator, uint256 entranceFee, bytes32 gasLane)
        VRFConsumerBaseV2(vrfCoordinator)
    {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_gasLane = gasLane;
    }

    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnoughEthEntered();
        }

        s_players.push(payable(msg.sender));
        //emit an event when we update a dynamic array or mapping
        //Named events with function name reversed

        emit RaffleEnter(msg.sender);
    }

    function hello() public {}

    function requestRandomWinner() external {
        //request the random number
        // once we get it, do something with it,
        // 2 transaction process
       i_vrfCoordinator.requestRandomWords(
        i_gasLane, //gasLane
        s_subscriptionId,
        requestConfirmations,
        callbackGasLimit,
        numWords
       );
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords)
        internal
        override
    {
  
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }
}
