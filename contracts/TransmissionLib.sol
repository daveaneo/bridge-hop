// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";

library TransmissionLib {
    enum TransmissionType { SwapData, LiquidityStaging, Liquidity }


    struct SwapData {
        TransmissionType transmissionType;
        address token;
        address beneficiary;
        uint88 nonce;
        uint120 inAmount;
        uint120 outAmount;
        uint16 slippage;
    }

    struct LiquidityStaging {
        TransmissionType transmissionType;
        address token;
        address beneficiary;
        uint88 nonce;
        uint120 inAmount;
        uint120 outAmount;
    }

    struct Liquidity {
        TransmissionType transmissionType;
        address token;
        address beneficiary;
        uint88 nonce;
        uint120 mountain;
        uint120 lake;
        uint120 stagingLake;
    }


    /**
     * @notice Decodes the string to determine the transmission type.
     * @dev Decodes the string using abi.decode. Assumes the first element is the TransmissionType.
     * @param dataStr The encoded string.
     * @return The decoded TransmissionType.
     */
    function getTypeFromString(string memory dataStr) public pure returns (TransmissionType) {
        bytes memory dataBytes = bytes(dataStr);
        require(dataBytes.length >= 32, "Invalid data length--getType");



        uint256 typeInt;
        assembly {
            typeInt := mload(add(dataBytes, 32))
        }

        return TransmissionType(typeInt);

    }



        // todo -- i changed this to encode from encdoePacked
    function dataToStringSwap(SwapData memory data) public pure returns (string memory) {
        return string(abi.encode(data.transmissionType, data.token, data.beneficiary, data.nonce, data.inAmount, data.outAmount, data.slippage));
    }

    function dataToBytesSwap(SwapData memory data) public pure returns (bytes memory) {
        return abi.encode(data.transmissionType, data.token,  data.beneficiary, data.nonce, data.inAmount, data.outAmount, data.slippage);
    }


    function stringToDataSwap(string memory dataStr) public pure returns (SwapData memory) {
        require(bytes(dataStr).length == 224, "Invalid data length--stringTo");
//        require(bytes(dataStr).length == 224, dataStr);

        SwapData memory data;
        (data.transmissionType, data.token, data.beneficiary, data.nonce, data.inAmount, data.outAmount, data.slippage) = abi.decode(bytes(dataStr), (TransmissionType, address, address, uint88, uint120, uint120, uint16));

        return data;
    }

    function dataToStringLiquidityStaging(LiquidityStaging memory data) public pure returns (string memory) {
        return string(abi.encode(data.transmissionType, data.token, data.beneficiary, data.nonce, data.inAmount, data.outAmount));
    }

    function dataToBytesLiquidityStaging(LiquidityStaging memory data) public pure returns (bytes memory) {
        return abi.encode(data.transmissionType, data.token, data.beneficiary, data.nonce, data.inAmount, data.outAmount);
    }

    function stringToDataLiquidityStaging(string memory dataStr) public pure returns (LiquidityStaging memory) {
        require(bytes(dataStr).length == 192, "Invalid data length--liquidityStaging"); // 32 + 20 bytes for address, 11 bytes for uint88, 15 bytes each for two uint120s
//        require(bytes(dataStr).length == 192, dataStr); // 32 + 20 bytes for address, 11 bytes for uint88, 15 bytes each for two uint120s

        LiquidityStaging memory data;
        (data.transmissionType, data.token, data.beneficiary, data.nonce, data.inAmount, data.outAmount) = abi.decode(bytes(dataStr), (TransmissionType, address, address, uint88, uint120, uint120));

        return data;
    }


    function dataToStringLiquidity(Liquidity memory data) public pure returns (string memory) {
        return string(abi.encode(data.transmissionType, data.token, data.beneficiary, data.nonce, data.mountain, data.lake, data.stagingLake));
    }

    function dataToBytesLiquidity(Liquidity memory data) public pure returns (bytes memory) {
        return abi.encode(data.transmissionType, data.token, data.beneficiary, data.nonce, data.mountain, data.lake, data.stagingLake);
    }

    function stringToDataLiquidity(string memory dataStr) public pure returns (Liquidity memory) {
        require(bytes(dataStr).length == 224, "Invalid data length--liquidity"); // 32 + 20 bytes for address, 11 bytes for uint88, 15 bytes each for three uint120s

        Liquidity memory data;
        (data.transmissionType, data.token, data.beneficiary, data.nonce, data.mountain, data.lake, data.stagingLake) = abi.decode(bytes(dataStr), (TransmissionType, address, address, uint88, uint120, uint120, uint120));

        return data;
    }


//
//    // todo -- update to new structure
//    /**
//     * @notice Decodes a string representation back into the SwapData structure using inline assembly for efficiency.
//     * @dev Assumes a specific byte order in the string: [20 bytes for address, 12 bytes for uint96, 15 bytes each for two uint120s, and 2 bytes for uint16].
//     * Uses inline assembly for efficient byte manipulation and extraction of values.
//     * @param dataStr The string representation of the SwapData, encoded directly from the structure's bytes.
//     * @return The decoded SwapData structure.
//     */
//    function stringToDataV2(string memory dataStr) public pure returns (SwapData memory) {
//        require(bytes(dataStr).length == 52, "Invalid data length");
//
//        SwapData memory data;
//        assembly {
//            // Load the first 32 bytes of the string into a variable, contains the first 20 bytes (address) and part of the uint96
//            let buffer := mload(add(dataStr, 32))
//
//            // Store the address (160 bits from the right)
//            mstore(data, and(buffer, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF))
//
//            // Load next 32 bytes (12 bytes remaining of uint96 and part of first uint120)
//            buffer := mload(add(dataStr, 52))
//
//            // Store nonce
//            mstore(add(data, 20), and(shr(160, buffer), 0xFFFFFFFFFFFFFFFFFFFFFFFF)) // uint96
//
//            // Load next 32 bytes (remaining of first uint120 and part of second uint120)
//            buffer := mload(add(dataStr, 67))
//
//            // Store inAmount
//            mstore(add(data, 32), and(shr(136, buffer), 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)) // uint120
//
//            // Load next 32 bytes (remaining of second uint120 and uint16)
//            buffer := mload(add(dataStr, 82))
//
//            // Store outAmount
//            mstore(add(data, 47), and(shr(136, buffer), 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)) // uint120
//
//            // Load the last 2 bytes for slippage
//            buffer := mload(add(dataStr, 97))
//
//            // Store slippage
//            mstore(add(data, 62), and(buffer, 0xFFFF)) // uint16
//        }
//
//        return data;
//    }



    function calculateCCIPFee(
        TransmissionType structureType,
        bytes memory transmissionData,
        address _receiver,
        uint64 _destinationChainSelector,
        address _router
    ) external view returns (uint256 fee) {
        string memory _text;

        // Determine which structure to use and create the text
        if (structureType == TransmissionType.SwapData) {
            SwapData memory swapData = abi.decode(transmissionData, (SwapData));
            _text = dataToStringSwap(swapData);
        } else if (structureType == TransmissionType.LiquidityStaging) {
            LiquidityStaging memory liquidityStaging = abi.decode(transmissionData, (LiquidityStaging));
            _text = dataToStringLiquidityStaging(liquidityStaging);
        } else if (structureType == TransmissionType.Liquidity) {
            Liquidity memory liquidity = abi.decode(transmissionData, (Liquidity));
            _text = dataToStringLiquidity(liquidity);
        } else {
            revert("Invalid structure type");
        }

        // Create an EVM2AnyMessage struct
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            _receiver,
            _text,
            address(0) // Assuming fees are paid in the native currency
        );

        // Calculate the fee
        IRouterClient router = IRouterClient(_router);
        fee = router.getFee(_destinationChainSelector, evm2AnyMessage);

        return fee;
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
    ) public pure returns (Client.EVM2AnyMessage memory) { /// todo -- changed from internal for testing
        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        return
            Client.EVM2AnyMessage({
                receiver: abi.encode(_receiver), // ABI-encoded receiver address
                data: abi.encode(_text), // ABI-encoded string
                tokenAmounts: new Client.EVMTokenAmount[](0), // Empty array aas no tokens are transferred
                extraArgs: Client._argsToBytes(
                    // Additional arguments, setting gas limit and non-strict sequencing mode
                    Client.EVMExtraArgsV1({gasLimit: 200_000, strict: false})
                ),
                // Set the feeToken to a feeTokenAddress, indicating specific asset will be used for fees
                feeToken: _feeTokenAddress
            });
    }


}
