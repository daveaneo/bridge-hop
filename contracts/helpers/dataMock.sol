// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import "../TransmissionLib.sol";

contract dataMock {
    using TransmissionLib for TransmissionLib.SwapData;
    using TransmissionLib for TransmissionLib.LiquidityStaging;
    using TransmissionLib for TransmissionLib.Liquidity;
    using TransmissionLib for TransmissionLib.TransmissionType;

    address public receiver;
    address public tokenAddress;
    string public text;
    address public routerAddress;

    TransmissionLib.SwapData public mySwapData;
    TransmissionLib.LiquidityStaging public myLiquidityStaging;
    TransmissionLib.Liquidity public myLiquidity;

    // Event emitted when a message is sent to another chain.
    event MessageSent(
        bytes32 indexed messageId, // The unique ID of the CCIP message.
        uint64 indexed destinationChainSelector, // The chain selector of the destination chain.
        address receiver, // The address of the receiver on the destination chain.
        bytes data, // The text being sent.
        address feeToken, // the token address used to pay CCIP fees.
        uint256 fees // The fees paid for sending the CCIP message.
    );

//        TransmissionType transmissionType;
//        address token;
//        address beneficiary;
//        uint88 nonce;
//        uint120 inAmount;
//        uint120 outAmount;
//        uint16 slippage;
    constructor(address _reciever, string memory _text, address _tokenAddress, address _routerAddress){
        receiver = _reciever;
        text = _text;
        tokenAddress = _tokenAddress;
        routerAddress = _routerAddress;

        mySwapData = TransmissionLib.SwapData({
            transmissionType: TransmissionLib.TransmissionType.SwapData,
            token: address(0),
            beneficiary: address(this),
            nonce: 1,
            inAmount: 2,
            outAmount: 3,
            slippage: 4
        });

    }




    function getData() external view returns (Client.EVM2AnyMessage memory) {
        return _buildCCIPMessageV2(receiver, getBytes(), tokenAddress);
    }

    /// @notice Construct a CCIP message.
    /// @dev This function will create an EVM2AnyMessage struct with all the necessary information for sending a text.
    /// @param _receiver The address of the receiver.
    /// @param _text The string data to be sent.
    /// @param _feeTokenAddress The address of the token used for fees. Set address(0) for native gas.
    /// @return Client.EVM2AnyMessage Returns an EVM2AnyMessage struct which contains information for sending a CCIP message.
    function _buildCCIPMessage(
        address _receiver,
        string memory _text,
        address _feeTokenAddress
    ) internal pure returns (Client.EVM2AnyMessage memory) {
        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        return
            Client.EVM2AnyMessage({
                receiver: abi.encode(_receiver), // ABI-encoded receiver address
                data: abi.encode(_text), // ABI-encoded string
                tokenAmounts: new Client.EVMTokenAmount[](0), // Empty array aas no tokens are transferred
                extraArgs: Client._argsToBytes(
                    // Additional arguments, setting gas limit and non-strict sequencing mode
                    Client.EVMExtraArgsV1({gasLimit: 2_000_000, strict: false})
                ),
                // Set the feeToken to a feeTokenAddress, indicating specific asset will be used for fees
                feeToken: _feeTokenAddress
            });
    }


    /// @notice Construct a CCIP message.
    /// @dev This function will create an EVM2AnyMessage struct with all the necessary information for sending a text.
    /// @param _receiver The address of the receiver.
    /// @param _data The  data to be sent.
    /// @param _feeTokenAddress The address of the token used for fees. Set address(0) for native gas.
    /// @return Client.EVM2AnyMessage Returns an EVM2AnyMessage struct which contains information for sending a CCIP message.
    function _buildCCIPMessageV2(
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

    function getFullCircle() public view returns (TransmissionLib.SwapData memory){
        bytes memory encoded =  abi.encode(mySwapData);

        TransmissionLib.SwapData memory data;
        (data.transmissionType, data.token, data.beneficiary, data.nonce, data.inAmount, data.outAmount, data.slippage) = abi.decode(encoded, (TransmissionLib.TransmissionType, address, address, uint88, uint120, uint120, uint16));
//        data = abi.decode(encoded, (TransmissionLib.SwapData));
        return data;
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
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessageV2(
            _receiver,
            _data,
            address(0)
        );

        IRouterClient router = IRouterClient(routerAddress);
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
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessageV2(
            _receiver,
            _data,
            address(0)
        );

        // Initialize a router client instance to interact with cross-chain router
        IRouterClient router = IRouterClient(routerAddress);

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

//        uint256 amount = 0; // compatible with taking fees

//        // Check if there's enough balance to cover fees and amount
//        require(fees + amount <= address(this).balance, string(abi.encodePacked(
//            "Not enough balance: required ",
//            uintToString(fees + amount),
//            ", available ",
//            uintToString(address(this).balance)
//        )));

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

    // Helper function to convert a uint256 to a string
    function uintToString(uint256 _value) internal pure returns (string memory) {
        if (_value == 0) {
            return "0";
        }
        uint256 temp = _value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (_value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + _value % 10));
            _value /= 10;
        }
        return string(buffer);
    }

}
