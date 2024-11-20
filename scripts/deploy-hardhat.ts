import { ethers } from "hardhat";

async function main() {
  // Desplegar el mock VRFCoordinator en la red local
  const VRFCoordinatorV2Mock = await ethers.getContractFactory("VRFCoordinatorV2Mock");
  const vrfCoordinatorMock = await VRFCoordinatorV2Mock.deploy(0, 0); // Inicialización simple
  await vrfCoordinatorMock.deployed();
  console.log("Mock VRFCoordinator deployed to:", vrfCoordinatorMock.address);

  // Desplegar la lotería con el mock
  const Lottery = await ethers.getContractFactory("Lottery");
  const subscriptionId = 1; // Cualquier valor para simular
  const keyHash = ethers.constants.HashZero; // Hash dummy

  const lottery = await Lottery.deploy(subscriptionId, vrfCoordinatorMock.address, keyHash);
  await lottery.deployed();

  console.log("Lottery deployed to local network at:", lottery.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
