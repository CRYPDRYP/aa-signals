"""
AA Signals x402 Buyer Example (Python)

Demonstrates how to call the AA Signals API with x402 payment via web3.py
and a standard x402 client library.
"""

import asyncio
import os
from web3 import Web3
from x402_py import X402Client

AA_SIGNALS_ENDPOINT = 'https://signals.brobotapp.com/v1/signal'
FACILITATOR_URL = 'https://facilitator.example.com'  # Your x402 facilitator
BASE_RPC = 'https://mainnet.base.org'

async def main():
    # 1. Set up wallet and provider
    w3 = Web3(Web3.HTTPProvider(BASE_RPC))
    private_key = os.getenv('PRIVATE_KEY', '')
    account = w3.eth.account.from_key(private_key)

    print(f"📊 AA Signals Buyer (x402)")
    print(f"Wallet: {account.address}")
    print("---")

    # 2. Initialize x402 client
    x402_client = X402Client(
        facilitator_url=FACILITATOR_URL,
        account=account,
        w3=w3,
        debug=True,  # See payment proofs in console
    )

    # 3. Fetch signals for multiple symbols
    symbols = ['BTC', 'ETH', 'TAO', 'DOGE']

    for symbol in symbols:
        try:
            print(f"\n🔄 Fetching {symbol}...")

            # First call will return HTTP 402 (payment required)
            # x402_client handles settlement and retries automatically
            response = await x402_client.fetch(f'{AA_SIGNALS_ENDPOINT}/{symbol}')

            if response.status_code != 200:
                print(f"❌ {symbol}: HTTP {response.status_code}")
                continue

            signal = response.json()

            # 4. Use the signal
            print(f"✅ {signal['symbol']}:")
            print(f"   Action: {signal['action'].upper()}")
            print(f"   Confidence: {signal['confidence'] * 100:.1f}%")
            print(f"   Score: {signal['composite_score']}/100")
            print(f"   Regime: {signal['regime']}")
            print(f"   Kraken Verified: {'✓' if signal['kraken_verified'] else '✗'}")

            # 5. Example: Trade logic
            if signal['confidence'] > 0.75 and signal['action'] == 'buy':
                print(f"   💰 Signal is strong — consider BUYING")
            elif signal['confidence'] > 0.75 and signal['action'] == 'sell':
                print(f"   📉 Signal is strong — consider SELLING")
            elif signal['action'] == 'hold':
                print(f"   ⏸️  HOLD — no action recommended")

        except Exception as error:
            print(f"❌ Error fetching {symbol}: {error}")

if __name__ == '__main__':
    asyncio.run(main())
