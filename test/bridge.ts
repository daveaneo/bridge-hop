const { expect } = require("chai");
const { ethers } = require("hardhat");
import { LINK_ADDRESSES, routerConfig } from "../tasks/constants";
import { getPrivateKey, getProviderRpcUrl, getRouterConfig, sleep, verifyContract } from "../tasks/utils";

describe("Mountain Contract", function () {
  let Mountain;
  let mountain;
  let owner;
  let addr1;
  let addr2;
  let linkToken;

  const dummyRouterAddress = "0x0000000000000000000000000000000000000001";
  const dummyLinkAddress = "0x0000000000000000000000000000000000000002";
  const dummyNetworkChainlinkId = 1234;
  const dummyTerrain = 1; // Assuming 1 represents Mountain

  beforeEach(async function () {

    const networkName = hre.network.name;
    const routerAddress = getRouterConfig(hre.network.name).address;
    const myNetworkChainlinkId = routerConfig[networkName].chainSelector;
    const linkAddress = LINK_ADDRESSES[hre.network.name]

    const transmissionLibFactory = await ethers.getContractFactory("TransmissionLib");
    const transmissionLib = await transmissionLibFactory.deploy();
    await transmissionLib.deployed();

    // Deploy the Mountain contract with the library linked
    const mountainFactory = await hre.ethers.getContractFactory('Mountain', {
        libraries: {
            TransmissionLib: transmissionLib.address,
        },
    });
    const mountain = await mountainFactory.deploy(routerAddress, linkAddress, 1, myNetworkChainlinkId);
    await mountain.deployed();

    // Deploy the Mountain contract
    Mountain = await ethers.getContractFactory('Mountain', {
        libraries: {
            TransmissionLib: transmissionLib.address,
        },
    });

    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy a dummy LINK token for testing
//     const LinkToken = await ethers.getContractFactory("LinkToken");
//     linkToken = await LinkToken.deploy();
//     await linkToken.deployed();

    mountain = await Mountain.deploy(dummyRouterAddress, linkToken.address, dummyTerrain, dummyNetworkChainlinkId);
    await mountain.deployed();
  });

  it("Initial values are set as expected", async function () {
    expect(await mountain.s_linkToken()).to.equal(linkToken.address);
    expect(await mountain.terrain()).to.equal(dummyTerrain);
    expect(await mountain.myNetworkAddress()).to.equal(dummyNetworkChainlinkId);
  });

  describe("Staging Liquidity", function () {
    it("Staging liquidity works", async function () {
      const amountToStage = ethers.utils.parseEther("1");
      await mountain.connect(addr1).stageLiquidity(ethers.constants.AddressZero, amountToStage, { value: amountToStage });
      expect(await mountain.liquidityStaging(mountain.address, addr1.address, ethers.constants.AddressZero)).to.equal(amountToStage);
    });

    // ... Other tests related to staging liquidity
  });

  describe("Adding Liquidity from Staged", function () {
    // ... Tests for adding liquidity from staged

    // Example test for adding liquidity without any staged liquidity
    it("Doesn't work without staged liquidity", async function () {
      const amountToStage = ethers.utils.parseEther("1");
      await expect(
        mountain.connect(addr1).addLiquidityFromStaged(ethers.constants.AddressZero, amountToStage)
      ).to.be.revertedWith("Insufficient staged liquidity");
    });

    // ... Tests for other scenarios
  });

  // ... Additional tests as required
});

