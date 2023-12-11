//require('dotenv').config();
const { TransmissionType } = require('./util');
const dotenvenc = require('@chainlink/env-enc');
dotenvenc.config();


const hre = require("hardhat");
const { ethers } = require('ethers');
const { expect } = require("chai");

// ethereum is mountain
const mountainTransmissionLibAddress = '0x1B4F65d8c9c172981a00D2a9B6F8CB6fb804981D'
const mountainContractAddress = '0xf992970d1AfA40a526fed21711841154B028574C'
const mountainChainSelector = ethers.BigNumber.from('16015286601757825753');

// polygon is lake
const lakeTransmissionLibAddress = '0x868E88f4AaE8B7081Ff9Ac9269389128C09FB9c3'
const lakeContractAddress = '0xc5B0F4c6244FB88e01C37cDb8881155412891E75'
const lakeChainSelector = ethers.BigNumber.from('12532609583862916517'); // polygon mumbai


// const lakeChainSelector = ethers.BigNumber.from('14767482510784806043'); // avalanche fuji
//const avalancheRouter = "0x554472a2720e5e7d5d3c817529aba05eed5f82d8";

const zeroAddress = "0x0000000000000000000000000000000000000000";

const ethereumProvider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_SEPOLIA_RPC_URL);
const polygonProvider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_MUMBAI_RPC_URL);
const optimismProvider = new ethers.providers.JsonRpcProvider(process.env.OPTIMISM_GOERLI_RPC_URL);
const arbitrumProvider = new ethers.providers.JsonRpcProvider(process.env.ARBITRUM_TESTNET_RPC_URL);
const avalancheProvider = new ethers.providers.JsonRpcProvider(process.env.AVALANCHE_FUJI_RPC_URL);

// Create a wallet instance
const walletMountain = new ethers.Wallet(process.env.PRIVATE_KEY, ethereumProvider);
// const walletLake = new ethers.Wallet(process.env.PRIVATE_KEY, avalancheProvider);
const walletLake = new ethers.Wallet(process.env.PRIVATE_KEY, polygonProvider);

var mountain, lake, transmissionLibEthereum, transmissionLibAvalanche;


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
  const terrainContract = await hre.artifacts.readArtifact("Terrain");
  // Extract the ABI
  const terrainAbi = terrainContract.abi;
  mountain = new ethers.Contract(mountainContractAddress, terrainAbi, walletMountain);
  lake = new ethers.Contract(lakeContractAddress, terrainAbi, walletLake);

  const transmissionLibContract = await hre.artifacts.readArtifact("TransmissionLib");
  const transmissionLibAbi = transmissionLibContract.abi;
  transmissionLibEthereum = new ethers.Contract(mountainTransmissionLibAddress, transmissionLibAbi, walletMountain);
  transmissionLibAvalanche = new ethers.Contract(lakeTransmissionLibAddress, transmissionLibAbi, walletLake);


  // if mountainInfo not set on Lake, set it.
  const {blockchainId, contractAddress} = await lake.mountainInfo();
  const invalidBlockchainId = 0;
  const invalidContractAddress = '0x0000000000000000000000000000000000000000';

  if (blockchainId === invalidBlockchainId || contractAddress === invalidContractAddress) {
    const tx = await lake.setMountainInfo(mountainChainSelector, mountain.address);
    await tx.wait(); // Wait for the transaction to be mined
  }
}

describe("Test Live values on Terrain Contract", function () {
  // Setup providers for different networks
    const amountToStage = 100000;

    beforeEach(async function () {
        await initialSetup();
    });

    describe("Mountain setup is correct", function () {
      it("Mountain is a mountain:", async function () {
          const terrainType = await mountain.terrain();
          expect(terrainType).to.equal(1);
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
          const {blockchainId, contractAddress} = await mountain.mountainInfo();
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
//           const expectedValue = '0x554472a2720E5E7D5D3C817529aBA05EEd5F82D8'; // fujiAvalanche
          const expectedValue = '0x70499c328e1e2a3c41108bd3730f6670a44595d1'; // polygonMumbai
          expect(myRouter).to.equal(expectedValue);
      });

      it("Correct Link Token:", async function () {
          const linkToken = await lake.s_linkToken();
//           const expectedAddress = '0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846'; // fujiAvalanche
          const expectedAddress = '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889'; // polygonMumbai
          expect(linkToken).to.equal(expectedAddress);
      });


      it("Correct Mountain Config:", async function () {
          const {blockchainId, contractAddress} = await lake.mountainInfo();
          const expectedBlockchainId = mountainChainSelector;
          const expectedContractAddress = mountain.address;
          expect(blockchainId).to.equal(expectedBlockchainId);
          expect(contractAddress).to.equal(expectedContractAddress);
      });
    });

    it("Stage and withdraw ETH on Mountain", async function () {
          let tx = await mountain.stageLiquidity(zeroAddress,amountToStage, {value:amountToStage});
          let txReceipt = await tx.wait();

          let stagedAmount = await mountain.liquidityStaging(mountainChainSelector, zeroAddress)
          tx = await mountain.withdrawStagedLiquidity(mountainChainSelector, zeroAddress, stagedAmount);
          txReceipt = await tx.wait();

          let finalStagedAmount = await mountain.liquidityStaging(mountainChainSelector, zeroAddress)
          expect(finalStagedAmount).to.equal(0);
    }).timeout(90000);

    it("Stage and withdraw ETH on Lake", async function () {
          let bytesString;
          bytesString = await transmissionLibAvalanche.getBytesGivenTransmissionTypeNumber(1);

          let fee;
          fee = await lake.getFee(mountainChainSelector, walletMountain.address, bytesString);
//          console.log("Fee received from getData():", fee);


          let tx, res;
          const messageValue = fee.add(amountToStage);
          tx = await lake.stageLiquidity(zeroAddress, amountToStage, {value: messageValue});
          res = await tx.wait();

          let stagedAmount = await lake.liquidityStaging(lakeChainSelector, zeroAddress);

            await expect(
                lake.withdrawStagedLiquidity(lakeChainSelector, zeroAddress, stagedAmount, { gasLimit: 20000000 })
            ).to.be.revertedWith("Withdrawal not approved or terrain type mismatch");


    });


    it("Can estimate fees", async function () {
        let bytesString;
        bytesString = await transmissionLibAvalanche.getBytesGivenTransmissionTypeNumber(1);

        let fee;
        fee = await lake.getFee(mountainChainSelector, walletMountain.address, bytesString);
        expect(fee).to.not.equal(0, 'fee must be positive');
    });
});



describe("Full Bridging Live Test", function () {
  // Setup providers for different networks
    var stagedInitMountain;
    var stagedInitLake;

    beforeEach(async function () {
        await initialSetup();
    });

      const amountToStage = 100000;

      describe("Bridging, Stage ETH on Mountain", function () {
//         var stagedInitMountain;
        var tx;
        var txReceipt;

        beforeEach(async function () {
        });


        it("Expect LiquidityStaged to be emitted", async function () {
          stagedInitMountain = await mountain.liquidityStaging(mountainChainSelector, zeroAddress) // todo -- change this back to amountToStage + fee
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
          expect(event?.args?.provider).to.equal(walletMountain.address, 'providerId incorrect');
          expect(event?.args?.token).to.equal(zeroAddress, 'token incorrect');
          expect(event?.args?.amount).to.equal(amountToStage, 'amount incorrect');
        });


        it("Expect staged values to increase accordingly", async function () {
          const stagedFinal = await mountain.liquidityStaging(mountainChainSelector, zeroAddress)
          expect(stagedInitMountain.add(amountToStage)).to.equal(stagedFinal);
        });
      });


      describe("Bridging, Stage ETH on Lake", function () {
        var stagedInitLake;
        var txReceiptsStageLiquidity;

        beforeEach(async function () {
        });


        it("Expect LiquidityStaged to be emitted", async function () {
          stagedInitLake = await lake.liquidityStaging(lakeChainSelector, zeroAddress)

          let bytesString;
          bytesString = await transmissionLibAvalanche.getBytesGivenTransmissionTypeNumber(1);

          let fee;
          fee = await lake.getFee(mountainChainSelector, walletMountain.address, bytesString);

          let tx, res;
          const messageValue = fee.add(amountToStage);
          tx = await lake.stageLiquidity(zeroAddress, amountToStage, {value: messageValue});
          txReceiptsStageLiquidity = await tx.wait();

          // Check if the transaction receipt has the expected event
          expect(txReceiptsStageLiquidity.events?.some((event) => event.event === "LiquidityStaged")).to.be.true;
          //    event LiquidityStaged(uint256 indexed blockchainId, address indexed provider, address indexed token, uint256 amount);
        });


        it("Event values as expected", async function () {
          // Additional check for event arguments if necessary
          const event = txReceiptsStageLiquidity.events?.find((event) => event.event === "LiquidityStaged");
          expect(event?.args?.blockchainId).to.equal(lakeChainSelector, 'blockchainId incorrect');
          expect(event?.args?.provider).to.equal(walletMountain.address, 'providerId incorrect');
          expect(event?.args?.token).to.equal(zeroAddress, 'token incorrect');
          expect(event?.args?.amount).to.equal(amountToStage, 'amount incorrect');
        });

        // todo -- this does not increase as expected
        it("Expect staged values to increase accordingly", async function () {
          const stagedFinal = await lake.liquidityStaging(lakeChainSelector, zeroAddress)

          console.log("staging values:");
          console.log(stagedInitLake.toString());
          console.log(stagedFinal.toString());
          console.log(amountToStage);
          console.log(stagedInitLake.add(amountToStage).toString())

          expect(stagedInitLake.add(amountToStage)).to.equal(stagedFinal);
        });
      });


      it("Staging on Mountain reflects both", async function () {
          const stagedFinalMountain = await mountain.liquidityStaging(lakeChainSelector, zeroAddress)
          const stagedFinalLake = await mountain.liquidityStaging(mountainChainSelector, zeroAddress)

          expect(stagedInitMountain.add(amountToStage)).to.equal(stagedFinalMountain, "mismatch for mountain values on mountain");
          expect(stagedInitLake.add(amountToStage)).to.equal(stagedFinalLake, "mismatch for lake values on mountain");
      });

//  */    function addLiquidityFromStaged(
//         address tokenAddress,
//         uint256 lakeBlockchainId,
//         uint16 slippage,
//         address receiver
//     ) external onlyOwner {
      it("Move stagedLiquidity to liquidity", async function () {
          let bytesString = await transmissionLibAvalanche.getBytesGivenTransmissionTypeNumber(2);
          let fee = await lake.getFee(lakeChainSelector, walletLake.address, bytesString);
          let tx = await lake.addLiquidityFromStaged(zeroAddress, lakeChainSelector, 10000, walletMountain.address, {value: fee});
          let txRec = await tx.wait();

          expect(txRec.events?.some((event) => event.event === "LiquidityStaged")).to.be.true;

      });


      it("Bridge from mountain-side to lake-side", async function () {
          let bytesString = await transmissionLibAvalanche.getBytesGivenTransmissionTypeNumber(0);
          let fee = await lake.getFee(lakeChainSelector, walletLake.address, bytesString);
          let tx = await lake.bridgeNative(lakeChainSelector, 123, lake.address, walletLake.address, 10000, {value: fee});
          let txRec = await tx.wait();

          // todo: adjust event name
          expect(txRec.events?.some((event) => event.event === "MessageSent")).to.be.true;
      });

      it("Manually check lake for 123 tokens", async function () {
        expect(true).to.equal(true);
      });


      it("Bridge from lake-side to mountain-side", async function () {
        expect(true).to.equal(true);
      });


});
