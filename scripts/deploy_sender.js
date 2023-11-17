//require('dotenv').config();
const hre = require("hardhat");
const { Wallet } = require('ethers');
const fs = require('fs');
const path = require('path');

const { verifyContract, getRouterConfig, sleep } = require('../tasks/utils');
const { LINK_ADDRESSES } = require('../tasks/constants');
const { BasicMessageSender, BasicMessageSender__factory } = "../typechain-types";

const USE_LAST_DEPLOYMENT = false; // Toggle this variable to control behavior
//const deployedAddresses = require('./deployedAddresses.json');
const NUM_CONFIRMATIONS_NEEDED = 0;



function getDeployedAddresses() {
    try {
        return require('./deployedAddresses.json');
    } catch (error) {
        if (error.code === 'MODULE_NOT_FOUND') {
            return {};  // Return an empty object if the file doesn't exist
        }
        throw error;  // Rethrow if it's some other error
    }
}

const deployedAddresses = getDeployedAddresses();


const advanceTime = async (seconds) => {
    await network.provider.send("evm_increaseTime", [seconds])
    await ethers.provider.send("evm_mine");
};



async function saveContractAddresses(contracts) {
    // Detect the network
    const networkName = hre.network.name;

    // Path to your deployed contracts JSON file
    const filePath = path.join(__dirname, 'deployedAddresses.json');

    // Read existing data
    let data;
    try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
        data = {};
    }

    // Ensure there's an object for our network
    if (!data[networkName]) {
        data[networkName] = {};
    }

    // Update the data for the current network
    data[networkName] = {
        ...data[networkName],
        basicMessageSender: contracts.basicMessageSender,
        basicTokenSender: contracts.basicTokenSender,
        basicMessageReceiver: contracts.basicMessageReceiver,
    };

    // Write the updated data back to the file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}


async function deploy_new() {
    //  const [deployer, secondary] = await ethers.getSigners();

    const networkName = hre.network.name;
    const routerAddress = getRouterConfig(hre.network.name).address;
    const linkAddress = LINK_ADDRESSES[hre.network.name]

    // Deploying the basicMessageSender Library
    const BasicMessageSender = await ethers.getContractFactory("BasicMessageSender");
    const basicMessageSender = await BasicMessageSender.deploy(routerAddress, linkAddress);
    await basicMessageSender.deployed();
    console.log("BasicMessageSender deployed to:", basicMessageSender.address);
    await basicMessageSender.deployTransaction.wait(NUM_CONFIRMATIONS_NEEDED);

    // Deploying the basicMessageReceiver Library
    const BasicMessageReceiver = await ethers.getContractFactory("BasicMessageReceiver");
    const basicMessageReceiver = await BasicMessageReceiver.deploy(routerAddress, linkAddress);
    await basicMessageReceiver.deployed();
    console.log("BasicMessageReceiver deployed to:", basicMessageReceiver.address);
    await basicMessageReceiver.deployTransaction.wait(NUM_CONFIRMATIONS_NEEDED);

    // Deploying the basicTokenSender Library
    const BasicTokenSender = await ethers.getContractFactory("BasicTokenSender");
    const basicTokenSender = await BasicTokenSender.deploy(routerAddress, linkAddress);
    await basicTokenSender.deployed();
    console.log("BasicTokenSender deployed to:", basicTokenSender.address);
    await basicTokenSender.deployTransaction.wait(NUM_CONFIRMATIONS_NEEDED);


    // Save contract addresses
    const deployedContracts = {
        basicMessageSender: basicMessageSender.address,
        basicMessageReceiver: basicMessageReceiver.address,
        basicTokenSender: basicTokenSender.address
    };

//    fs.writeFileSync(path.join(__dirname, 'deployed_contracts.json'), JSON.stringify(deployedContracts, null, 2));
    await saveContractAddresses(deployedContracts);

    return { basicMessageSender, basicMessageReceiver, basicTokenSender};
}

async function get_deployed() {
    const networkName = hre.network.name;


    // Check if the current network has deployed addresses
    if (!deployedAddresses[networkName]) {
        throw new Error(`No deployed addresses found for network: ${networkName}`);
    }

    const addresses = deployedAddresses[networkName];


 basicMessageSender, basicMessageReceiver, basicTokenSender

    const BasicMessageSender = await ethers.getContractFactory("BasicMessageSender");
    const basicMessageSender = CommonDefinitions.attach(addresses.basicMessageSender);

    const BasicMessageReceiver = await ethers.getContractFactory("BasicMessageReceiver");
    const basicMessageReceiver = GeneLogic.attach(addresses.basicMessageReceiver);

    const BasicTokenSender = await ethers.getContractFactory("BasicTokenSender");
    const basicTokenSender = GeneLogic.attach(addresses.basicTokenSender);

    const contracts = {
        basicMessageSender,
        basicMessageReceiver,
        basicTokenSender
    };

    // Logging contract names and addresses
    for (let [contractName, contractInstance] of Object.entries(contracts)) {
        console.log(`${contractName}: ${contractInstance.address}`);
    }

    return contracts;}


async function main() {
    let contracts;
    const [deployer, secondary] = await ethers.getSigners();

    console.log("deployer: ")
    console.log(deployer.address)

    if (USE_LAST_DEPLOYMENT) {
        contracts = await get_deployed();
    } else {
        contracts = await deploy_new();
    }

    const { basicMessageSender, basicMessageReceiver, basicTokenSender} = contracts;

    console.log("contracts deployed");
    await sleep(5000);

    console.log("contracts:")
    console.log(basicMessageSender.address)

    await verifyContract(basicMessageSender.address, "contracts/BasicMessageSender.sol:BasicMessageSender", [routerAddress, linkAddress]);




//    wizards.connect(deployer).setReputationSmartContract(reputation.address);

    console.log("Finished")

}











main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
