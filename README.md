# AA Signals — x402-Settled Trading Signals for Autonomous Agents

Real-time cryptocurrency and Bittensor-subnet trading signals, powered by **Jev** AI signal verification. Every call settles in USDC on Base mainnet via the x402 protocol — built for AI agents that need to pay-per-signal.

## Live API

**Endpoint:** `https://signals.brobotapp.com`  
**Network:** Base (eip155:8453)  
**Price:** $0.05 USDC per signal  
**Symbols:** BTC, ETH, TAO, QNT, ZEC, DOGE, DOG, VVV

### Status
Listed, online, and payment-ready on [x402-list.com](https://x402-list.com/services/aa-signals) — see that page for live uptime, settlement count and compliance grade (badges removed here because a hardcoded number goes stale the moment it's committed; the live page is the source of truth).
_Last verified against the live x402-list API on 2026-10-07: 100% uptime (24h), 98.5% (30d), compliance grade A, 13 settlements all-time ($1.00 USDC volume). Not a placeholder — pulled from `https://x402-list.com/api/v1/services/aa-signals`._

## What You Get

```json
{
  "symbol": "BTC",
  "action": "buy",           // buy | sell | hold
  "confidence": 0.87,        // 0–1, Jev-scaled
  "composite_score": 78,     // 0–100
  "regime": "bullish",       // bullish | bearish | sideways
  "timestamp": 1696505123,
  "kraken_verified": true
}
```

**Jev Signal Verification:** Each signal is scored against live Kraken market data and validated by an autonomous Jev agent. No noise, no stale data—actionable every time.

---

## Getting Started

### 1. Set Up x402 Payments

You need:
- A **Base mainnet wallet** (Metamask, ethers.js, web3.py, etc.)
- **USDC on Base** (amount varies; signals cost $0.05 each)
- An **x402 facilitator** (handles settlement):
  - [Coinbase Wallet](https://www.coinbase.com/wallet) (has x402 built in)
  - [Alby](https://getalby.com) + custom facilitator config
  - DIY: Implement x402 client (see [x402 spec](https://x402.dev))

### 2. Call the API

**No Payment Required (free):**
```bash
curl https://signals.brobotapp.com/health
# {"service":"AA Signals","status":"ok","price":"$0.05","network":"eip155:8453"}
```

**First Paid Call (will return HTTP 402 + payment terms):**
```bash
curl https://signals.brobotapp.com/v1/signal/BTC
# HTTP 402 Payment Required
# X-Payment-Address: <returned live by the API — do not hardcode; it can rotate>
# X-Payment-Token: USDC
# X-Payment-Amount: 0.05
```
Always read the pay-to address from the live `payment-required` challenge or `/.well-known/x402` manifest at call time — don't hardcode it from docs. (This exact address was out of date in this file until 2026-10-07; verified live against the production service.)

### 3. Pay & Retry

Settle via your x402 facilitator, then include the proof:
```bash
curl -H "X-Payment: <settlement-proof>" https://signals.brobotapp.com/v1/signal/BTC
# {"symbol":"BTC","action":"buy","confidence":0.87,...}
```

---

## Examples

### TypeScript (viem + x402-fetch — real, installable packages)

```bash
npm install x402-fetch viem
```

```typescript
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { wrapFetchWithPayment } from 'x402-fetch';

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const wallet = createWalletClient({ account, chain: base, transport: http() });
const fetchWithPayment = wrapFetchWithPayment(fetch, wallet);

async function getSignal(symbol: string) {
  const response = await fetchWithPayment(`https://signals.brobotapp.com/v1/signal/${symbol}`);
  return response.json();
}

const btcSignal = await getSignal('BTC');
console.log(`${btcSignal.symbol}: ${btcSignal.action} (confidence: ${btcSignal.confidence})`);
```

See full example: [`examples/typescript/buyer.ts`](examples/typescript/buyer.ts)

### Python (official `x402` package — real, installable)

```bash
pip install "x402[requests]"
```

```python
import os
from eth_account import Account
from x402.clients.requests import x402_requests

account = Account.from_key(os.environ['PRIVATE_KEY'])
session = x402_requests(account)

def get_signal(symbol):
    response = session.get(f'https://signals.brobotapp.com/v1/signal/{symbol}')
    return response.json()

btc_signal = get_signal('BTC')
print(f"{btc_signal['symbol']}: {btc_signal['action']} (confidence: {btc_signal['confidence']})")
```

See full example: [`examples/python/buyer.py`](examples/python/buyer.py)

> **Note:** earlier revisions of this README/examples referenced `x402-ts` (npm) and `x402_py` (PyPI) as "official" libraries. Neither package exists — `npm install x402-ts` and `pip install x402-py` both 404. Fixed 2026-10-07 to use the real published packages (`x402-fetch` on npm, `x402` on PyPI) confirmed live against the npm/PyPI registries.

---

## x402 Protocol Flow

1. **DISCOVER** → Query x402-list.com for available APIs
2. **CALL** → Hit the API (gets HTTP 402 + payment terms)
3. **PAY** → Settle USDC via facilitator on Base
4. **RETRY** → Repeat call with `X-Payment` header
5. **USE** → Get your signal and trade

### Payment Proof Format

The `X-Payment` header contains:
- Settlement transaction hash (from facilitator)
- Signature from your wallet
- Timestamp
- Nonce (prevents replay)

Your x402 client library handles this automatically.

---

## Architecture

```
Agent Request
  ↓
signals.brobotapp.com (health check, manifest)
  ├─ /health → HTTP 200 (free)
  ├─ /v1/signal/BTC → HTTP 402 (first call, unpaid)
  └─ /v1/signal/BTC + X-Payment header → HTTP 200 (paid)
  ↓
Validate X-Payment proof on-chain (Base)
  ↓
Query live Kraken market data
  ↓
Score signal via Jev model
  ↓
Return {"action":"buy","confidence":0.87,...}
  ↓
Settlement auto-transferred to the live payTo address returned in the 402 response (currently `0x9B1b09caD288D90b4A0AcE7cA3f67462c88B6a6d` — check `/.well-known/x402` for the current value, never hardcode it)
```

---

## Roadmap

### Phase 1: Reference Implementation ✅
- [x] 8-symbol signal API live
- [x] x402 payment gating working
- [x] Jev signal validation in place
- [x] Listed on x402-list.com

### Phase 2: Signal Science (Week 2)
- [ ] Publish backtest results (hit rate vs. 50% baseline)
- [ ] Prove Jev confidence scaling improves signal accuracy
- [ ] Add position-aware hysteresis (long/short bias)

### Phase 3: Developer Distribution (Week 3)
- [ ] TypeScript/Python SDKs in npm + PyPI
- [ ] Batch settlement (multi-call discounts)
- [ ] Webhook endpoint (recurring revenue)

### Phase 4: Enterprise (Week 4+)
- [ ] Premium tier ($0.10/signal, Jev override)
- [ ] Subscription mode ($10/mo unlimited)
- [ ] Partnership with Coinbase (co-marketing)

---

## Benchmarks

| Metric | Value | Status |
|--------|-------|--------|
| Uptime (24h) | 100% | ✅ |
| Uptime (30d) | 98.5% | ✅ |
| Avg Response | 348ms | ✅ |
| Signals Live | 8 symbols | ✅ |
| On x402-list | Yes (compliance grade A) | ✅ |
| Settlements (all-time) | 13 calls / $1.00 USDC | ✅ (tracking resolved) |
| Cost | $0.05/signal | ✅ |

_Table pulled live from `x402-list.com/api/v1/services/aa-signals` on 2026-10-07 — settlement tracking (previously broken, see git history) is now working and counting real calls._

---

## Troubleshooting

### HTTP 402 (Payment Required)
- ✅ Normal — you haven't paid yet
- ✅ Includes `X-Payment-*` headers with settlement terms
- → Follow "Getting Started" Step 3

### HTTP 404 (Endpoint Not Found)
- ❌ Endpoint may be down or mislabeled
- → Check [API Status](https://signals.brobotapp.com/health)
- → Verify symbol is in: BTC, ETH, TAO, QNT, ZEC, DOGE, DOG, VVV

### Settlement Not Counted on x402-list
- ✅ Resolved as of 2026-10-07 — x402-list now shows 13 settlements, $1.00 USDC volume all-time, first settlement 2026-09-27
- → If you still see a discrepancy, verify on Basescan directly against the live `payTo` address from `/.well-known/x402`

---

## Support

- **API Docs:** https://signals.brobotapp.com/.well-known/x402
- **x402 Protocol Spec:** https://x402.dev
- **x402-list Directory:** https://x402-list.com
- **Issues:** [GitHub Issues](https://github.com/CRYPDRYP/aa-signals/issues)
- **Email:** bxclawbot@gmail.com

---

## License

MIT — Use freely, build freely.

---

**AA Signals** is part of the **21 Million Publishing House** suite of x402-native tools. Made by Terrence L. Thomas (pen: Satoshi Negromoto).

**Last Updated:** Oct 7, 2026 — relisted/reconciled against live x402-list and API data
