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
        nonce: ethers.BigNumber.from(456), // 456,
        inAmount: ethers.BigNumber.from(3000), // 3000,
        outAmount: ethers.BigNumber.from(6000) // 6000
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

    describe("SwapData", function () {

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
            const calculatedBytes = '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000123000000000000000000000000000000000000000000000000000000000000007b00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000007d00000000000000000000000000000000000000000000000000000000000000064'
            const myBytes = await transmissionMock.swapDataToBytes();
            expect(calculatedBytes).to.equal(myBytes)
        });


        it("should convert SwapData to a string and back correctly", async function () {
    //         const myString = await transmissionMock.swapDataToBytes();
    //         console.log(typeof myString)
    //         const myData = await transmissionMock.stringToSwapData(myString);
    //         expect(myData).to.equal(swapData);
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


        // todo -- this test isn't working and it is likely do to datatypes and conversions
        it("Correct type is assertained from string", async function () {
//             const calculatedBytes = '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000123000000000000000000000000000000000000000000000000000000000000007b00000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000007d00000000000000000000000000000000000000000000000000000000000000064'
//
//             const myBytes = await transmissionMock.swapDataToBytes();
//             const myString = await transmissionMock.swapDataToString();
//             const myType = await transmissionMock.getTypeFromString(myBytes);
//             expect(getTypeFromString).to.equal(TransmissionType.SwapData);

        });

        it("Type inferred correctly", async function () {
            const res = await transmissionMock.swapInferredCorrectly();
            expect(res).to.equal(true);
        });

        it("All types inferred correctly", async function () {
            const res = await transmissionMock.allTypesInferredCorrectly();
            expect(res).to.equal(true);
        });


    });

    describe("LiquidityStaging", function () {
        // Tests for LiquidityStaging
        it("should set LiquidityStaging data correctly", async function () {
            const receivedData = await transmissionMock.liquidityStaging();
            expect(receivedData.transmissionType).to.equal(liquidityStagingData.transmissionType);
            expect(receivedData.token).to.equal(liquidityStagingData.token);
            expect(receivedData.nonce).to.equal(liquidityStagingData.nonce);
            expect(receivedData.inAmount).to.equal(liquidityStagingData.inAmount);
            expect(receivedData.outAmount).to.equal(liquidityStagingData.outAmount);
        });

        it("should give us correct bytes data", async function () {
            const calculatedBytes = '0x0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000078900000000000000000000000000000000000000000000000000000000000003150000000000000000000000000000000000000000000000000000000000000fa0000000000000000000000000000000000000000000000000000000000000138800000000000000000000000000000000000000000000000000000000000007d0'
            const myBytes = await transmissionMock.liquidityToBytes();
            expect(calculatedBytes).to.equal(myBytes)
        });

        it("should convert LiquidityStaging data to a string and back correctly", async function () {
            const receivedData = await transmissionMock.fullConversionLiquidityStaging();

            expect(receivedData.transmissionType).to.equal(liquidityStagingData.transmissionType);
            expect(receivedData.token).to.equal(liquidityStagingData.token);
            expect(receivedData.nonce.toString()).to.equal(liquidityStagingData.nonce.toString());
            expect(receivedData.inAmount.toString()).to.equal(liquidityStagingData.inAmount.toString());
            expect(receivedData.outAmount.toString()).to.equal(liquidityStagingData.outAmount.toString());

        });

        it("Type inferred correctly", async function () {
            const res = await transmissionMock.liquidityStagingInferredCorrectly();
            expect(res).to.equal(true);
        });
    });

    describe("Liquidity", function () {
        // Tests for Liquidity
        it("should set Liquidity data correctly", async function () {
            const receivedData = await transmissionMock.liquidity();
            expect(receivedData.transmissionType).to.equal(liquidityData.transmissionType);
            expect(receivedData.token).to.equal(liquidityData.token);
            expect(receivedData.nonce).to.equal(liquidityData.nonce);
            expect(receivedData.mountain).to.equal(liquidityData.mountain);
            expect(receivedData.lake).to.equal(liquidityData.lake);
            expect(receivedData.stagingLake).to.equal(liquidityData.stagingLake);
        });

        it("should give us correct bytes data", async function () {
            const calculatedBytes = '0x0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000045600000000000000000000000000000000000000000000000000000000000001c80000000000000000000000000000000000000000000000000000000000000bb80000000000000000000000000000000000000000000000000000000000001770'
            const myBytes = await transmissionMock.liquidityStagingToBytes();
            expect(calculatedBytes).to.equal(myBytes)
        });

        it("should convert Liquidity data to a string and back correctly", async function () {
            const receivedData = await transmissionMock.fullConversionLiquidity();

            expect(receivedData.transmissionType).to.equal(liquidityData.transmissionType);
            expect(receivedData.token).to.equal(liquidityData.token);
            expect(receivedData.nonce).to.equal(liquidityData.nonce);
            expect(receivedData.mountain).to.equal(liquidityData.mountain);
            expect(receivedData.lake).to.equal(liquidityData.lake);
            expect(receivedData.stagingLake).to.equal(liquidityData.stagingLake);
        });

        it("Type inferred correctly", async function () {
            const res = await transmissionMock.liquidityInferredCorrectly();
            expect(res).to.equal(true);
        });

    });


});
