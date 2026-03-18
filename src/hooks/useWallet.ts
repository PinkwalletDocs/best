import { useState, useEffect, useCallback } from 'react'
import { BrowserProvider, Contract, JsonRpcSigner } from 'ethers'

const BNB_CHAIN_ID = 56

export const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  56: 'BNB Chain',
  97: 'BSC Testnet',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  43114: 'Avalanche',
}

const BNB_CHAIN_PARAMS = {
  chainId: '0x38',
  chainName: 'BNB Smart Chain',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: ['https://bsc-dataseed.binance.org/', 'https://bsc-dataseed1.defibit.io/'],
  blockExplorerUrls: ['https://bscscan.com'],
}

const USDT_BSC = '0x55d398326f99059fF775485246999027B3197955'
const PRESALE_RECEIVER = '0xF31289Cd3a6B3B3bdc8bBCAdCA9AB87837FaB560'

const USDT_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
]

export function useWallet() {
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(async () => {
    try {
      setIsConnecting(true)
      setError(null)
      if (!window.ethereum) {
        throw new Error('Please install MetaMask, OKX Wallet, Bitget Wallet, or Binance Wallet')
      }
      const prov = new BrowserProvider(window.ethereum)
      const accounts = await prov.send('eth_requestAccounts', [])
      if (!accounts?.length) throw new Error('No account connected')
      const sig = await prov.getSigner()
      const network = await prov.getNetwork()
      setProvider(prov)
      setSigner(sig)
      setAddress(accounts[0])
      setChainId(Number(network.chainId))
      return { address: accounts[0], chainId: Number(network.chainId) }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to connect'
      setError(msg)
      throw e
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setProvider(null)
    setSigner(null)
    setAddress(null)
    setChainId(null)
    setError(null)
  }, [])

  const switchToBNB = useCallback(async () => {
    try {
      if (!window.ethereum) throw new Error('Wallet not found')
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BNB_CHAIN_PARAMS.chainId }],
      })
      await connect()
    } catch (e: unknown) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [BNB_CHAIN_PARAMS],
        })
        await connect()
      } catch {
        throw e
      }
    }
  }, [connect])

  const getUSDTBalance = useCallback(async (): Promise<bigint> => {
    if (!provider || !address) return 0n
    try {
      const contract = new Contract(USDT_BSC, USDT_ABI, provider)
      return await contract.balanceOf(address)
    } catch {
      return 0n
    }
  }, [provider, address])

  const participatePresale = useCallback(
    async (usdtAmountWei: bigint) => {
      if (!signer || !address) throw new Error('Wallet not connected')
      if (chainId !== BNB_CHAIN_ID) throw new Error('Please switch to BNB Chain')
      const contract = new Contract(USDT_BSC, USDT_ABI, signer)
      const allowance = await contract.allowance(address, PRESALE_RECEIVER)
      if (allowance < usdtAmountWei) {
        const tx = await contract.approve(PRESALE_RECEIVER, usdtAmountWei)
        await tx.wait()
      }
      const transferTx = await contract.transfer(PRESALE_RECEIVER, usdtAmountWei)
      await transferTx.wait()
    },
    [signer, address, chainId]
  )

  useEffect(() => {
    if (!window.ethereum) return
    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts.length) disconnect()
    }
    const handleChainChanged = () => window.location.reload()
    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum?.removeListener('chainChanged', handleChainChanged)
    }
  }, [disconnect])

  return {
    address,
    chainId,
    chainName: chainId ? (CHAIN_NAMES[chainId] ?? `Chain ${chainId}`) : null,
    isConnected: !!address,
    isCorrectChain: chainId === BNB_CHAIN_ID,
    isConnecting,
    error,
    connect,
    disconnect,
    switchToBNB,
    participatePresale,
    getUSDTBalance,
  }
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, cb: (...args: unknown[]) => void) => void
      removeListener: (event: string, cb: (...args: unknown[]) => void) => void
    }
  }
}
