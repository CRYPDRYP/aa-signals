# x402 Protocol Guide for AA Signals

The x402 protocol is the **HTTP 402 Payment Required** standard for micropayments. It's designed for APIs that charge per call.

## How x402 Works

### 1. Discovery (Free)
You can query x402-list.com to find all available x402 APIs:

```bash
curl https://x402-list.com/api/v1/services
```

Each service has:
- Endpoint URL
- Price (in USDC)
- Network (Base, Solana, Ethereum, etc.)
- Facilitators (who handles settlement)

### 2. First Call (402 Response)
When you call an x402 API without payment proof:

```bash
curl https://signals.brobotapp.com/v1/signal/BTC
```

Response:
```
HTTP 402 Payment Required

X-Payment-Address: 0x9B1b09caD288D90b4A0AcE7cA3f67462c88B6a6d  # current live value — verify against /.well-known/x402, don't trust a hardcoded doc
X-Payment-Token: USDC
X-Payment-Amount: 0.05
X-Payment-Network: eip155:8453
X-Payment-Facilitators: [facilitator-1, facilitator-2]
```

### 3. Settlement
You use an **x402 facilitator** to settle the payment:

1. Call the facilitator with your private key
2. Facilitator sends USDC to the API's payment address
3. Facilitator returns a settlement proof (transaction hash + signature)

Example facilitators:
- **Coinbase Wallet** — Built-in x402 support
- **Alby** — Lightning + on-chain x402
- **DIY** — Implement your own with ethers.js

### 4. Proof & Retry
Include the settlement proof in your retry:

```bash
curl -H "X-Payment: <base64-encoded-proof>" https://signals.brobotapp.com/v1/signal/BTC
```

The API validates the proof and returns data:

```json
{
  "symbol": "BTC",
  "action": "buy",
  "confidence": 0.87,
  "composite_score": 78,
  "regime": "bullish",
  "timestamp": 1696505123,
  "kraken_verified": true
}
```

---

## Proof Format

The `X-Payment` header is a **base64-encoded** object containing:

```json
{
  "facilitator": "https://facilitator.example.com",
  "settlement_tx": "0x1234567890...",
  "wallet_address": "0x...",
  "signature": "0x...",
  "timestamp": 1696505123,
  "nonce": "random-string-to-prevent-replay"
}
```

Your client library handles encoding/decoding. Use the real published packages: `x402-fetch` (npm, pairs with `viem`) for TypeScript, or `x402` (PyPI, `pip install "x402[requests,evm]"`) for Python — see `examples/` in this repo. (Earlier revisions of this doc referenced `x402-ts`/`x402-py`, which don't exist on npm/PyPI; fixed 2026-10-07.)

---

## Cost Breakdown

| Item | Cost |
|------|------|
| Single Signal | $0.05 USDC |
| 100 Signals | $5.00 USDC |
| 1,000 Signals | $50.00 USDC |
| Premium Tier (planned) | $0.10/signal |
| Monthly Subscription (planned) | $10.00 USDC |

---

## Settlement Verification (For Operators)

If you're running the AA Signals API, here's how to verify settlements:

```python
from web3 import Web3

w3 = Web3(Web3.HTTPProvider('https://mainnet.base.org'))

# Your payment address — verify live via /.well-known/x402, don't hardcode
payment_address = '0x9B1b09caD288D90b4A0AcE7cA3f67462c88B6a6d'

# Check balance
balance = w3.eth.get_balance(payment_address)
print(f"USDC Balance: {balance / 1e6} USDC")

# Get transaction history
# (Use Basescan API or parse events from USDC contract)
```

---

## Multi-Symbol Batch Settlement (Future)

Planned feature: pay once for multiple symbols.

```bash
curl -H "X-Payment: <proof>" \
  'https://signals.brobotapp.com/v1/signals?symbols=BTC,ETH,TAO'
```

Response:
```json
{
  "batch_id": "batch_123",
  "signals": [
    {"symbol": "BTC", "action": "buy", ...},
    {"symbol": "ETH", "action": "sell", ...},
    {"symbol": "TAO", "action": "hold", ...}
  ]
}
```

---

## FAQ

**Q: Do I need to settle for every call?**  
A: Yes, currently. Future versions may support bulk settlement or subscriptions.

**Q: Can I use my own facilitator?**  
A: Yes, if you implement the x402 spec. See [x402.dev](https://x402.dev) for details.

**Q: Is there a testnet?**  
A: AA Signals is live on Base mainnet only (for real trading). But you can test on Base Sepolia with fake USDC.

**Q: What happens if settlement fails?**  
A: The API returns HTTP 402 again with updated payment terms. You can retry.

**Q: Can AI agents use this?**  
A: Yes! That's the whole point. Any bot with a wallet and USDC can call AA Signals.

---

**Learn More:** https://x402.dev
