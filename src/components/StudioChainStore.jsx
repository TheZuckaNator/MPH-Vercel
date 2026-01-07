import { useState } from 'react'
import { TOKEN_METADATA } from '../utils/constants'
import './PrimaryStore.css'

function StudioChainStore({ tiers, onBuy, userAddress }) {
  const [quantities, setQuantities] = useState({})

  const handleQuantityChange = (tokenId, value) => {
    setQuantities(prev => ({ ...prev, [tokenId]: Math.max(0, parseInt(value) || 0) }))
  }

  const handleBuy = (tierName, tokenId, price) => {
    const qty = quantities[tokenId] || 0
    if (qty <= 0) return
    onBuy(tierName, [tokenId], [qty], price)
  }

  const formatETH = (wei) => {
    const eth = parseFloat(wei) / 1e18
    return eth.toLocaleString(undefined, { maximumFractionDigits: 4 })
  }

  if (tiers.length === 0) {
    return (
      <div className="primary-store">
        <h2>🎮 StudioChain Store</h2>
        <p className="no-items">Loading items... Make sure contracts are deployed on StudioChain.</p>
      </div>
    )
  }

  return (
    <div className="primary-store">
      <h2>🎮 StudioChain Store</h2>
      <p className="store-subtitle">Purchase with native ETH</p>
      
      {tiers.map(tier => (
        <div key={tier.name} className="tier-section">
          <h3>{tier.name}</h3>
          <div className="items-grid">
            {tier.tokenIds.map((tokenId, idx) => {
              const meta = TOKEN_METADATA[tokenId] || { name: `Token #${tokenId}`, description: '', image: '' }
              const remaining = tier.maxSupplies[idx] - tier.currentSupplies[idx]
              const price = tier.prices[idx]
              
              return (
                <div key={tokenId} className="item-card">
                  {meta.image && <img src={meta.image} alt={meta.name} className="item-image" />}
                  <div className="item-info">
                    <h4>{meta.name}</h4>
                    <p className="item-desc">{meta.description}</p>
                    <p className="item-price">{formatETH(price)} ETH</p>
                    <p className="item-remaining">{remaining} / {tier.maxSupplies[idx]} remaining</p>
                    <p className="item-limit">Max {tier.maxAmountsPerUser[idx]} per wallet</p>
                  </div>
                  {userAddress ? (
                    <div className="item-actions">
                      <input
                        type="number"
                        min="0"
                        max={tier.maxAmountsPerUser[idx]}
                        value={quantities[tokenId] || ''}
                        onChange={(e) => handleQuantityChange(tokenId, e.target.value)}
                        placeholder="Qty"
                      />
                      <button 
                        onClick={() => handleBuy(tier.name, tokenId, price)}
                        disabled={!quantities[tokenId] || quantities[tokenId] <= 0 || remaining <= 0}
                      >
                        Buy
                      </button>
                    </div>
                  ) : (
                    <p className="connect-prompt">Connect wallet to buy</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default StudioChainStore