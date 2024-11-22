import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "dotenv/config";
import "solidity-coverage";

const config: HardhatUserConfig = {
 solidity: {
    version: "0.8.20",
    settings: {
      outputSelection: {
        "*": {
          "*": ["evm.bytecode.sourceMap", "evm.deployedBytecode.sourceMap"]
        }
      }
    }
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_URL,
      accounts: [process.env.PRIVATE_KEY!],
    },
    hardhat: {
      chainId: 1337
    }
  },
};

export default config;
