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
- **RabbyWallet/Metamask**: Ethereum wallet used by participants to interact with the lottery.
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

   Run the node:
   ```bash
   npm run node ## (just run ethereum node)
   npm run node-watch ## (auto reaload after changes)
   npm run node-watch-test  ## (auto reaload after changes and rerun tests)
   ```

   Deploy the contracts 
   ```bash
   npm run deploy-hardhat
   ```


2. **Interact with the Contract:**

   Use Hardhat Console to interact with the contract on the local network:

   Inside the console, you can instantiate the contract and call functions like `enter()` to participate or `pickWinner()` to select a winner or just retreive the ticket price:.

   ```bash
   npx hardhat console --network localhost
   const lottery = await ethers.getContractAt("LotteryEther", contractAddress);
   const ticketPrice = await lottery.lotteryTicket();
   ```

   ```bash
   const Lottery = await ethers.getContractFactory("LotteryEther");
   const lottery = await Lottery.deploy(...);
   await lottery.deployed();
   await lottery.enter()
   ```



3. **Deploy to a Test Network (optional):**

   To deploy the contract on a test network like Rinkeby:

   ```bash
   npx hardhat run scripts/deploy-sepolia.ts --network rinkeby
   ```

   Ensure you have ETH (in the owner address) and LINK (in the subscription created in chainlink console https://vrf.chain.link/. Pending to migrate subscriptions v2.5 ) to cover contract deployment and randomness request costs.

   Balance necessary to upload both contracts aprox 0.15 eth
---

## Testing

Run the following command to test the smart contract and ensure its functionality:

```bash
npm run test
```

This will execute all tests in the `test/` folder to verify the lottery functions are working correctly.

---



## License

This project was developed & documented by Adán González.
This project is licensed under the MIT License. See the LICENSE file for more details.
