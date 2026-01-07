const hre = require("hardhat");
const fs = require("fs");

// ============================================
// PASTE ADDRESSES HERE TO MINT KARRAT TO
// ============================================
const MINT_KARRAT_TO = [
  "0x934c2B33563604B7C6C6bac86A9f28D31dc33713",
    "0x3EFD63ACe2b4a41b7ABe64A6e79324946A9c4360", 
    "0xFC49461F8fEbfeEDb41b448Ba2d791f9ac597913",
    "0x1CD7ce26d878b002B23d20f447E068974dfdfe8e",
    "0xFafD6c75Afe86bAcaAb7d959aBC1607372b08DC1",
    "0x1CD7ce26d878b002B23d20f447E068974dfdfe8e"

];

const KARRAT_AMOUNT = "100000"; // Amount per address
// ============================================

async function main() {
  console.log("\n==============================================");
  console.log("  MY PET HOOLIGAN - FULL SYSTEM DEPLOYMENT");
  console.log("==============================================\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("");

  // 1. Deploy MockKARRAT
  console.log("1. Deploying MockKARRAT (ERC20)...");
  const MockKARRAT = await hre.ethers.getContractFactory("MockKARRAT", deployer);
  const karrat = await MockKARRAT.deploy();
  await karrat.waitForDeployment();
  const karratAddress = await karrat.getAddress();
  console.log("   KARRAT:", karratAddress);

  // Mint to deployer
  await karrat.mint(deployer.address, hre.ethers.parseEther("1000000"));
  console.log("   Minted 1,000,000 KARRAT to Deployer");

  // 2. Deploy Verifier
  console.log("\n2. Deploying Verifier...");
  const VerifierFactory = await hre.ethers.getContractFactory("Verifier", deployer);
  const verifier = await VerifierFactory.deploy(deployer.address, deployer.address);
  await verifier.waitForDeployment();
  const verifierAddress = await verifier.getAddress();
  console.log("   Verifier:", verifierAddress);

  // 3. Deploy MPHAssetTracking
  console.log("\n3. Deploying MPHAssetTracking...");
  const MPHAssetTracking = await hre.ethers.getContractFactory("MPHAssetTracking", deployer);
  const tracking = await MPHAssetTracking.deploy(
    verifierAddress,
    deployer.address,
    deployer.address
  );
  await tracking.waitForDeployment();
  const trackingAddress = await tracking.getAddress();
  console.log("   Tracking:", trackingAddress);

  // Grant tracking VERIFIER_ROLE
  const VERIFIER_ROLE = await verifier.VERIFIER_ROLE();
  await verifier.grantRole(VERIFIER_ROLE, trackingAddress);
  console.log("   Granted VERIFIER_ROLE to tracking");

  // 4. Deploy TieredGameInventory1155
  console.log("\n4. Deploying TieredGameInventory1155...");
  
  const config = {
    royaltyPercentage: 250,
    royaltyReceiver: deployer.address
  };
  
  const addresses = {
    admin: deployer.address,
    operator: deployer.address,
    pool: deployer.address,
    verifierAddress: verifierAddress,
    karratCoin: karratAddress
  };
  
  const deploymentTiers = [
    {
      name: "Weapons",
      tierURI: "https://api.mypethooligan.com/weapons/",
      initialSupplies: [100, 100, 100],
      maxAmountsPerUser: [5, 5, 5],
      prices: [
        hre.ethers.parseEther("10"),
        hre.ethers.parseEther("15"),
        hre.ethers.parseEther("20")
      ]
    },
    {
      name: "Armor",
      tierURI: "https://api.mypethooligan.com/armor/",
      initialSupplies: [50, 50, 50],
      maxAmountsPerUser: [3, 3, 3],
      prices: [
        hre.ethers.parseEther("20"),
        hre.ethers.parseEther("25"),
        hre.ethers.parseEther("30")
      ]
    },
    {
      name: "Consumables",
      tierURI: "https://api.mypethooligan.com/consumables/",
      initialSupplies: [500, 500, 500],
      maxAmountsPerUser: [20, 20, 20],
      prices: [
        hre.ethers.parseEther("5"),
        hre.ethers.parseEther("5"),
        hre.ethers.parseEther("5")
      ]
    },
    {
      name: "Rare",
      tierURI: "https://api.mypethooligan.com/rare/",
      initialSupplies: [25, 25],
      maxAmountsPerUser: [2, 2],
      prices: [
        hre.ethers.parseEther("50"),
        hre.ethers.parseEther("75")
      ]
    },
    {
      name: "Legendary",
      tierURI: "https://api.mypethooligan.com/legendary/",
      initialSupplies: [10],
      maxAmountsPerUser: [1],
      prices: [hre.ethers.parseEther("100")]
    }
  ];

  const TieredGameInventory = await hre.ethers.getContractFactory("TieredGameInventory1155", deployer);
  const nft = await TieredGameInventory.deploy(config, addresses, deploymentTiers);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("   NFT Contract:", nftAddress);

  // Link NFT to tracking
  await nft.setMPHAssetTracking(trackingAddress);
  console.log("   Set tracking on NFT");
  
  // Add NFT to tracking
  await tracking.addNewContract(nftAddress);
  console.log("   Added NFT to tracking");

  // Print tier token IDs
  for (const tier of deploymentTiers) {
    const tokenIds = await nft.getTierTokenIds(tier.name);
    console.log(`   ${tier.name}: Token IDs [${tokenIds.join(", ")}]`);
  }

  // 5. Deploy MPHGameMarketplace1155
  console.log("\n5. Deploying MPHGameMarketplace1155...");
  const Marketplace = await hre.ethers.getContractFactory("MPHGameMarketplace1155", deployer);
  const marketplace = await Marketplace.deploy(
    verifierAddress,
    deployer.address,
    deployer.address,
    karratAddress
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("   Marketplace:", marketplaceAddress);

  await marketplace.setFeePerMille(25);
  console.log("   Fee set to 2.5%");

  // 6. Approve in verifier
  console.log("\n6. Setting up verifier approvals...");
  await verifier.setAllowedAddress(marketplaceAddress, true);
  console.log("   Marketplace approved");
  await verifier.setAllowedAddress(nftAddress, true);
  console.log("   NFT contract approved");

  // 7. Mint KARRAT to test addresses
  if (MINT_KARRAT_TO.length > 0) {
    console.log("\n7. Minting KARRAT to test addresses...");
    for (const addr of MINT_KARRAT_TO) {
      if (hre.ethers.isAddress(addr)) {
        const tx = await karrat.mint(addr, hre.ethers.parseEther(KARRAT_AMOUNT));
        await tx.wait();
        console.log(`   ✅ ${addr} - ${KARRAT_AMOUNT} KARRAT`);
      } else {
        console.log(`   ❌ Invalid: ${addr}`);
      }
    }
  }

  // Save to .env
  const envConfig = {
    VITE_ADMIN_ADDRESS: deployer.address,
    VITE_TRACKING_CONTRACT: trackingAddress,
    VITE_MARKETPLACE_CONTRACT: marketplaceAddress,
    VITE_NFT_CONTRACT: nftAddress,
    VITE_KARRAT_CONTRACT: karratAddress,
    VITE_VERIFIER_CONTRACT: verifierAddress
  };

  // Preserve existing env vars
  let existingEnv = {};
  try {
    const existing = fs.readFileSync(".env", "utf8");
    existing.split("\n").forEach(line => {
      const [key, value] = line.split("=");
      if (key && value && !key.startsWith("VITE_")) {
        existingEnv[key] = value;
      }
    });
  } catch {}

  const fullEnv = { ...existingEnv, ...envConfig };
  const envContent = Object.entries(fullEnv).map(([k, v]) => `${k}=${v}`).join("\n");
  fs.writeFileSync(".env", envContent);

  console.log("\n" + "=".repeat(50));
  console.log("DEPLOYMENT COMPLETE!");
  console.log("=".repeat(50));
  
  console.log("\nContract Addresses:");
  console.log("-".repeat(50));
  Object.entries(envConfig).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
  });

  console.log("\n.env file updated!");
  console.log("\nRun: npm run dev");
  console.log("=".repeat(50) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });