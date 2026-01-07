// API URL - works with both local json-server and Vercel serverless
const API_URL = import.meta.env.PROD 
  ? '/api'  // Vercel serverless functions
  : 'http://localhost:3001';  // Local json-server

// Listings - fetched from API
export async function getListings() {
  try {
    const res = await fetch(`${API_URL}/listings`);
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch (err) {
    console.error('getListings error:', err);
    // Fallback to localStorage if API fails
    try {
      return JSON.parse(localStorage.getItem('mph_listings') || '[]');
    } catch {
      return [];
    }
  }
}

export async function addListing(listing) {
  try {
    const res = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listing)
    });
    if (!res.ok) throw new Error('Failed to add listing');
    const saved = await res.json();
    
    // Also save to localStorage as backup
    const local = JSON.parse(localStorage.getItem('mph_listings') || '[]');
    local.push(saved);
    localStorage.setItem('mph_listings', JSON.stringify(local));
    
    return saved;
  } catch (err) {
    console.error('addListing error:', err);
    // Fallback to localStorage
    const local = JSON.parse(localStorage.getItem('mph_listings') || '[]');
    const saved = { ...listing, id: Date.now(), createdAt: Date.now() };
    local.push(saved);
    localStorage.setItem('mph_listings', JSON.stringify(local));
    return saved;
  }
}

export async function removeListing(listingId) {
  try {
    await fetch(`${API_URL}/listings/${listingId}`, { method: 'DELETE' });
    
    // Also remove from localStorage
    const local = JSON.parse(localStorage.getItem('mph_listings') || '[]');
    const filtered = local.filter(l => l.id !== listingId);
    localStorage.setItem('mph_listings', JSON.stringify(filtered));
  } catch (err) {
    console.error('removeListing error:', err);
    // Fallback to localStorage
    const local = JSON.parse(localStorage.getItem('mph_listings') || '[]');
    const filtered = local.filter(l => l.id !== listingId);
    localStorage.setItem('mph_listings', JSON.stringify(filtered));
  }
}

// Local storage helpers (signatures and transactions stay local)
export function saveSignature(sigData) {
  const sigs = JSON.parse(localStorage.getItem('mph_signatures') || '[]');
  sigs.unshift({ ...sigData, timestamp: Date.now() });
  localStorage.setItem('mph_signatures', JSON.stringify(sigs.slice(0, 100)));
}

export function saveTransaction(tx) {
  const txs = JSON.parse(localStorage.getItem('mph_transactions') || '[]');
  txs.unshift({ ...tx, timestamp: Date.now() });
  localStorage.setItem('mph_transactions', JSON.stringify(txs.slice(0, 100)));
}

// Format helpers
export function formatAddress(addr) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function formatKarrat(wei) {
  const num = parseFloat(wei) / 1e18;
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
