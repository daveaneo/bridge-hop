import { CCIP_BnM_ADDRESSES, CCIP_LnM_ADDRESSES, PayFeesIn, routerConfig } from "./constants";

export const getProviderRpcUrl = (network: string) => {
    let rpcUrl;

    switch (network) {
        case "ethereumSepolia":
            rpcUrl = process.env.ETHEREUM_SEPOLIA_RPC_URL;
            break;
        case "optimismGoerli":
            rpcUrl = process.env.OPTIMISM_GOERLI_RPC_URL;
            break;
        case "arbitrumTestnet":
            rpcUrl = process.env.ARBITRUM_TESTNET_RPC_URL;
            break;
        case "avalancheFuji":
            rpcUrl = process.env.AVALANCHE_FUJI_RPC_URL;
            break;
        case "polygonMumbai":
            rpcUrl = process.env.POLYGON_MUMBAI_RPC_URL;
            break;
        case "polygon":
            rpcUrl = process.env.POLYGON_MUMBAI_RPC_URL;
            break;
        case "hardhat":
            rpcUrl = process.env.POLYGON_MUMBAI_RPC_URL; // anything
            break;
        default:
            throw new Error("Unknown network: " + network);
    }

    if (!rpcUrl)
        throw new Error(
            `rpcUrl empty for network ${network} - check your environment variables`
        );

    return rpcUrl;
};

export const getPrivateKey = () => {
    const privateKey = process.env.PRIVATE_KEY;

    if (!privateKey)
        throw new Error(
            "private key not provided - check your environment variables"
        );

    return privateKey;
};


export const getRouterConfig = (network: string) => {
    switch (network) {
        case "ethereumSepolia":
            return routerConfig.ethereumSepolia;
        case "optimismGoerli":
            return routerConfig.optimismGoerli;
        case "arbitrumTestnet":
            return routerConfig.arbitrumTestnet;
        case "avalancheFuji":
            return routerConfig.avalancheFuji;
        case "polygonMumbai":
            return routerConfig.polygonMumbai;
        case "polygon":
            return routerConfig.polygon;
        case "hardhat":
            return routerConfig.hardhat;
        default:
            throw new Error("Unknown network: " + network);
    }
};


export const getPayFeesIn = (payFeesIn: string) => {
    let fees;

    switch (payFeesIn) {
        case "Native":
            fees = PayFeesIn.Native;
            break;
        case "native":
            fees = PayFeesIn.Native;
            break;
        case "LINK":
            fees = PayFeesIn.LINK;
            break;
        case "link":
            fees = PayFeesIn.LINK;
            break;
        default:
            fees = PayFeesIn.Native;
            break;
    }

    return fees;
}

export const getFaucetTokensAddresses = (network: string) => {
    return { ccipBnM: CCIP_BnM_ADDRESSES[network], ccipLnM: CCIP_LnM_ADDRESSES[network] };
}

export const verifyContract = async (contractAddress: string, contractNameWithPath: string, constructorArgs: Array<string>) => {
  const hre = await import("hardhat");
  let errorCode =0;
  try {
    const networkId = await hre.network.provider.send("eth_chainId");
    const localNetworkId = "0x7a69"; // hardhat local

    // If on Hardhat's local network, simply return
    if (networkId === localNetworkId) {
      return;
    }

    // Run the Hardhat task for contract verification
    await hre.run("verify:verify", {
      address: contractAddress,
      contract: contractNameWithPath,  // specify the contract name here
      constructorArguments: constructorArgs,
    });

  } catch (error) {
    console.error(`Error verifying ${contractNameWithPath}:`, error);
    errorCode = 1;
  }
    return errorCode;
}

export const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}
