import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import Header from './components/Header'
import TabNav from './components/TabNav'
import PrimaryStore from './components/PrimaryStore'
import Marketplace from './components/Marketplace'
import Inventory from './components/Inventory'
import AdminPanel from './components/AdminPanel'
import Toast from './components/Toast'
import TxModal from './components/TxModal'
import { NFT_ABI, MARKETPLACE_ABI, TRACKING_ABI, KARRAT_ABI, EIP712_DOMAIN, APPROVAL_TYPES } from './utils/constants'
import { getListings, addListing, removeListing, saveSignature, saveTransaction } from './utils/storage'
import './App.css'

const ADMIN_ADDRESS = import.meta.env.VITE_ADMIN_ADDRESS?.toLowerCase() || ''

function App() {
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [userAddress, setUserAddress] = useState(null)
  const [ethBalance, setEthBalance] = useState('0')
  const [karratBalance, setKarratBalance] = useState('0')
  
  const [contracts, setContracts] = useState({ nft: null, marketplace: null, tracking: null, karrat: null })
  const [contractAddresses] = useState({
    nft: import.meta.env.VITE_NFT_CONTRACT || '',
    marketplace: import.meta.env.VITE_MARKETPLACE_CONTRACT || '',
    tracking: import.meta.env.VITE_TRACKING_CONTRACT || '',
    karrat: import.meta.env.VITE_KARRAT_CONTRACT || ''
  })
  
  const [tiers, setTiers] = useState([])
  const [userBalances, setUserBalances] = useState({})
  const [listings, setListings] = useState([])
  const [trackedContracts, setTrackedContracts] = useState([])
  
  const [activeTab, setActiveTab] = useState('primary')
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [txModal, setTxModal] = useState({ show: false, status: '', message: '' })
  
  const isAdmin = userAddress?.toLowerCase() === ADMIN_ADDRESS

  // Load listings from JSON server
  const loadListings = async () => {
    const data = await getListings()
    setListings(data)
  }

  useEffect(() => {
    loadListings()
  }, [])

  // Load tiers
  const loadTiers = async (nftContract) => {
    const tierNames = ['Weapons', 'Armor', 'Consumables', 'Rare', 'Legendary']
    const loadedTiers = []
    
    for (const name of tierNames) {
      try {
        const info = await nftContract.getTokenInfo(name)
        if (info.tokenIds.length > 0) {
          loadedTiers.push({
            name,
            tokenIds: info.tokenIds.map(id => Number(id)),
            maxSupplies: info.maxSupplies.map(s => Number(s)),
            currentSupplies: info.currentSupplies.map(s => Number(s)),
            prices: info.prices.map(p => p.toString()),
            maxAmountsPerUser: info.maxAmountsPerUser.map(m => Number(m)),
            tierURI: info.tierURI
          })
        }
      } catch (e) {
        // Tier doesn't exist
      }
    }
    setTiers(loadedTiers)
  }

  // Load tiers on startup
  useEffect(() => {
    if (!contractAddresses.nft) return
    
    const init = async () => {
      try {
        const rpcUrl = import.meta.env.VITE_RPC_URL
        const rpcProvider = new ethers.JsonRpcProvider(rpcUrl)
        const nft = new ethers.Contract(contractAddresses.nft, NFT_ABI, rpcProvider)
        await loadTiers(nft)
        
        if (contractAddresses.tracking) {
          const tracking = new ethers.Contract(contractAddresses.tracking, TRACKING_ABI, rpcProvider)
          try {
            const tracked = await tracking.getAllDeployedContracts()
            setTrackedContracts(tracked)
          } catch (e) {
            console.log('Tracking error:', e.message)
          }
        }
      } catch (err) {
        console.error('Init error:', err)
      }
    }
    
    init()
  }, [contractAddresses.nft, contractAddresses.tracking])

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      showToast('Please install MetaMask', 'error')
      return
    }
    
    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum)
      await web3Provider.send("eth_requestAccounts", [])
      const web3Signer = await web3Provider.getSigner()
      const address = await web3Signer.getAddress()
      const bal = await web3Provider.getBalance(address)
      
      setProvider(web3Provider)
      setSigner(web3Signer)
      setUserAddress(address)
      setEthBalance(ethers.formatEther(bal))
      
      showToast('Wallet connected', 'success')
    } catch (err) {
      console.error(err)
      showToast('Failed to connect', 'error')
    }
  }

  // Initialize contracts after wallet connects
  useEffect(() => {
    if (!signer || !contractAddresses.nft) return
    
    const initContracts = async () => {
      try {
        const nft = new ethers.Contract(contractAddresses.nft, NFT_ABI, signer)
        const marketplace = contractAddresses.marketplace 
          ? new ethers.Contract(contractAddresses.marketplace, MARKETPLACE_ABI, signer)
          : null
        const tracking = contractAddresses.tracking
          ? new ethers.Contract(contractAddresses.tracking, TRACKING_ABI, signer)
          : null
        const karrat = contractAddresses.karrat
          ? new ethers.Contract(contractAddresses.karrat, KARRAT_ABI, signer)
          : null
        
        setContracts({ nft, marketplace, tracking, karrat })
        
        await loadTiers(nft)
        
        if (karrat && userAddress) {
          const kb = await karrat.balanceOf(userAddress)
          setKarratBalance(kb.toString())
        }
        if (tracking) {
          try {
            const tracked = await tracking.getAllDeployedContracts()
            setTrackedContracts(tracked)
          } catch (e) {
            console.log('Tracking error:', e.message)
          }
        }
      } catch (err) {
        console.error('Init contracts error:', err)
      }
    }
    
    initContracts()
  }, [signer, contractAddresses, userAddress])

  // Load user balances
  const loadUserBalances = useCallback(async () => {
    if (!contracts.nft || !userAddress || tiers.length === 0) return
    
    const balances = {}
    for (const tier of tiers) {
      for (const tokenId of tier.tokenIds) {
        try {
          const bal = await contracts.nft.balanceOf(userAddress, tokenId)
          balances[tokenId] = Number(bal)
        } catch {
          balances[tokenId] = 0
        }
      }
    }
    setUserBalances(balances)
  }, [contracts.nft, userAddress, tiers])

  useEffect(() => {
    loadUserBalances()
  }, [loadUserBalances])

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  const refreshData = async () => {
    if (contracts.nft) await loadTiers(contracts.nft)
    await loadUserBalances()
    if (contracts.karrat && userAddress) {
      const kb = await contracts.karrat.balanceOf(userAddress)
      setKarratBalance(kb.toString())
    }
    await loadListings()
  }

  useEffect(() => {
    window.refreshData = refreshData
    window.contracts = contracts
  }, [contracts])

  // Buy from primary sale
  const buyPrimary = async (tierName, tokenIds, amounts) => {
    if (!contracts.nft || !contracts.karrat) return
    
    setTxModal({ show: true, status: 'pending', message: 'Approving KARRAT...' })
    
    try {
      const tier = tiers.find(t => t.name === tierName)
      let totalPrice = BigInt(0)
      for (let i = 0; i < tokenIds.length; i++) {
        const idx = tier.tokenIds.indexOf(tokenIds[i])
        totalPrice += BigInt(tier.prices[idx]) * BigInt(amounts[i])
      }
      
      const allowance = await contracts.karrat.allowance(userAddress, contractAddresses.nft)
      if (allowance < totalPrice) {
        const approveTx = await contracts.karrat.approve(contractAddresses.nft, ethers.MaxUint256)
        await approveTx.wait()
      }
      
      setTxModal({ show: true, status: 'pending', message: 'Purchasing...' })
      
      const tx = await contracts.nft.buyNFT(tierName, tokenIds, amounts)
      await tx.wait()
      
      setTxModal({ show: true, status: 'success', message: 'Purchase complete!' })
      
      await loadTiers(contracts.nft)
      await loadUserBalances()
      
      const kb = await contracts.karrat.balanceOf(userAddress)
      setKarratBalance(kb.toString())
      
      setTimeout(() => setTxModal({ show: false, status: '', message: '' }), 2000)
      
    } catch (err) {
      console.error('Buy error:', err)
      setTxModal({ show: true, status: 'error', message: err.reason || err.message })
      setTimeout(() => setTxModal({ show: false, status: '', message: '' }), 3000)
    }
  }

  // Create listing
  const createListing = async (tokenId, amount, pricePerItem, deadline) => {
    if (!contracts.marketplace || !signer) return
    
    try {
      const nonce = await contracts.marketplace.nonces(contractAddresses.nft, tokenId, userAddress)
      const chainId = (await provider.getNetwork()).chainId
      
      const domain = {
        ...EIP712_DOMAIN,
        chainId: Number(chainId),
        verifyingContract: contractAddresses.marketplace
      }
      
      const priceWei = ethers.parseEther(pricePerItem.toString())
      
      const message = {
        seller: userAddress,
        nftContract: contractAddresses.nft,
        tokenId: BigInt(tokenId),
        amount: BigInt(amount),
        price: priceWei,
        nonce: BigInt(nonce),
        deadline: BigInt(deadline)
      }
      
      setTxModal({ show: true, status: 'pending', message: 'Sign the listing...' })
      
      const signature = await signer.signTypedData(domain, APPROVAL_TYPES, message)
      
      const listing = {
        seller: userAddress,
        nftContract: contractAddresses.nft,
        tokenId,
        amount,
        price: pricePerItem.toString(),
        priceWei: priceWei.toString(),
        nonce: Number(nonce),
        deadline,
        signature
      }
      
      await addListing(listing)
      await loadListings()
      
      saveSignature({ type: 'listing_created', ...listing })
      
      setTxModal({ show: true, status: 'success', message: 'Listing created!' })
      setTimeout(() => setTxModal({ show: false, status: '', message: '' }), 2000)
      
    } catch (err) {
      console.error('Create listing error:', err)
      setTxModal({ show: true, status: 'error', message: 'Failed to sign' })
      setTimeout(() => setTxModal({ show: false, status: '', message: '' }), 3000)
    }
  }

  // Buy from marketplace
  const buyFromListing = async (listing) => {
    if (!contracts.marketplace || !contracts.karrat) return
    
    setTxModal({ show: true, status: 'pending', message: 'Approving KARRAT...' })
    
    try {
      const totalPrice = BigInt(listing.priceWei) * BigInt(listing.amount)
      const fee = (totalPrice * 25n) / 1000n
      const totalNeeded = totalPrice + fee
      
      const allowance = await contracts.karrat.allowance(userAddress, contractAddresses.marketplace)
      if (allowance < totalNeeded) {
        const approveTx = await contracts.karrat.approve(contractAddresses.marketplace, ethers.MaxUint256)
        await approveTx.wait()
      }
      
      setTxModal({ show: true, status: 'pending', message: 'Purchasing...' })
      
      const tx = await contracts.marketplace.buyNFT(
        listing.nftContract,
        listing.tokenId,
        listing.amount,
        listing.priceWei,
        listing.deadline,
        listing.seller,
        listing.signature
      )
      await tx.wait()
      
      await removeListing(listing.id)
      await loadListings()
      
      setTxModal({ show: true, status: 'success', message: 'Purchase complete!' })
      
      await loadUserBalances()
      const kb = await contracts.karrat.balanceOf(userAddress)
      setKarratBalance(kb.toString())
      
      setTimeout(() => setTxModal({ show: false, status: '', message: '' }), 2000)
      
    } catch (err) {
      console.error('Buy listing error:', err)
      setTxModal({ show: true, status: 'error', message: err.reason || err.message })
      setTimeout(() => setTxModal({ show: false, status: '', message: '' }), 3000)
    }
  }

  // Cancel listing
  const cancelListing = async (listing) => {
    if (!contracts.marketplace) return
    
    setTxModal({ show: true, status: 'pending', message: 'Cancelling...' })
    
    try {
      const tx = await contracts.marketplace.delistToken(listing.nftContract, listing.tokenId)
      await tx.wait()
      
      await removeListing(listing.id)
      await loadListings()
      
      setTxModal({ show: true, status: 'success', message: 'Cancelled!' })
      setTimeout(() => setTxModal({ show: false, status: '', message: '' }), 2000)
      
    } catch (err) {
      console.error('Cancel error:', err)
      setTxModal({ show: true, status: 'error', message: err.reason || err.message })
      setTimeout(() => setTxModal({ show: false, status: '', message: '' }), 3000)
    }
  }

  // Add contract to tracking
  const addContractToTracking = async (contractAddress) => {
    if (!contracts.tracking) return
    
    setTxModal({ show: true, status: 'pending', message: 'Adding contract...' })
    
    try {
      const tx = await contracts.tracking.addNewContract(contractAddress)
      await tx.wait()
      
      const tracked = await contracts.tracking.getAllDeployedContracts()
      setTrackedContracts(tracked)
      
      setTxModal({ show: true, status: 'success', message: 'Contract added!' })
      setTimeout(() => setTxModal({ show: false, status: '', message: '' }), 2000)
      
    } catch (err) {
      console.error('Add contract error:', err)
      setTxModal({ show: true, status: 'error', message: err.reason || err.message })
      setTimeout(() => setTxModal({ show: false, status: '', message: '' }), 3000)
    }
  }

  const myListings = listings.filter(l => l.seller?.toLowerCase() === userAddress?.toLowerCase())

  return (
    <div className="app">
      <Header 
        userAddress={userAddress}
        ethBalance={ethBalance}
        karratBalance={karratBalance}
        onConnect={connectWallet}
        isAdmin={isAdmin}
      />
      
      <TabNav activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} />
      
      <main className="main-content">
        {activeTab === 'primary' && (
          <PrimaryStore tiers={tiers} onBuy={buyPrimary} userAddress={userAddress} />
        )}
        
        {activeTab === 'marketplace' && (
          <Marketplace listings={listings} userAddress={userAddress} onBuy={buyFromListing} onCancel={cancelListing} />
        )}
        
        {activeTab === 'inventory' && (
          <Inventory 
            tiers={tiers}
            balances={userBalances}
            userAddress={userAddress}
            onCreateListing={createListing}
            myListings={myListings}
            onCancelListing={cancelListing}
          />
        )}
        
        {activeTab === 'admin' && isAdmin && (
          <AdminPanel 
            trackedContracts={trackedContracts}
            onAddContract={addContractToTracking}
            contractAddresses={contractAddresses}
          />
        )}
      </main>
      
      {toast.show && <Toast message={toast.message} type={toast.type} />}
      {txModal.show && <TxModal status={txModal.status} message={txModal.message} />}
    </div>
  )
}

export default App
