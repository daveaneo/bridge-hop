const { expect } = require("chai");
const { ethers } = require("hardhat");
import { TransmissionType } from './util.js';

/// removed this testing script because of difficulties intereacting with it. Now using testTrasmissionMock

// Your test code...


// npx hardhat test test/TransmissionLib.test.js


describe("Test TransmissionLib", function () {
    var lib;

//     const TransmissionType = {
//         SwapData: 0,
//         LiquidityStaging: 1,
//         Liquidity: 2
//     };


    const swapData = {
        transmissionType: TransmissionType.SwapData,
        token: "0x0000000000000000000000000000000000000123",
        beneficiary: "0x6ADe6a2BDfBDa76C4555005eE7Dd7DcDE571D2a8",
        nonce: 123,
        inAmount: 1000,
        outAmount: 2000,
        slippage: 100
    };




    before(async function () {
        // Deploy the TransmissionLib as a contract for testing purposes
        const Lib = await ethers.getContractFactory("TransmissionLib");
        lib = await Lib.deploy();
    });


    it("should correctly convert SwapData to and from a string--hardcoded", async function () {
        console.log("a--")
        const encodedSwapData = ethers.utils.defaultAbiCoder.encode(
            ["tuple(uint8 transmissionType, address token, address beneficiary, uint88 nonce, uint120 inAmount, uint120 outAmount, uint16 slippage)"],
            [swapData]
        );
        console.log("a2--")

//         console.log("swap Data: ")
//         console.log(swapData);
//         console.log("encodedSwapData: ")
//         console.log(encodedSwapData);

//         const dataStr = await lib.dataToStringSwap(swapData);
        const dataStr = await lib.dataToStringSwap(swapData);
        console.log("b--")
        console.log(dataStr)
        const decodedData = await lib.stringToDataSwap(dataStr);
        console.log("c--")
        console.log(decodedData)

        expect(decodedData.token).to.equal(swapData.token);
        expect(decodedData.nonce).to.equal(swapData.nonce);
        expect(decodedData.inAmount).to.equal(swapData.inAmount);
        expect(decodedData.outAmount).to.equal(swapData.outAmount);
        expect(decodedData.slippage).to.equal(swapData.slippage);
    });


    it("should correctly convert SwapData to and from a string", async function () {
//         const dataStr = await lib.dataToStringSwap(swapData);
        console.log("")
        console.log("-----------A");
        const dataStr = await lib.dataToStringSwap({
            TransmissionType: TransmissionType.SwapData, // This should be an integer
            token: swapData.token,
            nonce: swapData.nonce,
            inAmount: swapData.inAmount,
            outAmount: swapData.outAmount,
            slippage: swapData.slippage
        });
        console.log("-----------B");
        console.log("dataStr: ", dataStr);
        const decodedData = await lib.stringToDataSwap(dataStr);

        console.log("decodedData: ");
        console.log(decodedData);

        expect(decodedData.token).to.equal(swapData.token);
        expect(decodedData.nonce).to.equal(swapData.nonce);
        expect(decodedData.inAmount).to.equal(swapData.inAmount);
        expect(decodedData.outAmount).to.equal(swapData.outAmount);
        expect(decodedData.slippage).to.equal(swapData.slippage);
    });

    // Similar tests for LiquidityStaging and Liquidity structures
    // ...

    it("should correctly determine the transmission type from a string", async function () {
        const dataStr = await lib.dataToStringSwap({
            swapData
        });

        console.log("data returned: ");
        console.log(dataStr);

        const type = await lib.getTypeFromString(dataStr);
        expect(type).to.equal(TransmissionType.SwapData); // Expecting SwapData type
    });

    // Additional tests as needed
});
