/**
 * Deploy PresaleDepositProxy on BNB Chain mainnet or testnet.
 *
 * Usage:
 *   npm run deploy:presale:bsc
 *   npm run deploy:presale:testnet
 *
 * Required in .env: DEPLOYER_PRIVATE_KEY (with BNB for gas)
 * Optional: TREASURY_ADDRESS (defaults to deployer) — receives withdraw() from proxy owner
 */
require("dotenv").config();
const hre = require("hardhat");

const USDT_BSC_MAINNET = "0x55d398326f99059fF775485246999027B3197955";
/** BSC Testnet USDT (BEP-20) */
const USDT_BSC_TESTNET = "0x337610d27c682E347C9cD60BD4b3b107C9d34dD";

async function main() {
  const net = await hre.ethers.provider.getNetwork();
  const chainId = Number(net.chainId);

  const usdt =
    chainId === 97
      ? process.env.USDT_BSC_TESTNET || USDT_BSC_TESTNET
      : process.env.USDT_BSC_MAINNET || USDT_BSC_MAINNET;

  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer: set DEPLOYER_PRIVATE_KEY in .env");
  }

  const treasury =
    process.env.TREASURY_ADDRESS && process.env.TREASURY_ADDRESS.length > 0
      ? process.env.TREASURY_ADDRESS
      : deployer.address;

  console.log("Network chainId:", chainId);
  console.log("Deployer:", deployer.address);
  console.log("Owner (treasury):", treasury);
  console.log("USDT token:", usdt);

  const Factory = await hre.ethers.getContractFactory("PresaleDepositProxy");
  const proxy = await Factory.deploy(usdt, treasury);
  await proxy.waitForDeployment();
  const addr = await proxy.getAddress();

  console.log("\n--- OK ---");
  console.log("PresaleDepositProxy:", addr);
  console.log("\nPaste into .env (then restart Vite):");
  console.log("VITE_PRESALE_PROXY_ADDRESS=" + addr);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
