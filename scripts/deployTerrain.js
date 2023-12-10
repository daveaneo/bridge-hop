const hre = require("hardhat");
// npx hardhat run scripts/deployDataMock.js
const { TransmissionType } = require('../tasks/utils');

const destinationChainSelector = '14767482510784806043';
const mountainChainSelector = '14767482510784806043';

const useExistingDeployment = false;
const terrainContractAddress = '0x5e11d25F04413B8a3B4De70C1ad2801978996c99'

// CCIP Details
const sepoliaChainlinkId = '16015286601757825753'
const sepoliaLinkAddress = '0x097D90c9d3E0B50Ca60e1ae45F6A81010f9FB534';
const sepoliaRouterAddress = '0xd0daae2231e9cb96b94c8512223533293c3693bf'

const avalancheChainlinkId = '14767482510784806043';
const avalancheLinkAddress = '0xd00ae08403B9bbb9124bB305C09058E32C39A48c';
const avalancheRouterAddress = '0x554472a2720E5E7D5D3C817529aBA05EEd5F82D8';


async function main() {
    // Arguments for deployment
    const receiver = "0x6ADe6a2BDfBDa76C4555005eE7Dd7DcDE571D2a8"; // Replace with the receiver's address
    const text = "helloWorld"; // Replace with your text message
    const tokenAddress = "0x0000000000000000000000000000000000000000"; // Replace with token address or '0x0000000000000000000000000000000000000000' for native gas
    const router = '0x554472a2720e5e7d5d3c817529aba05eed5f82d8';
    const amountToStage = '10000';

//    const transmissionLibContract = await hre.artifacts.readArtifact("TransmissionLib");
//    const transmissionLibAbi = transmissionLibContract.abi;
//    transmissionLib = new ethers.Contract(ethereumTransmissionLibAddress, transmissionLibAbi, walletEth);

      const transmissionLibFactory = await ethers.getContractFactory("TransmissionLib");
      const transmissionLib = await transmissionLibFactory.deploy();
      await transmissionLib.deployed();

//    // Deploying the contract
//    const Terrain = await hre.ethers.getContractFactory("Terrain");
    const Terrain = await hre.ethers.getContractFactory("Terrain", {
        libraries: {
            TransmissionLib: transmissionLib.address,
        },
    });




    let terrain;
    if (useExistingDeployment) {
        // Connect to the existing contract
        terrain = Terrain.attach(terrainContractAddress);
        console.log("terrain attached to existing address:", terrain.address);
    } else {
        // Deploy a new contract
        terrain = await Terrain.deploy(sepoliaRouterAddress, sepoliaLinkAddress, 0, sepoliaChainlinkId);
        await terrain.deployed();
        console.log("terrain deployed to:", terrain.address);
    }

    // if mountainInfo not set on Lake, set it.
    const {blockchainId, contractAddress} = await terrain.mountainInfo();
    const invalidBlockchainId = 0;
    const invalidContractAddress = '0x0000000000000000000000000000000000000000';
    if (blockchainId === invalidBlockchainId || contractAddress === invalidContractAddress) {
        const tx = await terrain.setMountainInfo(mountainChainSelector, terrain.address); // this is just more of a test as it shouldn't send it here
        await tx.wait(); // Wait for the transaction to be mined
    }


    /// tests


    let bytesString;
    bytesString = await transmissionLib.getBytesGivenTransmissionTypeNumber(1);

    let fee;
    fee = await terrain.getFee(destinationChainSelector, receiver, bytesString);
    console.log("Fee received from getData():", fee);


    let tx, res;

    const payment = fee.add(amountToStage);
    tx = await terrain.stageLiquidity(tokenAddress, amountToStage, {value: payment});
    res = await tx.wait();

    console.log("Result of sendMessagePayNative:")
    if(res){
      console.log("Success!");
    } else {
      console.log("FAIL!");
    }

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
