import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getPrivateKey, getProviderRpcUrl, getRouterConfig, sleep, verifyContract } from "./utils";
import { Wallet, providers } from "ethers";
import { ProgrammableTokenTransfers, Terrain__factory } from "../typechain-types";
import { Spinner } from "../utils/spinner";
import { LINK_ADDRESSES, routerConfig } from "./constants";

task(`deploy-terrain`, `Deploys Terrain contracts on...`)
    .addOptionalParam(`router`, `The address of the Router contract`)
//     .addFlag("m", "Deploy as a mountain")
    .addOptionalParam("terrain", "Specify terrain type: lake (0) or mountain (1)", "0")
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        const routerAddress = taskArguments.router ? taskArguments.router : getRouterConfig(hre.network.name).address;

        var networkName = hre.network.name; // "ethereumSepolia";
        const privateKey = getPrivateKey();
        const rpcProviderUrl = getProviderRpcUrl(networkName);
        const provider = new providers.JsonRpcProvider(rpcProviderUrl);
        const wallet = new Wallet(privateKey);
        const deployer = wallet.connect(provider);
        var myNetworkChainlinkId = routerConfig[networkName].chainSelector;
        var linkAddress = taskArguments.link ? taskArguments.link : LINK_ADDRESSES[hre.network.name];
        var terrainType = taskArguments.terrain == "1" ? 1 : 0;

        const spinner: Spinner = new Spinner();

        console.log("terrainType: ", terrainType);

        console.log('myNetworkChainlinkId: ', myNetworkChainlinkId);


        // Deploy the library
        console.log(`ℹ️  Attempting to deploy transmissionLib on ${networkName} blockchain using ${deployer.address} address`);

        const transmissionLibFactory = await hre.ethers.getContractFactory("TransmissionLib");
        const transmissionLib = await transmissionLibFactory.deploy();
        await transmissionLib.deployed();
        console.log("TransmissionLib deployed to:", transmissionLib.address);


        console.log(`ℹ️  Attempting to deploy Terrain on ${networkName} blockchain using ${deployer.address} address, with the Router address ${routerAddress} provided as constructor argument`);
        spinner.start();


        // Deploy the Terrain contract with the library linked
//         const terrainFactory = await hre.ethers.getContractFactory('Terrain');
        const terrainFactory = await hre.ethers.getContractFactory('Terrain', {
            libraries: {
                TransmissionLib: transmissionLib.address,
            },
        });
        const mountain = await terrainFactory.deploy(routerAddress, linkAddress, terrainType, myNetworkChainlinkId);
        await mountain.deployed();

        spinner.stop();
        console.log(`✅ Terrain/Lake deployed at address ${mountain.address} on ${hre.network.name} blockchain`)

        console.log(`Waiting for transaction confirmations...`);
        await sleep(60 * 1000)
        await mountain.deployTransaction.wait(); // Wait for transaction to be mined

        const verRes = await verifyContract(mountain.address, "contracts/Terrain.sol:Terrain", [routerAddress, linkAddress, terrainType, myNetworkChainlinkId]);

        if(!verRes){
            console.log("Verified!");
        }
        else {
            console.log("verification failed.");
        }

    });