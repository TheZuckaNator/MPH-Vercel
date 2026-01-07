import { useState } from 'react'
import { TIER_CONFIG, getTokenName, getTokenImage } from '../utils/constants'
import './Inventory.css'

function Inventory({ tiers, balances, userAddress, onCreateListing, myListings, onCancelListing }) {
  const [modal, setModal] = useState(null)
  const [price, setPrice] = useState('')
  const [amount, setAmount] = useState(1)
  const [days, setDays] = useState(7)
  
  if (!userAddress) {
    return (
      <div className="inventory">
        <div className="empty-state">
          <div className="empty-icon">🎒</div>
          <p>Connect wallet to view inventory</p>
        </div>
      </div>
    )
  }
  
  const ownedTokens = []
  for (const tier of tiers) {
    for (let i = 0; i < tier.tokenIds.length; i++) {
      const tokenId = tier.tokenIds[i]
      const balance = balances[tokenId] || 0
      if (balance > 0) {
        ownedTokens.push({ tokenId, balance, tierName: tier.name })
      }
    }
  }
  
  const openModal = (token) => {
    setModal(token)
    setPrice('')
    setAmount(1)
  }
  
  const handleList = () => {
    if (!price || parseFloat(price) <= 0) return
    const deadline = Math.floor(Date.now() / 1000) + (days * 24 * 60 * 60)
    onCreateListing(modal.tokenId, amount, parseFloat(price), deadline)
    setModal(null)
  }
  
  return (
    <div className="inventory">
      <h1>My Inventory</h1>
      
      {ownedTokens.length === 0 && myListings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>No items yet</p>
        </div>
      ) : (
        <>
          {ownedTokens.length > 0 && (
            <section className="inv-section">
              <h2>Owned ({ownedTokens.length})</h2>
              <div className="inv-grid">
                {ownedTokens.map(token => (
                  <div key={token.tokenId} className="inv-card">
                    <div className="inv-image">
                      <img src={getTokenImage(token.tokenId)} alt="" />
                      <span className="tier-badge" style={{ background: TIER_CONFIG[token.tierName]?.color }}>{token.tierName}</span>
                      <span className="balance-badge">x{token.balance}</span>
                    </div>
                    <div className="inv-details">
                      <h3>{getTokenName(token.tokenId)}</h3>
                      <button className="list-btn" onClick={() => openModal(token)}>List for Sale</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {myListings.length > 0 && (
            <section className="inv-section">
              <h2>Your Listings ({myListings.length})</h2>
              <div className="listings-table">
                {myListings.map(listing => (
                  <div key={listing.id} className="table-row">
                    <img src={getTokenImage(listing.tokenId)} alt="" />
                    <span>{getTokenName(listing.tokenId)}</span>
                    <span>x{listing.amount}</span>
                    <span className="price">{listing.price} KARRAT</span>
                    <button onClick={() => onCancelListing(listing)}>Cancel</button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
      
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Create Listing</h2>
            
            <div className="modal-item">
              <img src={getTokenImage(modal.tokenId)} alt="" />
              <div>
                <h3>{getTokenName(modal.tokenId)}</h3>
                <p>You own: {modal.balance}</p>
              </div>
            </div>
            
            <div className="form-group">
              <label>Amount</label>
              <input type="number" min="1" max={modal.balance} value={amount} onChange={e => setAmount(parseInt(e.target.value) || 1)} />
            </div>
            
            <div className="form-group">
              <label>Price per item (KARRAT)</label>
              <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
            </div>
            
            <div className="form-group">
              <label>Duration</label>
              <select value={days} onChange={e => setDays(parseInt(e.target.value))}>
                <option value={1}>1 Day</option>
                <option value={7}>7 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </div>
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setModal(null)}>Cancel</button>
              <button className="confirm-btn" onClick={handleList} disabled={!price}>Sign & List</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory
