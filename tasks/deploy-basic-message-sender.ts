import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getPrivateKey, getProviderRpcUrl, getRouterConfig, verifyContract, sleep } from "./utils";
import { Wallet, providers } from "ethers";
import { Spinner } from "../utils/spinner";
import { LINK_ADDRESSES } from "./constants";
import { BasicMessageSender, BasicMessageSender__factory } from "../typechain-types";
//
// task(`deploy-basic-message-sender`, `Deploys the BasicMessageSender smart contract`)
//     .addOptionalParam(`router`, `The address of the Router contract`)
//     .addOptionalParam(`link`, `The address of the LINK token`)
//     .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
//         console.log("A0-------");
//         const routerAddress = taskArguments.router ? taskArguments.router : getRouterConfig(hre.network.name).address;
//         console.log("A1-------");
//         const linkAddress = taskArguments.link ? taskArguments.link : LINK_ADDRESSES[hre.network.name]
//         console.log("A2-------");
//
//         const privateKey = getPrivateKey();
//         const rpcProviderUrl = getProviderRpcUrl(hre.network.name);
//
//
//         console.log("HELLO")
//         const provider = new providers.JsonRpcProvider(rpcProviderUrl);
//         const wallet = new Wallet(privateKey);
//         const deployer = wallet.connect(provider);
//
//         const spinner: Spinner = new Spinner();
//         console.log("B-------");
//
//         console.log(`ℹ️  Attempting to deploy BasicMessageSender on the ${hre.network.name} blockchain using ${deployer.address} address, with the Router address ${routerAddress} and LINK address ${linkAddress} provided as constructor arguments`);
//         spinner.start();
//
//         console.log("B1")
//         const basicMessageSenderFactory: BasicMessageSender__factory = await hre.ethers.getContractFactory('BasicMessageSender') as BasicMessageSender__factory;
//         console.log("B2")
//         const basicMessageSender: BasicMessageSender = await basicMessageSenderFactory.deploy(routerAddress, linkAddress);
//         console.log("B3")
//         const tx = await basicMessageSender.deployed();
//
//         spinner.stop();
//         console.log(`✅ BasicMessageSender deployed at address ${basicMessageSender.address} on ${hre.network.name} blockchain`)
//
//         console.log("verifing...")
//         spinner.start();
//
//
//         // Now wait for additional confirmations
//         console.log(`Waiting for ${10} confirmations...`);
//         const receipt = await tx.wait(10); // Wait for 10 confirmations
//         console.log(`Transaction confirmed with ${receipt.confirmations} confirmations`);
//
//         await verifyContract(basicMessageSender.address, "contracts/BasicMessageSender.sol:BasicMessageSender", [routerAddress, linkAddress]);
//         spinner.stop();
//         console.log("Verified.")
// });

task(`deploy-basic-message-sender`, `Deploys the BasicMessageSender smart contract`)
    .addOptionalParam(`router`, `The address of the Router contract`)
    .addOptionalParam(`link`, `The address of the LINK token`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        console.log("A0-------");
        const routerAddress = taskArguments.router ? taskArguments.router : getRouterConfig(hre.network.name).address;
        console.log("A1-------");
        const linkAddress = taskArguments.link ? taskArguments.link : LINK_ADDRESSES[hre.network.name]
        console.log("A2-------");

        const privateKey = getPrivateKey();
        const rpcProviderUrl = getProviderRpcUrl(hre.network.name);

        console.log("HELLO")
        const provider = new providers.JsonRpcProvider(rpcProviderUrl);
        const wallet = new Wallet(privateKey);
        const deployer = wallet.connect(provider);

        const spinner: Spinner = new Spinner();
        console.log(`ℹ️  Attempting to deploy BasicMessageSender on the ${hre.network.name} blockchain using ${deployer.address} address, with the Router address ${routerAddress} and LINK address ${linkAddress} provided as constructor arguments`);
        spinner.start();

        const basicMessageSenderFactory = await hre.ethers.getContractFactory('BasicMessageSender', deployer) as BasicMessageSender__factory;
        const basicMessageSenderDeployTransaction = await basicMessageSenderFactory.deploy(routerAddress, linkAddress);

        // Wait for the deployment transaction to be mined
        const basicMessageSender = BasicMessageSender__factory.connect(basicMessageSenderDeployTransaction.address, provider);

        spinner.stop();
        console.log(`✅ BasicMessageSender deployed at address ${basicMessageSender.address} on ${hre.network.name} blockchain`)

//         await basicMessageSenderDeployTransaction.wait(10); // Wait for 10 confirmations
        spinner.start();
        console.log(`Waiting for transaction confirmations...`);
        await basicMessageSenderDeployTransaction.deployTransaction.wait(1); // Wait for transaction to be mined

        const verRes = await verifyContract(basicMessageSender.address, "contracts/BasicMessageSender.sol:BasicMessageSender", [routerAddress, linkAddress]);

        if(!verRes){
            console.log("Verified!");
        }
        else {
            console.log("verification failed.");
        }
        spinner.stop();
    });
