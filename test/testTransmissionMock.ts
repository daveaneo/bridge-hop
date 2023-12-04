const { expect } = require("chai");
const { ethers } = require("hardhat");
const { TransmissionType } = require('./util');

// Example JavaScript function to remove '0x' from a hexadecimal string
function remove0xPrefix(hexString) {
    if (hexString.startsWith('0x')) {
        return hexString.slice(2);
    }
    return hexString;
}

describe("TransmissionLib via TransmissionMock", function () {
    let transmissionMock;

    const swapData = {
        transmissionType: TransmissionType.SwapData,
        token: "0x0000000000000000000000000000000000000123",
        nonce: 123,
        inAmount: 1000,
        outAmount: 2000,
        slippage: 100
    };

    const liquidityStagingData = {
        transmissionType: TransmissionType.LiquidityStaging,
        token: "0x0000000000000000000000000000000000000456",
        nonce: 456,
        inAmount: 3000,
        outAmount: 6000
    };


    const liquidityData = {
        transmissionType: TransmissionType.Liquidity,
        token: "0x0000000000000000000000000000000000000789",
        nonce: 789,
        mountain: 4000,
        lake: 5000,
        stagingLake: 2000
    };





    before(async function () {
        const TransmissionLib = await ethers.getContractFactory("TransmissionLib");
        const transmissionLib = await TransmissionLib.deploy();
        await transmissionLib.deployed();

        const TransmissionMock = await ethers.getContractFactory("TransmissionMock", {
            libraries: {
                TransmissionLib: transmissionLib.address,
            },
        });

//         const TransmissionMock = await ethers.getContractFactory("TransmissionMock");

        transmissionMock = await TransmissionMock.deploy();

        // set data
        await transmissionMock.setSwapData(swapData);
        await transmissionMock.setLiquidity(liquidityData);
        await transmissionMock.setLiquidityStaging(liquidityStagingData);

    });

    it("should set SwapData correctly", async function () {
        const receivedData = await transmissionMock.swapData();

        expect(receivedData.transmissionType).to.equal(swapData.transmissionType);
        expect(receivedData.token).to.equal(swapData.token);
        expect(receivedData.nonce).to.equal(swapData.nonce);
        expect(receivedData.inAmount).to.equal(swapData.inAmount);
        expect(receivedData.outAmount).to.equal(swapData.outAmount);
        expect(receivedData.slippage).to.equal(swapData.slippage);
    });



    it("should give us correct bytes data", async function () {
        console.log("A------");
        const myBytes = await transmissionMock.swapDataToBytes();
        console.log("myBytes: ", myBytes);
    });




    it("should convert SwapData to a string and back correctly", async function () {
        console.log("A------");
        const myString = await transmissionMock.swapDataToString();
//         var myString = await transmissionMock.callStatic.swapDataToString();
//         myString = remove0xPrefix(myString)
        console.log("myString: ", myString);
        console.log(myString)
        console.log("B------");
        const myData = await transmissionMock.stringToSwapData(myString);
        console.log("data received after conversion:")
        console.log(myData)
        console.log("C------");
        expect(myData).to.equal(swapData);
    });


    it("should convert SwapData to a string and back correctly-full", async function () {
        const receivedData = await transmissionMock.fullConversionSwap();
        expect(receivedData.transmissionType).to.equal(swapData.transmissionType);
        expect(receivedData.token).to.equal(swapData.token);
        expect(receivedData.nonce).to.equal(swapData.nonce);
        expect(receivedData.inAmount).to.equal(swapData.inAmount);
        expect(receivedData.outAmount).to.equal(swapData.outAmount);
        expect(receivedData.slippage).to.equal(swapData.slippage);
    });

});
