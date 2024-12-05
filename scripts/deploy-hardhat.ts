import { ethers } from "hardhat";

async function deployVRFCoordinatorMock() {
  const VRFCoordinatorV2Mock = await ethers.getContractFactory(
    "VRFCoordinatorV2Mock"
  );
  const vrfCoordinatorMock = await VRFCoordinatorV2Mock.deploy(0, 0); // Mock VRF initialization
  await vrfCoordinatorMock.deployed();
  console.log("VITE_VRF_COORDINATOR_ADDRESS=" + vrfCoordinatorMock.address);
  return vrfCoordinatorMock;
}

async function deployLinkToken() {
  const LinkToken = await ethers.getContractFactory("LinkTokenMock");
  const linkToken = await LinkToken.deploy();
  await linkToken.deployed();
  console.log("VITE_LINK_TOKEN_MOCK_ADDRESS=" + linkToken.address);
  return linkToken;
}

async function deployLotteryEther(
  subscriptionId: number,
  vrfCoordinatorAddress: string,
  keyHash: string
) {
  const LotteryEther = await ethers.getContractFactory("LotteryEther");
  const lotteryEther = await LotteryEther.deploy(
    subscriptionId,
    vrfCoordinatorAddress,
    keyHash,
    false
  );
  await lotteryEther.deployed();
  console.log("VITE_LOTTERY_ETHER_ADDRESS=" + lotteryEther.address);
  return lotteryEther;
}

async function deployLotteryERC20(
  subscriptionId: number,
  vrfCoordinatorAddress: string,
  keyHash: string,
  linkTokenAddress: string
) {
  const LotteryERC20 = await ethers.getContractFactory("LotteryERC20");
  const lotteryLink = await LotteryERC20.deploy(
    subscriptionId,
    vrfCoordinatorAddress,
    keyHash,
    linkTokenAddress
  );
  await lotteryLink.deployed();
  console.log("VITE_LOTTERY_LINK_ADDRESS=" + lotteryLink.address);
  return lotteryLink;
}

async function main() {
  // Step 1: Deploy the mock VRFCoordinator
  const vrfCoordinatorMock = await deployVRFCoordinatorMock();

  // Step 2: Define constants for simulation
  const tx = await vrfCoordinatorMock.createSubscription();
  const receipt = await tx.wait();
  const subscriptionId = receipt.events[0].args.subId;

  const keyHash = ethers.constants.HashZero; // Hash dummy

  // Step 3: Deploy LotteryEther
  const lotteryEther = await deployLotteryEther(
    subscriptionId,
    vrfCoordinatorMock.address,
    keyHash
  );
  await vrfCoordinatorMock.addConsumer(subscriptionId, lotteryEther.address);

  // Step 4: Deploy LinkToken
  const linkToken = await deployLinkToken();
  await vrfCoordinatorMock.addConsumer(subscriptionId, linkToken.address);

  // Step 5: Deploy LotteryERC20
  await deployLotteryERC20(
    subscriptionId,
    vrfCoordinatorMock.address,
    keyHash,
    linkToken.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
