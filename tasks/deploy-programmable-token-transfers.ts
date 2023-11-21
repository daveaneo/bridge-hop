import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { getPrivateKey, getProviderRpcUrl, getRouterConfig, sleep } from "./utils";
import { Wallet, providers } from "ethers";
import { ProgrammableTokenTransfers, ProgrammableTokenTransfers__factory } from "../typechain-types";
import { Spinner } from "../utils/spinner";

task(`deploy-programmable-token-transfers`, `Deploys the ProgrammableTokenTransfers smart contract`)
    .addOptionalParam(`router`, `The address of the Router contract`)
    .addOptionalParam(`allowedChains`, `Array of allowed chains to send to?`)
    .setAction(async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
        console.log("taskArguments");
        console.log(taskArguments);
        const routerAddress = taskArguments.router ? taskArguments.router : getRouterConfig(hre.network.name).address;
        const allowedChains = taskArguments.allowedChains ? JSON.parse(taskArguments.allowedChains.replace(/'/g, '"')) : [];

        console.log('allowedChains');
        console.log(allowedChains)

        const privateKey = getPrivateKey();
        const rpcProviderUrl = getProviderRpcUrl(hre.network.name);

        const provider = new providers.JsonRpcProvider(rpcProviderUrl);
        const wallet = new Wallet(privateKey);
        const deployer = wallet.connect(provider);

        const spinner: Spinner = new Spinner();

        console.log(`ℹ️  Attempting to deploy ProgrammableTokenTransfers on the ${hre.network.name} blockchain using ${deployer.address} address, with the Router address ${routerAddress} provided as constructor argument`);
        spinner.start();

        const programmableTokenTransfersFactory: ProgrammableTokenTransfers__factory = await hre.ethers.getContractFactory('ProgrammableTokenTransfers');
        const programmableTokenTransfers: ProgrammableTokenTransfers = await programmableTokenTransfersFactory.deploy(routerAddress);
        await programmableTokenTransfers.deployed();

        spinner.stop();
        console.log(`✅ ProgrammableTokenTransfers deployed at address ${programmableTokenTransfers.address} on ${hre.network.name} blockchain`)

        for (let i = 0; i < allowedChains.length; i++) {
            let chainSelector: number | string;

            if (!isNaN(Number(allowedChains[i]))) {
                // It's a number (or can be converted to one)
                chainSelector = allowedChains[i];
            } else {
                // It's not a number, use getRouterConfig to retrieve the chainSelector
                console.log("we are looking up this chain: ", allowedChains[i])
                chainSelector = getRouterConfig(allowedChains[i]).chainSelector;
            }

            let tx = await programmableTokenTransfers.allowlistDestinationChain(chainSelector);
            console.log("tx:");
            console.log(tx);
        }



        console.log(`ℹ️  Setting permissions`);
        spinner.start();
        spinner.stop();

        spinner.start();

        console.log(`Waiting for transaction confirmations...`);
        await sleep(60 * 1000)
        await programmableTokenTransfers.deployTransaction.wait(); // Wait for transaction to be mined

        const verRes = await verifyContract(programmableTokenTransfers.address, "contracts/ProgrammableTokenTransfers.sol:ProgrammableTokenTransfers", [routerAddress]);

        if(!verRes){
            console.log("Verified!");
        }
        else {
            console.log("verification failed.");
        }
        spinner.stop();

    });