// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import "./TransmissionLib.sol";

contract Terrain is CCIPReceiver, OwnerIsCreator {
    using TransmissionLib for TransmissionLib.SwapData;
    using TransmissionLib for TransmissionLib.LiquidityStaging;
    using TransmissionLib for TransmissionLib.Liquidity;
    using TransmissionLib for TransmissionLib.TerrainType;
    using TransmissionLib for TransmissionLib.TransmissionType;

    // temp

    TransmissionLib.SwapData public mySwapData;
    TransmissionLib.LiquidityStaging public myLiquidityStaging;
    TransmissionLib.Liquidity public myLiquidity;

    /////////////////////////
    ////  State Variables ///
    /////////////////////////

    bytes32 private s_lastReceivedMessageId; // Store the last received messageId.
    string private s_lastReceivedText; // Store the last received text.
    uint88 public nonce; // successful bridge nonce used across all networks
    uint256 public myNetworkAddress;
    TransmissionLib.TerrainType public terrain;
    TransmissionLib.TerrainInfo public mountainInfo;


    // [blockchain identifier][token's address] => amount
    mapping(uint256 => mapping(address => uint256)) public liquidity;
    // [blockchain identifier][token's address] => amount
    mapping(uint256 => mapping(address => uint256)) public liquidityStaging;
    // Mapping for approved withdrawals (used when this contract acts as a Lake)
    mapping(uint256 => mapping(address => uint256)) public approvedWithdrawals;


    // Mapping to keep track of allowlisted destination chains.
    mapping(uint64 => bool) public allowlistedDestinationChains;

    // Mapping to keep track of allowlisted source chains.
    mapping(uint64 => bool) public allowlistedSourceChains;

    // Mapping to keep track of allowlisted senders.
    mapping(address => bool) public allowlistedSenders;

    IERC20 public s_linkToken;



    //////////////////////////
    ////  Public Functions ///
    //////////////////////////



    // Event emitted when a message is sent to another chain.
    event MessageSent(
        bytes32 indexed messageId, // The unique ID of the CCIP message.
        uint64 indexed destinationChainSelector, // The chain selector of the destination chain.
        address receiver, // The address of the receiver on the destination chain.
        bytes data, // The text being sent.
        address feeToken, // the token address used to pay CCIP fees.
        uint256 fees // The fees paid for sending the CCIP message.
    );

    /// @notice Constructor initializes the contract with the router address.
    /// @param _router The address of the router contract.
    /// @param _link The address of the link contract.
    constructor(address _router, address _link, TransmissionLib.TerrainType _terrain, uint256 _myNetworkAddress) CCIPReceiver(_router)  {
        s_linkToken = IERC20(_link);
        terrain = _terrain;
        myNetworkAddress = _myNetworkAddress;
    }




//    function getData() external view returns (Client.EVM2AnyMessage memory) {
//        return _buildCCIPMessage(receiver, getBytes(), tokenAddress);
//    }

    /// @notice Construct a CCIP message.
    /// @dev This function will create an EVM2AnyMessage struct with all the necessary information for sending a text.
    /// @param _receiver The address of the receiver.
    /// @param _data The  data to be sent.
    /// @param _feeTokenAddress The address of the token used for fees. Set address(0) for native gas.
    /// @return Client.EVM2AnyMessage Returns an EVM2AnyMessage struct which contains information for sending a CCIP message.
    function _buildCCIPMessage(
        address _receiver,
        bytes memory _data,
        address _feeTokenAddress
    ) internal pure returns (Client.EVM2AnyMessage memory) {
        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        return
            Client.EVM2AnyMessage({
                receiver: abi.encode(_receiver), // ABI-encoded receiver address
                data: _data, // ABI-encoded string
                tokenAmounts: new Client.EVMTokenAmount[](0), // Empty array aas no tokens are transferred
                extraArgs: Client._argsToBytes(
                    // Additional arguments, setting gas limit and non-strict sequencing mode
                    Client.EVMExtraArgsV1({gasLimit: 2_000_000, strict: false})
                ),
                // Set the feeToken to a feeTokenAddress, indicating specific asset will be used for fees
                feeToken: _feeTokenAddress
            });
    }




//    function getText() public view returns (string memory){
//        return string(abi.encode(mySwapData.transmissionType, mySwapData.token, mySwapData.beneficiary, mySwapData.nonce, mySwapData.inAmount, mySwapData.outAmount, mySwapData.slippage));
//    }


    function getBytes() public view returns (bytes memory){
        return abi.encode(mySwapData);
    }

    function getFee(
        uint64 _destinationChainSelector,
        address _receiver,
        bytes memory _data
    )
        public view
        returns (uint256)
    {

        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            _receiver,
            _data,
            address(0)
        );

        IRouterClient router = IRouterClient(this.getRouter());
        uint256 fees = router.getFee(_destinationChainSelector, evm2AnyMessage);
        return fees;
    }


    /// @notice Sends data to receiver on the destination chain.
    /// @notice Pay for fees in native gas.
    /// @dev Assumes your contract has sufficient native gas tokens.
    /// @param _destinationChainSelector The identifier (aka selector) for the destination blockchain.
    /// @param _receiver The address of the recipient on the destination blockchain.
    /// @param _data The data to be sent.
    /// @return messageId The ID of the CCIP message that was sent.
    function sendMessagePayNative(
        uint64 _destinationChainSelector,
        address _receiver,
        bytes memory _data
    )
        public payable
        returns (bytes32 messageId)
    {

        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            _receiver,
            _data,
            address(0)
        );

        // Initialize a router client instance to interact with cross-chain router
        IRouterClient router = IRouterClient(this.getRouter());

        // Get the fee required to send the CCIP message
        uint256 fees = router.getFee(_destinationChainSelector, evm2AnyMessage);

        uint256 amount = 0;

        if (fees < msg.value)
            revert("not enough balance");
        else{
            uint256 overpay = msg.value - fees - amount;
            if (overpay>0){
                payable(msg.sender).transfer(overpay);
            }
        }

        // Send the CCIP message through the router and store the returned CCIP message ID
        messageId = router.ccipSend{value: fees}(
            _destinationChainSelector,
            evm2AnyMessage
        );

        // Emit an event with message details
        emit MessageSent(
            messageId,
            _destinationChainSelector,
            _receiver,
            _data,
            address(0),
            fees
        );

        // Return the CCIP message ID
        return messageId;
    }

    /// todo -- overwrite
    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    )
        internal
        override
    {
    }


}
