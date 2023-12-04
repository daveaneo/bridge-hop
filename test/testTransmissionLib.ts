const { expect } = require("chai");
const { ethers } = require("hardhat");
import { TransmissionType } from './util.js';

// Your test code...


// npx hardhat test test/TransmissionLib.test.js


describe("TransmissionLib", function () {
    var lib;

//     const TransmissionType = {
//         SwapData: 0,
//         LiquidityStaging: 1,
//         Liquidity: 2
//     };


    const swapData = {
            transmissionType: TransmissionType.SwapData, // SwapData
            token: "0x0000000000000000000000000000000000000123",
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
        const hardcodedData = {
            TransmissionType: 2, // Directly using the integer value for SwapData
            token: "0x0000000000000000000000000000000000000123",
            nonce: 123,
            inAmount: 1000,
            outAmount: 2000,
            slippage: 100
        };

//         const dataStr = await lib.dataToStringSwap(1,2,3,4,5,6);
//         console.log(dataStr);
        console.log("a--")
        const dataStr = await lib.dataToStringSwap(hardcodedData);
        console.log("b--")
        console.log(dataStr)
        const decodedData = await lib.stringToDataSwap(dataStr);
        console.log("c--")
        console.log(decodedData)

        expect(decodedData.token).to.equal(hardcodedData.token);
        expect(decodedData.nonce).to.equal(hardcodedData.nonce);
        expect(decodedData.inAmount).to.equal(hardcodedData.inAmount);
        expect(decodedData.outAmount).to.equal(hardcodedData.outAmount);
        expect(decodedData.slippage).to.equal(hardcodedData.slippage);
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
