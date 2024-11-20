import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const subscriptionId = process.env.SUBSCRIPTION_ID;
  const vrfCoordinator = process.env.VRF_COORDINATOR;
  const keyHash = process.env.KEY_HASH;

  if (!subscriptionId || !vrfCoordinator || !keyHash) {
    throw new Error("VRF configuration missing in .env");
  }

  // Obtener la fábrica del contrato "Lottery"
  const Lottery = await ethers.getContractFactory("Lottery");
  
  // Desplegar el contrato con los parámetros necesarios
  const lottery = await Lottery.deploy(subscriptionId, vrfCoordinator, keyHash);
  await lottery.deployed();

  console.log("Lottery deployed to:", lottery.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
