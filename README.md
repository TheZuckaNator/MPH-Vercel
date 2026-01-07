# MPH NFT Marketplace

ERC-1155 NFT marketplace with tiered game inventory and EIP-712 signature-based listings.

## Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Terminal 1: Start Hardhat node
npm run node

# Terminal 2: Deploy contracts
npm run deploy

# Terminal 3: Start JSON server (for listings API)
npm run server

# Terminal 4: Start frontend
npm run dev
```

Open http://localhost:5173

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run node` | Start local Hardhat node |
| `npm run deploy` | Deploy contracts to localhost |
| `npm run server` | Start JSON server for listings API |
| `npm run fix-verifier` | Fix verifier approvals |
| `npm run mint-karrat` | Mint KARRAT to deployer |

## JSON Server (Listings API)

The marketplace uses a JSON server for storing listings. This provides simple CRUD operations:

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/listings` | Get all listings |
| POST | `/listings` | Create a new listing |
| DELETE | `/listings/:id` | Delete a listing |

### Data Structure

Listings are stored in `db.json`:

```json
{
  "listings": [
    {
      "id": 1704567890123,
      "seller": "0xf39F...",
      "nftContract": "0x8A79...",
      "tokenId": 1,
      "amount": 1,
      "price": "10",
      "priceWei": "10000000000000000000",
      "nonce": 0,
      "deadline": 1735689600,
      "signature": "0x...",
      "createdAt": 1704567890123
    }
  ]
}
```

### Local Development

JSON server runs on `http://localhost:3001` during development.

### Production (Vercel)

For Vercel deployment, the app uses serverless API routes in `/api/`:
- `api/listings.js` - GET/POST listings
- `api/listings/[id].js` - DELETE listing

**Note:** Vercel serverless functions use in-memory storage (listings reset on cold start). For persistent storage, integrate:
- Vercel KV (Redis)
- Vercel Postgres
- MongoDB Atlas
- Supabase

## Contracts

| Contract | Description |
|----------|-------------|
| **TieredGameInventory1155** | ERC-1155 NFT with tiered metadata |
| **MPHGameMarketplace1155** | Marketplace with EIP-712 signatures |
| **MPHAssetTracking** | Contract registry |
| **Verifier** | Address allowlist |

## Deploy to Vercel

1. Push to GitHub
2. Connect repo to Vercel
3. Set environment variables in Vercel dashboard:
   - `VITE_NFT_CONTRACT`
   - `VITE_MARKETPLACE_CONTRACT`
   - `VITE_KARRAT_CONTRACT`
   - `VITE_TRACKING_CONTRACT`
   - `VITE_VERIFIER_CONTRACT`
   - `VITE_ADMIN_ADDRESS`

## Test Accounts (Hardhat)

| Account | Address | Private Key |
|---------|---------|-------------|
| #0 (Admin) | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| #1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| #2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |

## Architecture

```
┌─────────────────┐     ┌──────────────────┐
│   React App     │────▶│   JSON Server    │
│   (Frontend)    │     │   (Listings DB)  │
└────────┬────────┘     └──────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│   Hardhat Node  │────▶│   Smart          │
│   (Blockchain)  │     │   Contracts      │
└─────────────────┘     └──────────────────┘
```

## Troubleshooting

### MetaMask shows wrong balance
1. MetaMask → Settings → Advanced → Clear activity tab data
2. Or remove/re-add Localhost 8545 network

### Contracts not loading
1. Make sure Hardhat node is running (`npm run node`)
2. Redeploy contracts (`npm run deploy`)
3. Clear Vite cache: `rm -rf node_modules/.vite`
4. Hard refresh browser: Cmd+Shift+R

### Marketplace purchase fails
Run `npm run fix-verifier` to approve contracts in verifier.
