const hre = require("hardhat");
// npx hardhat run scripts/deployDataMock.js

const destinationChainSelector = '16015286601757825753';
const useExistingDeployment = false;

const terrainContractAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'



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

    // Deploy the Mountain contract with the library linked
//    const Terrain  = await hre.ethers.getContractFactory('dataMock', {
//        libraries: {
//            TransmissionLib: transmissionLib.address,
//        },
//    });
////
//    const dataMock = await Terrain.deploy(receiver, text, tokenAddress, router);
//
//    await dataMock.deployed();
//    console.log("dataMock deployed to:", dataMock.address);

    let dataMock;
    if (useExistingDeployment) {
        // Connect to the existing contract
        terrain = Terrain.attach(terrainContractAddress);
        console.log("terrain attached to existing address:", terrain.address);
    } else {
        // Deploy a new contract
        terrain = await Terrain.deploy(receiver, text, tokenAddress, router);
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

    const bytesString = await terrain.getBytes();
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
