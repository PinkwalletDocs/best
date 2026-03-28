require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const deployerKey = process.env.DEPLOYER_PRIVATE_KEY
  ? [process.env.DEPLOYER_PRIVATE_KEY.startsWith("0x")
      ? process.env.DEPLOYER_PRIVATE_KEY
      : `0x${process.env.DEPLOYER_PRIVATE_KEY}`]
  : [];

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache-hardhat",
  },
  networks: {
    hardhat: {},
    bsc: {
      url: process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org/",
      accounts: deployerKey,
      chainId: 56,
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts: deployerKey,
      chainId: 97,
    },
  },
};
