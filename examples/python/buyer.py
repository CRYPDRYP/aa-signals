"""
AA Signals x402 Buyer Example (Python)

Demonstrates how to call the AA Signals API with x402 payment using the
REAL, published `x402` PyPI package (Coinbase's official SDK) — not the
fictional `x402_py` this file used to import (pip install x402-py 404s,
confirmed against the live PyPI registry on 2026-10-07).

Install:
    pip install "x402[requests,evm]" eth-account

Package surface (from https://pypi.org/project/x402/, verified 2026-10-07):
    x402ClientSync            - sync payment client
    x402.mechanisms.evm.exact.ExactEvmScheme - EVM "exact" payment scheme
    x402.requests.x402_requests - wraps a requests.Session with auto-pay
"""

import os
from eth_account import Account
from x402 import x402ClientSync
from x402.mechanisms.evm.exact import ExactEvmScheme
from x402.requests import x402_requests

AA_SIGNALS_ENDPOINT = 'https://signals.brobotapp.com/v1/signal'


def main():
    # 1. Set up wallet (needs real USDC on Base mainnet — this is a live paid API)
    private_key = os.getenv('PRIVATE_KEY', '')
    if not private_key:
        raise RuntimeError('Set PRIVATE_KEY env var to a Base-mainnet wallet funded with USDC')
    account = Account.from_key(private_key)

    print("📊 AA Signals Buyer (x402)")
    print(f"Wallet: {account.address}")
    print("---")

    # 2. Build an x402 client registered for EVM "exact" payments on any eip155
    #    network, then wrap a requests.Session so 402s are paid automatically.
    client = x402ClientSync()
    client.register('eip155:*', ExactEvmScheme(signer=account))
    session = x402_requests(x402_client=client)

    # 3. Fetch signals for multiple symbols
    symbols = ['BTC', 'ETH', 'TAO', 'DOGE']

    for symbol in symbols:
        try:
            print(f"\n🔄 Fetching {symbol}...")

            response = session.get(f'{AA_SIGNALS_ENDPOINT}/{symbol}')

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
                print("   💰 Signal is strong — consider BUYING")
            elif signal['confidence'] > 0.75 and signal['action'] == 'sell':
                print("   📉 Signal is strong — consider SELLING")
            elif signal['action'] == 'hold':
                print("   ⏸️  HOLD — no action recommended")

        except Exception as error:
            print(f"❌ Error fetching {symbol}: {error}")


if __name__ == '__main__':
    main()
