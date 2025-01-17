//require('dotenv').config();
const { TransmissionType } = require('./util');
const dotenvenc = require('@chainlink/env-enc');
dotenvenc.config();


const hre = require("hardhat");
const { ethers } = require('ethers');
const { expect } = require("chai");






const ethereumTransmissionLibAddress = '0x79bfCE7e219770ADf1774e6a737E505795Da5f56'
const ethereumContractAddress = '0x4146D89eCED3656e90ae30dc038258dACbeF8435'
const avalancheContractAddress = '0x041c2c594cF9232bF559530e5e0626799A6e1A23'



// these depend upon deployment address and chains used (see constants.ts)
// old
//const ethereumContractAddress = '0x707dE55f7E38eA2c61C553666a0eba7f4cC2f4d5'
//const avalancheContractAddress = '0x8c5179dfec1C590C59E6607b73cfd0891fa59Bf5'
//const ethereumTransmissionLibAddress = '0x707dE55f7E38eA2c61C553666a0eba7f4cC2f4d5'


const mountainChainSelector = ethers.BigNumber.from('16015286601757825753');
const lakeChainSelector = ethers.BigNumber.from('14767482510784806043');
const avalancheRouter = "0x554472a2720e5e7d5d3c817529aba05eed5f82d8";

const zeroAddress = "0x0000000000000000000000000000000000000000";


const ethereumProvider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_SEPOLIA_RPC_URL);
const polygonProvider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_MUMBAI_RPC_URL);
const optimismProvider = new ethers.providers.JsonRpcProvider(process.env.OPTIMISM_GOERLI_RPC_URL);
const arbitrumProvider = new ethers.providers.JsonRpcProvider(process.env.ARBITRUM_TESTNET_RPC_URL);
const avalancheProvider = new ethers.providers.JsonRpcProvider(process.env.AVALANCHE_FUJI_RPC_URL);

// Create a wallet instance
const walletEth = new ethers.Wallet(process.env.PRIVATE_KEY, ethereumProvider);
const walletAvax = new ethers.Wallet(process.env.PRIVATE_KEY, avalancheProvider);

var mountain, lake;


const swapData = {
    transmissionType: TransmissionType.SwapData,
    token: "0x0000000000000000000000000000000000000123",
    beneficiary: "0x6ADe6a2BDfBDa76C4555005eE7Dd7DcDE571D2a8",
    nonce: 123,
    inAmount: 1000,
    outAmount: 2000,
    slippage: 100
};

const liquidityStagingData = {
    transmissionType: TransmissionType.LiquidityStaging,
    token: "0x0000000000000000000000000000000000000456",
    beneficiary: "0x6ADe6a2BDfBDa76C4555005eE7Dd7DcDE571D2a8",
    nonce: ethers.BigNumber.from(456), // 456,
    inAmount: ethers.BigNumber.from(3000), // 3000,
    outAmount: ethers.BigNumber.from(6000) // 6000
};


const liquidityData = {
    transmissionType: TransmissionType.Liquidity,
    token: "0x0000000000000000000000000000000000000789",
    beneficiary: "0x6ADe6a2BDfBDa76C4555005eE7Dd7DcDE571D2a8",
    nonce: 789,
    mountain: 4000,
    lake: 5000,
    stagingLake: 2000
};

//
//async function getWalletBalance(wallet) {
//    // Fetch the balance
//    const balance = await wallet.provider.getBalance(wallet.address);
//
//    // Convert the balance from Wei to Ether
//    const balanceInEth = ethers.utils.formatEther(balance);
//
//    console.log(`Balance of wallet ${wallet.address} is ${balanceInEth} ETH`);
//}
//

async function initialSetup() {
  // Load the contract's artifacts, which includes the ABI
  const mountainContract = await hre.artifacts.readArtifact("Mountain");
  // Extract the ABI
  const mountainAbi = mountainContract.abi;
  mountain = new ethers.Contract(ethereumContractAddress, mountainAbi, walletEth);
  lake = new ethers.Contract(avalancheContractAddress, mountainAbi, walletAvax);

  const transmissionLibContract = await hre.artifacts.readArtifact("TransmissionLib");
  const transmissionLibAbi = transmissionLibContract.abi;
  transmissionLib = new ethers.Contract(ethereumTransmissionLibAddress, transmissionLibAbi, walletEth);


  // if mountainInfo not set on Lake, set it.
  const {blockchainId, contractAddress} = await lake.getMountainInfo();
  const invalidBlockchainId = 0;
  const invalidContractAddress = '0x0000000000000000000000000000000000000000';

  if (blockchainId === invalidBlockchainId || contractAddress === invalidContractAddress) {
    const tx = await lake.setMountainInfo(mountainChainSelector, mountain.address);
    await tx.wait(); // Wait for the transaction to be mined
  }
}

describe("Test Live values on Mountain Contract", function () {
  // Setup providers for different networks
    const amountToStage = 100000;

    beforeEach(async function () {
        await initialSetup();
    });

    describe("Mountain setup is correct", function () {
      it("Mountain is a mountain:", async function () {
          const terrain = await mountain.terrain();
          expect(terrain).to.equal(1);
      });

      it("Correct Router:", async function () {
          const myRouter = await mountain.getRouter();
          const expectedValue = '0xD0daae2231E9CB96b94C8512223533293C3693Bf';
          expect(myRouter).to.equal(expectedValue);
      });

      it("Correct Link Token:", async function () {
          const linkToken = await mountain.s_linkToken();
          const expectedAddress = '0x779877A7B0D9E8603169DdbD7836e478b4624789';
          expect(linkToken).to.equal(expectedAddress);
      });


      it("Correct Mountain Config:", async function () {
          const {blockchainId, contractAddress} = await mountain.getMountainInfo();
          const expectedBlockchainId = 0;
          const expectedContractAddress = '0x0000000000000000000000000000000000000000';
          expect(blockchainId).to.equal(expectedBlockchainId);
          expect(contractAddress).to.equal(expectedContractAddress);
      });

    });

    describe("Lake setup is correct", function () {
//      const amountToStage = 100000;


      it("Lake is a lake:", async function () {
          const terrain = await lake.terrain();
          expect(terrain).to.equal(0);
      });

      it("Correct Router:", async function () {
          const myRouter = await lake.getRouter();
          const expectedValue = '0x554472a2720E5E7D5D3C817529aBA05EEd5F82D8';
          expect(myRouter).to.equal(expectedValue);
      });

      it("Correct Link Token:", async function () {
          const linkToken = await lake.s_linkToken();
          const expectedAddress = '0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846';
          expect(linkToken).to.equal(expectedAddress);
      });


      it("Correct Mountain Config:", async function () {
          const {blockchainId, contractAddress} = await lake.getMountainInfo();
          const expectedBlockchainId = mountainChainSelector;
          const expectedContractAddress = mountain.address;
          expect(blockchainId).to.equal(expectedBlockchainId);
          expect(contractAddress).to.equal(expectedContractAddress);
      });
    });

    it("Stage and withdraw 'ETH' on Mountain", async function () {
          let tx = await mountain.stageLiquidity(zeroAddress,amountToStage, {value:amountToStage});
          let txReceipt = await tx.wait();

          let stagedAmount = await mountain.liquidityStaging(mountainChainSelector, zeroAddress)
          tx = await mountain.withdrawStagedLiquidity(mountainChainSelector, zeroAddress, stagedAmount);
          txReceipt = await tx.wait();

          let finalStagedAmount = await mountain.liquidityStaging(mountainChainSelector, zeroAddress)
          expect(finalStagedAmount).to.equal(0);
    }).timeout(90000);

    it("Stage and withdraw 'ETH' on Lake", async function () {
          // todo -- call router directly and get fee or create fee estimator on the contract

          const hardcodedFee = ethers.BigNumber.from('915483893615812053'); // added extra zero from previous fee
          const messageValue = hardcodedFee.add(amountToStage)
          let tx = await lake.stageLiquidity(zeroAddress,amountToStage, {value:messageValue});
          let txReceipt = await tx.wait();

          let stagedAmount = await lake.liquidityStaging(lakeChainSelector, zeroAddress);

          await expect(
            lake.withdrawStagedLiquidity(lakeChainSelector, stagedAmount)
          ).to.be.revertedWith("Withdrawal not approved or terrain type mismatch");
    });


    it("Can estimate fees", async function () {
        // Encode the SwapData into bytes
        const encodedSwapData = ethers.utils.defaultAbiCoder.encode(
            ["tuple(uint8 transmissionType, address token, address beneficiary, uint88 nonce, uint120 inAmount, uint120 outAmount, uint16 slippage)"],
            [swapData]
        );

        // Call the function
        const receiver = mountain.address;
        const destinationChainSelector = mountainChainSelector; // example chain selector
        const fee = await transmissionLib.calculateCCIPFee(
            TransmissionType.SwapData, // 0 for SwapData, adjust for other types
            encodedSwapData,
            avalancheContractAddress,
            mountainChainSelector,
            avalancheRouter
        );

        console.log("Calculated Fee:", fee.toString());
    });
});



describe("Full Bridging Live Test", function () {
  // Setup providers for different networks

    beforeEach(async function () {
        await initialSetup();
    });

      const amountToStage = 100000;

      describe("Stage ETH on Mountain", function () {
        var stagedInit;
        var tx;
        var txReceipt;

        beforeEach(async function () {
        });


        it("Expect LiquidityStaged to be emitted", async function () {
          stagedInit = await mountain.liquidityStaging(mountainChainSelector, zeroAddress) // todo -- change this back to amountToStage + fee
          tx = await mountain.stageLiquidity(zeroAddress,amountToStage, {value:amountToStage});
          txReceipt = await tx.wait();

          // Check if the transaction receipt has the expected event
          expect(txReceipt.events?.some((event) => event.event === "LiquidityStaged")).to.be.true;
          //    event LiquidityStaged(uint256 indexed blockchainId, address indexed provider, address indexed token, uint256 amount);
        }).timeout(90000);;


        it("Event values as expected", async function () {
          // Additional check for event arguments if necessary
          const event = txReceipt.events?.find((event) => event.event === "LiquidityStaged");
          expect(event?.args?.blockchainId).to.equal(mountainChainSelector, 'blockchainId incorrect');
          expect(event?.args?.provider).to.equal(walletEth.address, 'providerId incorrect');
          expect(event?.args?.token).to.equal(zeroAddress, 'token incorrect');
          expect(event?.args?.amount).to.equal(amountToStage, 'amount incorrect');
        });

        it("Expect 'LiquidityStaged' to be emitted", async function () {
          const stagedFinal = await mountain.liquidityStaging(mountainChainSelector, zeroAddress)
          expect(stagedInit.add(amountToStage)).to.equal(stagedFinal);
        });
      });

      describe("Stage 'ETH' on Lake", function () {
        var stagedInit;
        var tx;
        var txReceipt;

        beforeEach(async function () {
        });


        it("Expect LiquidityStaged to be emitted", async function () {
          const myFullBalance = await walletEth.provider.getBalance(walletEth.address);

          console.log("my full balance: ")
          console.log(myFullBalance.toString())
          const hardCodedBalance = ethers.BigNumber.from('1255294329882088');


          stagedInit = await lake.liquidityStaging(lakeChainSelector, zeroAddress)
          tx = await lake.stageLiquidity(zeroAddress,amountToStage, {value:hardCodedBalance});
          txReceipt = await tx.wait();

          // Check if the transaction receipt has the expected event
          expect(txReceipt.events?.some((event) => event.event === "LiquidityStaged")).to.be.true;
          //    event LiquidityStaged(uint256 indexed blockchainId, address indexed provider, address indexed token, uint256 amount);
        });


        it("Event values as expected", async function () {
          // Additional check for event arguments if necessary
          const event = txReceipt.events?.find((event) => event.event === "LiquidityStaged");
          expect(event?.args?.blockchainId).to.equal(lakeChainSelector, 'blockchainId incorrect');
          expect(event?.args?.provider).to.equal(walletEth.address, 'providerId incorrect');
          expect(event?.args?.token).to.equal(zeroAddress, 'token incorrect');
          expect(event?.args?.amount).to.equal(amountToStage, 'amount incorrect');
        });

        it("Expect 'LiquidityStaged' to be emitted", async function () {
          const stagedFinal = await lake.liquidityStaging(lakeChainSelector, zeroAddress)
          expect(stagedInit.add(amountToStage)).to.equal(stagedFinal);
        });
      });


      it("Staging on Mountain reflects both", async function () {
        expect(true).to.equal(true);
      });


});
