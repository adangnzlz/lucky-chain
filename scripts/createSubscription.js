const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Creating subscription with account:", deployer.address);

    // ABI mínima necesaria para interactuar con el VRFCoordinatorV2
    const VRFCoordinatorV2_ABI = [
        "function createSubscription() public returns (uint64)"
    ];

    // Dirección del VRFCoordinatorV2 en Sepolia
    const VRFCoordinatorV2_ADDRESS = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";

    // Conectar con el contrato usando la dirección y la ABI
    const vrfCoordinatorV2 = new ethers.Contract(
        VRFCoordinatorV2_ADDRESS,
        VRFCoordinatorV2_ABI,
        deployer
    );

    // Llamar a la función createSubscription
    const tx = await vrfCoordinatorV2.createSubscription();
    console.log("Transaction sent, waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("Subscription created successfully. Receipt:", receipt);
    // buscar  la transacción en ether scan para localizar la subscription ID (se puede crear la transacción por interface pero a veces falla)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
