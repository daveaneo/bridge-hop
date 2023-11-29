import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getPrivateKey, getProviderRpcUrl, getRouterConfig, sleep, verifyContract } from "./utils";
import { Wallet, providers } from "ethers";
import { ProgrammableTokenTransfers, Mountain__factory } from "../typechain-types";
import { Spinner } from "../utils/spinner";
import { LINK_ADDRESSES, routerConfig } from "./constants";

task(`deploy-mountain`, `Deploys Mountain contracts on...`)
    .addOptionalParam(`router`, `The address of the Router contract`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const routerAddress = taskArguments.router ? taskArguments.router : getRouterConfig(hre.network.name).address;

        var networkName = hre.network.name; // "ethereumSepolia";
        const privateKey = getPrivateKey();
        const rpcProviderUrl = getProviderRpcUrl(networkName);
        const provider = new providers.JsonRpcProvider(rpcProviderUrl);
        const wallet = new Wallet(privateKey);
        const deployer = wallet.connect(provider);
        var myNetworkChainlinkId = routerConfig[networkName].chainSelector;
        var linkAddress = taskArguments.link ? taskArguments.link : LINK_ADDRESSES[hre.network.name]
        const spinner: Spinner = new Spinner();

        console.log('myNetworkChainlinkId: ', myNetworkChainlinkId);


        // Deploy the library
        console.log(`ℹ️  Attempting to deploy transmissionLib on ${networkName} blockchain using ${deployer.address} address`);

        const transmissionLibFactory = await hre.ethers.getContractFactory("TransmissionLib");
        const transmissionLib = await transmissionLibFactory.deploy();
        await transmissionLib.deployed();
        console.log("TransmissionLib deployed to:", transmissionLib.address);


        console.log(`ℹ️  Attempting to deploy Mountain on ${networkName} blockchain using ${deployer.address} address, with the Router address ${routerAddress} provided as constructor argument`);
        spinner.start();


        // Deploy the Mountain contract with the library linked
        const mountainFactory = await hre.ethers.getContractFactory('Mountain', {
            libraries: {
                TransmissionLib: transmissionLib.address,
            },
        });
        const mountain = await mountainFactory.deploy(routerAddress, linkAddress, 1, myNetworkChainlinkId);
        await mountain.deployed();

        spinner.stop();
        console.log(`✅ ProgrammableTokenTransfers deployed at address ${mountain.address} on ${hre.network.name} blockchain`)

        console.log(`Waiting for transaction confirmations...`);
        await sleep(60 * 1000)
        await mountain.deployTransaction.wait(); // Wait for transaction to be mined

        const verRes = await verifyContract(mountain.address, "contracts/Mountain.sol:Mountain", [routerAddress, linkAddress, 1, myNetworkChainlinkId]);

        if(!verRes){
            console.log("Verified!");
        }
        else {
            console.log("verification failed.");
        }

    });