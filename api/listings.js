// Vercel Serverless Function for listings
// Uses Vercel KV or falls back to in-memory storage

let listings = [];

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json(listings);
  }

  if (req.method === 'POST') {
    const listing = req.body;
    listing.id = Date.now();
    listing.createdAt = Date.now();
    listings.push(listing);
    return res.status(201).json(listing);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
