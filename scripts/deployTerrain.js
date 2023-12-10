const hre = require("hardhat");
// npx hardhat run scripts/deployDataMock.js

const destinationChainSelector = '14767482510784806043';

const useExistingDeployment = true;
const terrainContractAddress = '0x7B7c7f6620aAe7cec2008D6E1Bc9FF5b51f63Ce4'

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

//    const transmissionLibContract = await hre.artifacts.readArtifact("TransmissionLib");
//    const transmissionLibAbi = transmissionLibContract.abi;
//    transmissionLib = new ethers.Contract(ethereumTransmissionLibAddress, transmissionLibAbi, walletEth);

      const transmissionLibFactory = await ethers.getContractFactory("TransmissionLib");
      const transmissionLib = await transmissionLibFactory.deploy();
      await transmissionLib.deployed();

//    // Deploying the contract
    const Terrain = await hre.ethers.getContractFactory("Terrain");

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


    /// tests

//    // Calling getData() and printing the result
//    const data = await terrain.getData();
//    console.log("Data received from getData():", data);

//    // Calling getData() and printing the result
    const mySwapData = await terrain.mySwapData();
//    console.log("mySwapData received from mySwapData():", mySwapData);


    // Calling getData() and printing the result
//    const dataString = await terrain.getText();
//    console.log("dataString received from getData():", dataString);

    let bytesString = await terrain.getBytes();
    // temp -- hardcode bytes
    bytesString = '0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002877797fd92d2243491a524f777ee8777a05f950000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000004';
    console.log("bytesString received from getData():", bytesString);

    // Calling getData() and printing the result
    const fee = await terrain.getFee(destinationChainSelector, receiver, bytesString);
    console.log("Fee received from getData():", fee);

    // Calling getData() and printing the result
    const tx = await terrain.sendMessagePayNative(destinationChainSelector, receiver, bytesString, {value: fee});
    const res = await tx.wait();

    console.log('receipt: ');
    console.log(res)

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
