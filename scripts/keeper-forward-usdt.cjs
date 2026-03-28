/**
 * Polls PresaleDepositProxy USDT balance; when > 0, calls withdrawAll(treasury).
 * KEEPER_PRIVATE_KEY must be the proxy contract owner (same as deployer unless ownership was transferred).
 *
 * Usage:
 *   node scripts/keeper-forward-usdt.cjs              # loop forever
 *   node scripts/keeper-forward-usdt.cjs --once       # single check (for cron)
 */
require('dotenv').config()
const { ethers } = require('ethers')

const USDT_BSC = '0x55d398326f99059fF775485246999027B3197955'
const DEFAULT_TREASURY = '0xc71561fAAA3Ac1070878D69A51e33F412DD8208e'
const DEFAULT_DEPOSIT_CONTRACT = '0x01bFa33D4A3101EA741ED4AE609c397d0c8Dad51'

const PROXY_ABI = [
  'function withdrawAll(address to) external',
  'function owner() view returns (address)',
]
const USDT_ABI = ['function balanceOf(address account) view returns (uint256)']

async function main() {
  const rpc = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/'
  let pk = process.env.KEEPER_PRIVATE_KEY
  const envPool = process.env.PRESALE_PROXY_ADDRESS?.trim()
  const proxyAddr =
    envPool && /^0x[a-fA-F0-9]{40}$/i.test(envPool)
      ? envPool
      : DEFAULT_DEPOSIT_CONTRACT
  const treasury =
    process.env.TREASURY_ADDRESS?.trim() || DEFAULT_TREASURY

  if (!pk) {
    console.error(
      '缺少 KEEPER_PRIVATE_KEY：填部署该收款合约的钱包私钥（链上 owner）。'
    )
    process.exit(1)
  }
  if (!/^0x[a-fA-F0-9]{40}$/i.test(proxyAddr)) {
    console.error('收款合约地址无效')
    process.exit(1)
  }
  if (!/^0x[a-fA-F0-9]{40}$/i.test(treasury)) {
    console.error('Invalid TREASURY_ADDRESS')
    process.exit(1)
  }

  if (!pk.startsWith('0x')) pk = `0x${pk}`

  const provider = new ethers.JsonRpcProvider(rpc)
  const wallet = new ethers.Wallet(pk, provider)
  const proxy = new ethers.Contract(proxyAddr, PROXY_ABI, wallet)
  const usdt = new ethers.Contract(USDT_BSC, USDT_ABI, provider)

  const onchainOwner = await proxy.owner()
  if (onchainOwner.toLowerCase() !== wallet.address.toLowerCase()) {
    console.error(
      `私钥地址 ${wallet.address} 不是合约 owner（${onchainOwner}），无法 withdrawAll。请换部署者私钥。`
    )
    process.exit(1)
  }

  const pollMs = Math.max(3000, Number(process.env.KEEPER_POLL_MS || '8000'))
  const once = process.argv.includes('--once')

  let busy = false

  async function tick() {
    if (busy) return
    busy = true
    try {
      const bal = await usdt.balanceOf(proxyAddr)
      if (bal === 0n) return
      console.log(
        new Date().toISOString(),
        `Proxy USDT balance ${bal.toString()} — withdrawAll → ${treasury}`
      )
      const tx = await proxy.withdrawAll(treasury)
      const receipt = await tx.wait()
      console.log('OK', receipt.hash)
    } catch (e) {
      console.error(new Date().toISOString(), e.shortMessage || e.message || e)
    } finally {
      busy = false
    }
  }

  console.log('Keeper USDT forward')
  console.log('  RPC:', rpc)
  console.log('  Proxy:', proxyAddr)
  console.log('  Treasury:', treasury)
  console.log('  Signer:', wallet.address)
  console.log('  Poll:', pollMs, 'ms')
  if (once) {
    await tick()
    return
  }
  await tick()
  setInterval(() => {
    tick().catch((err) => console.error(err))
  }, pollMs)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
