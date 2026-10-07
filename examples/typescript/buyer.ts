/**
 * AA Signals x402 Buyer Example (TypeScript)
 *
 * Demonstrates how to call the AA Signals API with x402 payment using the
 * REAL, published `x402-fetch` + `viem` packages.
 *
 * npm install x402-fetch viem
 */

import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { wrapFetchWithPayment } from 'x402-fetch';

const AA_SIGNALS_ENDPOINT = 'https://signals.brobotapp.com/v1/signal';

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
  // 1. Set up wallet (needs real USDC on Base mainnet — this is a live paid API)
  const privateKey = process.env.PRIVATE_KEY as `0x${string}`;
  if (!privateKey) {
    throw new Error('Set PRIVATE_KEY env var to a Base-mainnet wallet funded with USDC');
  }
  const account = privateKeyToAccount(privateKey);
  const wallet = createWalletClient({ account, chain: base, transport: http() });

  console.log(`📊 AA Signals Buyer (x402)`);
  console.log(`Wallet: ${account.address}`);
  console.log(`---`);

  // 2. Wrap fetch with automatic x402 payment handling.
  //    Default max spend per call is 0.1 USDC — AA Signals is $0.05, well under it.
  const fetchWithPayment = wrapFetchWithPayment(fetch, wallet);

  // 3. Fetch signals for multiple symbols
  const symbols = ['BTC', 'ETH', 'TAO', 'DOGE'];

  for (const symbol of symbols) {
    try {
      console.log(`\n🔄 Fetching ${symbol}...`);

      // First call triggers an HTTP 402 internally; wrapFetchWithPayment signs
      // and retries automatically. No facilitator URL needed client-side —
      // AA Signals' server picks its own facilitator (Coinbase CDP).
      const response = await fetchWithPayment(`${AA_SIGNALS_ENDPOINT}/${symbol}`);

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
