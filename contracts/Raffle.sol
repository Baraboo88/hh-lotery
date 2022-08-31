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
error Raffle__TransfereFailed();
error Raffle__NotOpen();
error Raffle_UpkeepNotNeeded(
    uint256 currentBalance,
    uint256 numPlayers,
    uint256 raffleState
);

/**
 * @title A sample Raffle Contract
 * @author Patrick
 * @notice This contract is for creating an unramperable decentralized smart contract
 * @dev This implements ChainLink VRF v2 and chainlink keepers
 *
 */

contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
    //Type declaration

    enum RaffleState {
        OPEN,
        CALCULATING
    }

    //State variables

    address payable[] private s_players;

    //IMMUTABLES
    uint256 private immutable i_entranceFee;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    bytes32 private immutable i_gasLane;
    uint64 private immutable i_subscriptionId;
    uint32 private immutable i_callbackGasLimit;

    uint16 private constant REQUEST_COMFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    //lottery variables

    address private s_resentWinner;
    RaffleState private s_raffleState;
    uint256 private s_lastTimeStamp;
    uint256 private immutable i_interval;

    //EVENTS
    event RaffleEnter(address indexed player);
    event RequetedRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    //FUNCTIONS

    constructor(
        address vrfCoordinator, //contract address
        uint256 entranceFee,
        bytes32 gasLane,
        uint64 subscriptionId,
        uint32 callbackGasLimit,
        uint256 interval
    ) VRFConsumerBaseV2(vrfCoordinator) {
        i_entranceFee = entranceFee;
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_gasLane = gasLane;
        i_subscriptionId = subscriptionId;
        i_callbackGasLimit = callbackGasLimit;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = interval;
    }

    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnoughEthEntered();
        }
        if (s_raffleState != RaffleState.OPEN) {
            revert Raffle__NotOpen();
        }
        s_players.push(payable(msg.sender));
        //emit an event when we update a dynamic array or mapping
        //Named events with function name reversed

        emit RaffleEnter(msg.sender);
    }

    /**
     * @dev This is the function that the ChainLink Keeper nodes call
     * they look for the upkeepNeeded to return true
     * The following this be true in order to return true:
     * 1. Our time interval should hava passed;
     * 2. The lottery should have at least 1 player, and have some Eth
     * 3. Our subscription is funded with Link
     * 4. THe lottery should be in open state
     */

    function checkUpkeep(
        bytes memory /*checkData */
    )
        public
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        bool isOpen = (RaffleState.OPEN == s_raffleState);
        bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
        bool hasPlayers = (s_players.length > 0);
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);
    }

    function performUpkeep(
        bytes calldata /*performData*/
    ) external override {
        //request the random number
        // once we get it, do something with it,
        // 2 transaction process
        (bool upkeepNeeded, ) = checkUpkeep("");

        if (!upkeepNeeded) {
            revert Raffle_UpkeepNotNeeded(
                address(this).balance,
                s_players.length,
                uint256(s_raffleState)
            );
        }

        s_raffleState = RaffleState.CALCULATING;

        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane, //gasLane
            i_subscriptionId,
            REQUEST_COMFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        emit RequetedRaffleWinner(requestId);
    }

    function fulfillRandomWords(uint256, uint256[] memory randomWords)
        internal
        override
    {
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        address payable recentWinner = s_players[indexOfWinner];
        s_resentWinner = recentWinner;

        s_raffleState = RaffleState.OPEN;
        s_players = new address payable[](0);
        s_lastTimeStamp = block.timestamp;
        (bool success, ) = recentWinner.call{value: address(this).balance}("");

        if (!success) {
            revert Raffle__TransfereFailed();
        }

        emit WinnerPicked(recentWinner);
    }

    //View Pure functions

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }

    function getRecentWinner() public view returns (address) {
        return s_resentWinner;
    }

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getNumberOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLatestTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getRequestConfirmation() public pure returns (uint256) {
        return REQUEST_COMFIRMATIONS;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }
}
