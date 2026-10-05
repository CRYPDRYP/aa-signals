/**
 * AA Signals x402 Buyer Example (TypeScript)
 * 
 * Demonstrates how to call the AA Signals API with x402 payment via ethers.js
 * and a standard x402 client library.
 */

import { ethers } from 'ethers';
import { X402Client } from 'x402-ts'; // Or use your own implementation

const AA_SIGNALS_ENDPOINT = 'https://signals.brobotapp.com/v1/signal';
const FACILITATOR_URL = 'https://facilitator.example.com'; // Your x402 facilitator
const BASE_RPC = 'https://mainnet.base.org';

interface Signal {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  composite_score: number;
  regime: 'bullish' | 'bearish' | 'sideways';
  timestamp: number;
  kraken_verified: boolean;
}

async function main() {
  // 1. Set up wallet and provider
  const provider = new ethers.JsonRpcProvider(BASE_RPC);
  const privateKey = process.env.PRIVATE_KEY || '';
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`📊 AA Signals Buyer (x402)`);
  console.log(`Wallet: ${wallet.address}`);
  console.log(`---`);

  // 2. Initialize x402 client with facilitator
  const x402Client = new X402Client({
    facilitator: FACILITATOR_URL,
    wallet: wallet,
    debug: true, // See payment proofs in console
  });

  // 3. Fetch signals for multiple symbols
  const symbols = ['BTC', 'ETH', 'TAO', 'DOGE'];

  for (const symbol of symbols) {
    try {
      console.log(`\n🔄 Fetching ${symbol}...`);

      // First call will return HTTP 402 (payment required)
      // x402Client handles settlement and retries automatically
      const response = await x402Client.fetch(`${AA_SIGNALS_ENDPOINT}/${symbol}`);

      if (!response.ok) {
        console.error(`❌ ${symbol}: HTTP ${response.status}`);
        continue;
      }

      const signal: Signal = await response.json();

      // 4. Use the signal
      console.log(`✅ ${signal.symbol}:`);
      console.log(`   Action: ${signal.action.toUpperCase()}`);
      console.log(`   Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
      console.log(`   Score: ${signal.composite_score}/100`);
      console.log(`   Regime: ${signal.regime}`);
      console.log(`   Kraken Verified: ${signal.kraken_verified ? '✓' : '✗'}`);

      // 5. Example: Trade logic
      if (signal.confidence > 0.75 && signal.action === 'buy') {
        console.log(`   💰 Signal is strong — consider BUYING`);
      } else if (signal.confidence > 0.75 && signal.action === 'sell') {
        console.log(`   📉 Signal is strong — consider SELLING`);
      } else if (signal.action === 'hold') {
        console.log(`   ⏸️  HOLD — no action recommended`);
      }
    } catch (error) {
      console.error(`❌ Error fetching ${symbol}:`, error);
    }
  }
}

main().catch(console.error);
