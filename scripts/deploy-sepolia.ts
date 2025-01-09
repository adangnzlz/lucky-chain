import { ethers } from "hardhat";

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
    false,
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
    linkTokenAddress,
    true
  );
  await lotteryLink.deployed();
  console.log("VITE_LOTTERY_LINK_ADDRESS=" + lotteryLink.address);
  return lotteryLink;
}

async function main() {
  const vrfCoordinatorAddress = String(process.env.VRF_COORDINATOR);
  const linkTokenAddress = String(process.env.LINK_TOKEN); 
  const keyHash = String(process.env.KEY_HASH); 
  const subscriptionId = Number(process.env.SUBSCRIPTION_ID);

  const [deployer] = await ethers.getSigners(); // Obtiene la cuenta configurada
  const balance = await deployer.getBalance(); // Obtiene el saldo de la cuenta
  console.log("Account address:", deployer.address);
  console.log("Account balance (ETH):", ethers.utils.formatEther(balance)); // Convertir a ETH


  // Step 3: Deploy LotteryEther
  const lotteryEther = await deployLotteryEther(
    subscriptionId,
    vrfCoordinatorAddress,
    keyHash
  );
  console.log("LotteryEther deployed to:", lotteryEther.address);

  // Step 5: Deploy LotteryERC20
  const lotteryERC20 = await deployLotteryERC20(
    subscriptionId,
    vrfCoordinatorAddress,
    keyHash,
    linkTokenAddress
  );
  console.log("LotteryERC20 deployed to:", lotteryERC20.address);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
