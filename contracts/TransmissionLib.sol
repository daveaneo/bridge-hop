// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

library TransmissionLib {
    enum TransmissionType { SwapData, LiquidityStaging, Liquidity }


    struct SwapData {
        TransmissionType transmissionType;
        address token;
        uint88 nonce;
        uint120 inAmount;
        uint120 outAmount;
        uint16 slippage;
    }

    struct LiquidityStaging {
        TransmissionType transmissionType;
        address token;
        uint88 nonce;
        uint120 inAmount;
        uint120 outAmount;
    }

    struct Liquidity {
        TransmissionType transmissionType;
        address token;
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
    function getTypeFromString(string memory dataStr) internal pure returns (TransmissionType) {
        bytes memory dataBytes = bytes(dataStr);
        require(dataBytes.length >= 32, "Invalid data length");

        uint256 typeInt;
        assembly {
            typeInt := mload(add(dataBytes, 32))
        }

        return TransmissionType(typeInt);
    }



    function dataToStringSwap(SwapData memory data) public pure returns (string memory) {
        return string(abi.encodePacked(data.transmissionType, data.token, data.nonce, data.inAmount, data.outAmount, data.slippage));
    }

    function stringToDataSwap(string memory dataStr) public pure returns (SwapData memory) {
        require(bytes(dataStr).length == 52, "Invalid data length");

        SwapData memory data;
        (data.transmissionType, data.token, data.nonce, data.inAmount, data.outAmount, data.slippage) = abi.decode(bytes(dataStr), (TransmissionType, address, uint88, uint120, uint120, uint16));

        return data;
    }

    function dataToStringLiquidityStaging(LiquidityStaging memory data) public pure returns (string memory) {
        return string(abi.encodePacked(data.transmissionType, data.token, data.nonce, data.inAmount, data.outAmount));
    }

    function stringToDataLiquidityStaging(string memory dataStr) public pure returns (LiquidityStaging memory) {
        require(bytes(dataStr).length == 50, "Invalid data length"); // 32 + 20 bytes for address, 11 bytes for uint88, 15 bytes each for two uint120s

        LiquidityStaging memory data;
        (data.transmissionType, data.token, data.nonce, data.inAmount, data.outAmount) = abi.decode(bytes(dataStr), (TransmissionType, address, uint88, uint120, uint120));

        return data;
    }


    function dataToStringLiquidity(Liquidity memory data) public pure returns (string memory) {
        return string(abi.encodePacked(data.transmissionType, data.token, data.nonce, data.mountain, data.lake, data.stagingLake));
    }



    function stringToDataLiquidity(string memory dataStr) public pure returns (Liquidity memory) {
        require(bytes(dataStr).length == 62, "Invalid data length"); // 32 + 20 bytes for address, 11 bytes for uint88, 15 bytes each for three uint120s

        Liquidity memory data;
        (data.transmissionType, data.token, data.nonce, data.mountain, data.lake, data.stagingLake) = abi.decode(bytes(dataStr), (TransmissionType, address, uint88, uint120, uint120, uint120));

        return data;
    }



    // todo -- update to new structure
    /**
     * @notice Decodes a string representation back into the SwapData structure using inline assembly for efficiency.
     * @dev Assumes a specific byte order in the string: [20 bytes for address, 12 bytes for uint96, 15 bytes each for two uint120s, and 2 bytes for uint16].
     * Uses inline assembly for efficient byte manipulation and extraction of values.
     * @param dataStr The string representation of the SwapData, encoded directly from the structure's bytes.
     * @return The decoded SwapData structure.
     */
    function stringToDataV2(string memory dataStr) public pure returns (SwapData memory) {
        require(bytes(dataStr).length == 52, "Invalid data length");

        SwapData memory data;
        assembly {
            // Load the first 32 bytes of the string into a variable, contains the first 20 bytes (address) and part of the uint96
            let buffer := mload(add(dataStr, 32))

            // Store the address (160 bits from the right)
            mstore(data, and(buffer, 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF))

            // Load next 32 bytes (12 bytes remaining of uint96 and part of first uint120)
            buffer := mload(add(dataStr, 52))

            // Store nonce
            mstore(add(data, 20), and(shr(160, buffer), 0xFFFFFFFFFFFFFFFFFFFFFFFF)) // uint96

            // Load next 32 bytes (remaining of first uint120 and part of second uint120)
            buffer := mload(add(dataStr, 67))

            // Store inAmount
            mstore(add(data, 32), and(shr(136, buffer), 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)) // uint120

            // Load next 32 bytes (remaining of second uint120 and uint16)
            buffer := mload(add(dataStr, 82))

            // Store outAmount
            mstore(add(data, 47), and(shr(136, buffer), 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)) // uint120

            // Load the last 2 bytes for slippage
            buffer := mload(add(dataStr, 97))

            // Store slippage
            mstore(add(data, 62), and(buffer, 0xFFFF)) // uint16
        }

        return data;
    }


}
