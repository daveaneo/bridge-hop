// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../TransmissionLib.sol";

contract TransmissionMock {
    using TransmissionLib for *;

    // Struct instances
    TransmissionLib.SwapData public swapData;
    TransmissionLib.LiquidityStaging public liquidityStaging;
    TransmissionLib.Liquidity public liquidity;


    // Convert to string
    function getTypeFromString(string memory myString) public pure returns (TransmissionLib.TransmissionType) {
        return TransmissionLib.getTypeFromString(myString);
    }


    // Setters
    function setSwapData(TransmissionLib.SwapData memory _swapData) public {
        swapData = _swapData;
    }

    function setLiquidityStaging(TransmissionLib.LiquidityStaging memory _liquidityStaging) public {
        liquidityStaging = _liquidityStaging;
    }

    function setLiquidity(TransmissionLib.Liquidity memory _liquidity) public {
        liquidity = _liquidity;
    }



    // Convert to string
    function swapDataToString() public view returns (string memory) {
        return TransmissionLib.dataToStringSwap(swapData);
    }

    function liquidityStagingToString() public view returns (string memory) {
        return TransmissionLib.dataToStringLiquidityStaging(liquidityStaging);
    }

    function liquidityToString() public view returns (string memory) {
        return TransmissionLib.dataToStringLiquidity(liquidity);
    }


    // Convert to bytes
    function swapDataToBytes() public view returns (bytes memory) {
        return TransmissionLib.dataToBytesSwap(swapData);
    }

    function liquidityStagingToBytes() public view returns (bytes memory) {
        return TransmissionLib.dataToBytesLiquidityStaging(liquidityStaging);
    }

    function liquidityToBytes() public view returns (bytes memory) {
        return TransmissionLib.dataToBytesLiquidity(liquidity);
    }


    // Convert from string
    function stringToSwapData(string memory dataStr) public pure returns (TransmissionLib.SwapData memory) {
        return TransmissionLib.stringToDataSwap(dataStr);
    }

    function stringToLiquidityStaging(string memory dataStr) public pure returns (TransmissionLib.LiquidityStaging memory) {
        return TransmissionLib.stringToDataLiquidityStaging(dataStr);
    }

    function stringToLiquidity(string memory dataStr) public pure returns (TransmissionLib.Liquidity memory) {
        return TransmissionLib.stringToDataLiquidity(dataStr);
    }


    // fully conversion check
    function fullConversionSwap() public view returns (TransmissionLib.SwapData memory) {
        return TransmissionLib.stringToDataSwap(TransmissionLib.dataToStringSwap(swapData));
    }

    function fullConversionLiquidity() public view returns (TransmissionLib.Liquidity memory) {
        return TransmissionLib.stringToDataLiquidity(TransmissionLib.dataToStringLiquidity(liquidity));
    }

    function fullConversionLiquidityStaging() public view returns (TransmissionLib.LiquidityStaging memory) {
        return TransmissionLib.stringToDataLiquidityStaging(TransmissionLib.dataToStringLiquidityStaging(liquidityStaging));
    }




    // inference testing
    function swapInferredCorrectly() public view returns (bool) {
        if(getTypeFromString(swapDataToString())!= TransmissionLib.TransmissionType.SwapData){
            return false;
        }
        return true;
    }

    function liquidityStagingInferredCorrectly() public view returns (bool) {
        if(getTypeFromString(liquidityStagingToString())!= TransmissionLib.TransmissionType.LiquidityStaging){
            return false;
        }
        return true;
    }

    function liquidityInferredCorrectly() public view returns (bool) {
        if(getTypeFromString(liquidityToString())!= TransmissionLib.TransmissionType.Liquidity){
            return false;
        }
        return true;
    }




    function allTypesInferredCorrectly() public view returns (bool) {
        if(getTypeFromString(swapDataToString())!= TransmissionLib.TransmissionType.SwapData){
            return false;
        }
        if(getTypeFromString(liquidityStagingToString())!= TransmissionLib.TransmissionType.LiquidityStaging){
            return false;
        }
        if(getTypeFromString(liquidityToString())!= TransmissionLib.TransmissionType.Liquidity){
            return false;
        }
        return true;
    }



}
