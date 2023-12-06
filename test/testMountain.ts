const { expect } = require("chai");
const { ethers } = require("hardhat");
import { LINK_ADDRESSES, routerConfig } from "../tasks/constants";
import { getPrivateKey, getProviderRpcUrl, getRouterConfig, sleep, verifyContract } from "../tasks/utils";

describe("Test Mountain Contract", function () {
  var Mountain, tokenFactory;
  var mountain, lake, token;
  var owner, addr1, addr2;

  var linkAddress;
  var routerAddress;
  var myNetworkChainlinkId;
  var lakeBlockchainId;

  const networkChainlinkId = "4051577828743386545";

  beforeEach(async function () {

    const networkName = hre.network.name;
    routerAddress = getRouterConfig(hre.network.name).address;
    myNetworkChainlinkId = routerConfig[networkName].chainSelector;
    lakeBlockchainId = 404; // todo --
    linkAddress = LINK_ADDRESSES[hre.network.name]

    tokenFactory = await ethers.getContractFactory("TestToken");
    token = await tokenFactory.deploy();
    await token.deployed();


    const transmissionLibFactory = await ethers.getContractFactory("TransmissionLib");
    const transmissionLib = await transmissionLibFactory.deploy();
    await transmissionLib.deployed();

    // Deploy the Mountain contract with the library linked
    Mountain = await hre.ethers.getContractFactory('Mountain', {
        libraries: {
            TransmissionLib: transmissionLib.address,
        },
    });
    mountain = await Mountain.deploy(routerAddress, token.address, 1, myNetworkChainlinkId);
    await mountain.deployed();

    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy a dummy LINK token for testing
//     const LinkToken = await ethers.getContractFactory("LinkToken");
//     linkToken = await LinkToken.deploy();
//     await linkToken.deployed();


    lake = await Mountain.deploy(routerAddress, token.address, 0, myNetworkChainlinkId);
    await lake.deployed();

    // give tokens to addr1, addr2
    const amount = ethers.utils.parseUnits('10', 18);
    await token.transfer(addr1.address, amount);
    await token.transfer(addr2.address, amount);
  });

  it("Initial Mountain values are set as expected", async function () {
    expect(await mountain.s_linkToken()).to.equal(token.address);
    expect(await mountain.terrain()).to.equal(1);
    expect(await mountain.myNetworkAddress()).to.equal(networkChainlinkId);
  });

  it("Initial Lake values are set as expected", async function () {
    expect(await lake.s_linkToken()).to.equal(token.address);
    expect(await lake.terrain()).to.equal(0);
    expect(await lake.myNetworkAddress()).to.equal(networkChainlinkId);
  });


  describe("Staging Liquidity", function () {
    it("Staging liquidity works for ETH", async function () {
      const amountToStage = ethers.utils.parseEther("1");
      await mountain.connect(owner).stageLiquidity(ethers.constants.AddressZero, amountToStage, { value: amountToStage });
      expect(await mountain.liquidityStaging(networkChainlinkId, ethers.constants.AddressZero)).to.equal(amountToStage);
    });


    it("Staging liquidity works for token", async function () {
      const amountToStage = ethers.utils.parseEther("1");

      // Approve mountain.address to spend the tokens
      await token.connect(owner).approve(mountain.address, amountToStage);
      await mountain.stageLiquidity(token.address, amountToStage);
      expect(await mountain.liquidityStaging(networkChainlinkId, token.address)).to.equal(amountToStage);
    });

    it("Staging liquidity fails for non owner", async function () {
      const amountToStage = ethers.utils.parseEther("1");

      await expect(
        mountain.connect(addr1).stageLiquidity(ethers.constants.AddressZero, amountToStage, { value: amountToStage })
      ).to.be.revertedWith("Only callable by owner");
    });

    // Example test for adding liquidity without any staged liquidity
    it("Doesn't work without staged liquidity", async function () {
      const amountToStage = ethers.utils.parseEther("1");
      await expect(
        mountain.connect(owner).addLiquidityFromStaged(ethers.constants.AddressZero, lakeBlockchainId, 10000, owner.address)
      ).to.be.revertedWith("Non-zero amounts required in staging");
    });



  });

//
//   */    function addLiquidityFromStaged(
//         address tokenAddress,
//         uint256 lakeBlockchainId,
//         uint16 slippage,
//         address receiver
//     ) external onlyOwner {

  describe("Adding Liquidity from Staged", function () {
    // ... Tests for adding liquidity from staged
    beforeEach(async function () {
      // add eth
      const amountToStage = ethers.utils.parseEther("1");
      await mountain.connect(owner).stageLiquidity(ethers.constants.AddressZero, amountToStage, { value: amountToStage });

      // add token
      await token.connect(owner).approve(mountain.address, amountToStage);
      await mountain.stageLiquidity(token.address, amountToStage);

    });

        // Example test for adding liquidity without any staged liquidity
        it("Doesn't work without staged liquidity on Lake", async function () {
          const amountToStage = ethers.utils.parseEther("1");
          await expect(
            mountain.connect(owner).addLiquidityFromStaged(ethers.constants.AddressZero, lakeBlockchainId, 10000, owner.address)
          ).to.be.revertedWith("Non-zero amounts required in staging");
        });

        // todo -- tests for adding liquidity
        // todo -- how to add liquidity from other network in tests? Helper function?

        // todo -- encode and decode messages to structures

    // ... Tests for other scenarios
  });

  // ... Additional tests as required
});

