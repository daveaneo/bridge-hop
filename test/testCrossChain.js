//require('dotenv').config();
const dotenvenc = require('@chainlink/env-enc');
dotenvenc.config();

const hre = require("hardhat");
const { ethers } = require('ethers');
const { expect } = require("chai");

const ethereumContractAddress = '0x707dE55f7E38eA2c61C553666a0eba7f4cC2f4d5'
const avalancheContractAddress = '0x8c5179dfec1C590C59E6607b73cfd0891fa59Bf5'
const mountainBlockchainInfo = 16015286601757825753;


//async function main() {
describe("Mountain Contract", function () {
  // Setup providers for different networks
  const ethereumProvider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_SEPOLIA_RPC_URL);
  const polygonProvider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_MUMBAI_RPC_URL);
  const optimismProvider = new ethers.providers.JsonRpcProvider(process.env.OPTIMISM_GOERLI_RPC_URL);
  const arbitrumProvider = new ethers.providers.JsonRpcProvider(process.env.ARBITRUM_TESTNET_RPC_URL);
  const avalancheProvider = new ethers.providers.JsonRpcProvider(process.env.AVALANCHE_FUJI_RPC_URL);

  var mountain, lake;

  // Create a wallet instance
  const walletEth = new ethers.Wallet(process.env.PRIVATE_KEY, ethereumProvider);
  const walletAvax = new ethers.Wallet(process.env.PRIVATE_KEY, avalancheProvider);

    beforeEach(async function () {
        // Load the contract's artifacts, which includes the ABI
        const mountainContract = await hre.artifacts.readArtifact("Mountain");
        // Extract the ABI
        const mountainAbi = mountainContract.abi;
        mountain = new ethers.Contract(ethereumContractAddress, mountainAbi, walletEth);
        lake = new ethers.Contract(avalancheContractAddress, mountainAbi, walletAvax);

        // if mountainInfo not set on Lake, set it.
        const {blockchainId, contractAddress} = await lake.getMountainInfo();
        const invalidBlockchainId = 0;
        const invalidContractAddress = '0x0000000000000000000000000000000000000000';

        if (blockchainId==invalidBlockchainId || contractAddress == invalidContractAddress){
          const tx = await lake.setMountainInfo(mountainBlockchainInfo, mountain.address);
        }


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
          const expectedBlockchainId = '1192346811958337004712393628105636338708327601087';
          const expectedContractAddress = '0x707dE55f7E38eA2c61C553666a0eba7f4cC2f4d5';
          expect(blockchainId).to.equal(expectedBlockchainId);
          expect(contractAddress).to.equal(expectedContractAddress);
      });

    });


    describe("Bridging Works", function () {

      it("Stage Eth on mountain", async function () {
        expect(true).to.equal(true);
      });
    });

});
//
//main().catch(error => {
//  console.error(error);
//  process.exit(1);
//});
