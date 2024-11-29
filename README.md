# Lucky Chain 🎲

**Lucky Chain** is a decentralized lottery built on Ethereum that supports execution with both the native token and an ERC20 token. It leverages smart contracts and Chainlink VRF to ensure transparency and randomness in winner selection. Participants can join by sending a small amount of ETH, and the contract will randomly select a winner to receive all the accumulated funds.

## Table of Contents

- [Features](#features)
- [Technologies](#technologies)
- [Installation](#installation)
- [Setup](#setup)
- [Usage](#usage)
- [Testing](#testing)
- [Deployment](#deployment)
- [License](#license)
- [Contributions](#contributions)
- [Contact](#contact)

---

## Features

- **Decentralized Lottery**: No centralized intervention; everything is managed via a smart contract.
- **Verified Randomness**: Uses Chainlink VRF (Verifiable Random Function) to ensure fair and random winner selection.
- **Built with Hardhat**: Utilizes Hardhat for smart contract development, testing, and deployment.
- **Testnet Compatibility**: The application can be tested on test networks like Sepolia before launching on Ethereum Mainnet.

---

## Technologies Used

- **Ethereum**: Blockchain network where the contract is deployed.
- **Solidity**: Programming language used to write the smart contract.
- **Hardhat**: Tool for developing, testing, and deploying Ethereum smart contracts.
- **Chainlink VRF**: Verifiable randomness protocol to ensure fairness in winner selection.
- **RabbyWallet**: Ethereum wallet used by participants to interact with the lottery.
- **Echidna**: A fuzzing tool for smart contracts that generates random transaction sequences based on the contract’s ABI.
- **Slither**: For detecting code vulnerabilities and best practice violations.

---

## Installation

To run this project locally, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/lucky-chain.git
   cd lucky-chain
   ```

2. **Install project dependencies:**

   Ensure Node.js is installed, then run:

   ```bash
   npm install
   ```

3. **Install Hardhat dependencies:**

   ```bash
   npm install --save-dev hardhat @nomiclabs/hardhat-ethers ethers dotenv
   ```

4. **Install Echidna:**

   ```bash
   brew install echidna
   ```

5. **Install Slither:**

   ```bash
   pip3 install slither-analyzer --user
   ```

   A Visual Studio Code extension for Slither is recommended for ease of use.

---

## Setup

1. **Configure environment variables:**

   Create a `.env` file in the project root and add the following variables:

   ```bash
   WALLET_PRIVATE_KEY=
   SEPOLIA_URL=
   VRF_COORDINATOR= # Coordinator for Sepolia
   SUBSCRIPTION_ID= # Chainlink subscription ID
   KEY_HASH= # Valid key hash for Sepolia
   ```

2. **Update `hardhat.config.ts`:**

   Ensure the `hardhat.config.js` file is configured to use environment variables. This should already be set up if you followed the installation guide.

---

## Usage

1. **Deploy the Contract Locally:**

   Hardhat creates a local network automatically when you run certain commands. To deploy the contract locally:

   ```bash
   npx hardhat run scripts/deploy.js --network hardhat
   ```

2. **Interact with the Contract:**

   Use Hardhat Console to interact with the contract on the local network:

   ```bash
   npx hardhat console --network hardhat
   ```

   Inside the console, you can instantiate the contract and call functions like `enter()` to participate or `pickWinner()` to select a winner.

3. **Deploy to a Test Network (optional):**

   To deploy the contract on a test network like Rinkeby:

   ```bash
   npx hardhat run scripts/deploy.js --network rinkeby
   ```

   Ensure you have test ETH and LINK in your MetaMask account to cover transaction and randomness request costs.

---

## Testing

Run the following command to test the smart contract and ensure its functionality:

```bash
npm run test
```

This will execute all tests in the `test/` folder to verify the lottery functions are working correctly.

---

## Deployment

To deploy the contract on Ethereum Mainnet, follow these steps carefully:

1. **Update the `.env` file with credentials for an Infura project and a funded MetaMask account.**

2. **Run the deployment command:**

   ```bash
   npx hardhat run scripts/deploy.js --network mainnet
   ```

3. **Ensure you have enough ETH and LINK in your account, as deploying on Mainnet requires real funds.**

**Note:** Deploying on Mainnet incurs significant gas costs and is irreversible. Thoroughly test the contract on a test network before proceeding.

---

## License
This project was developed & documented by Adán González. 
This project is licensed under the MIT License. See the LICENSE file for more details.
