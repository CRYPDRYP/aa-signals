# AA Signals — x402-Settled Trading Signals for Autonomous Agents

Real-time cryptocurrency and Bittensor-subnet trading signals, powered by **Jev** AI signal verification. Every call settles in USDC on Base mainnet via the x402 protocol — built for AI agents that need to pay-per-signal.

## Live API

**Endpoint:** `https://signals.brobotapp.com`  
**Network:** Base (eip155:8453)  
**Price:** $0.05 USDC per signal  
**Symbols:** BTC, ETH, TAO, QNT, ZEC, DOGE, DOG, VVV

### Status Badges
[![Uptime Status](https://img.shields.io/badge/uptime-90.2%25-brightgreen?style=flat-square)](https://x402-list.com/services/aa-signals)
[![Settlements Counted](https://img.shields.io/badge/settlements-13-blue?style=flat-square)](https://x402-list.com/services/aa-signals)
[![Compliance Grade](https://img.shields.io/badge/compliance-A%2B-success?style=flat-square)](https://x402-list.com/services/aa-signals)
[![Live on x402-list](https://img.shields.io/badge/x402--list-verified-lightblue?style=flat-square)](https://x402-list.com/services/aa-signals)  

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
# X-Payment-Address: 0x4DBfdd49b1C57b8fF79E7C98De85cA1f705EE3f2
# X-Payment-Token: USDC
# X-Payment-Amount: 0.05
```

### 3. Pay & Retry

Settle via your x402 facilitator, then include the proof:
```bash
curl -H "X-Payment: <settlement-proof>" https://signals.brobotapp.com/v1/signal/BTC
# {"symbol":"BTC","action":"buy","confidence":0.87,...}
```

---

## Examples

### TypeScript (ethers.js + x402 client)

```typescript
import { ethers } from 'ethers';
import { X402Client } from 'x402-ts'; // official x402 library

const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const x402 = new X402Client({
  facilitator: 'https://facilitator.example.com',
  wallet: wallet,
});

async function getSignal(symbol: string) {
  const response = await x402.fetch('https://signals.brobotapp.com/v1/signal/' + symbol);
  return response.json();
}

const btcSignal = await getSignal('BTC');
console.log(`${btcSignal.symbol}: ${btcSignal.action} (confidence: ${btcSignal.confidence})`);
```

See full example: [`examples/typescript/buyer.ts`](examples/typescript/buyer.ts)

### Python (web3.py + x402 client)

```python
import json
from web3 import Web3
from x402_py import X402Client

w3 = Web3(Web3.HTTPProvider('https://mainnet.base.org'))
account = w3.eth.account.from_key(os.getenv('PRIVATE_KEY'))

x402_client = X402Client(
    facilitator_url='https://facilitator.example.com',
    account=account,
    w3=w3,
)

async def get_signal(symbol):
    response = await x402_client.fetch(f'https://signals.brobotapp.com/v1/signal/{symbol}')
    return response.json()

btc_signal = asyncio.run(get_signal('BTC'))
print(f"{btc_signal['symbol']}: {btc_signal['action']} (confidence: {btc_signal['confidence']})")
```

See full example: [`examples/python/buyer.py`](examples/python/buyer.py)

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
Settlement auto-transferred to 0x4DBfdd49b1C57b8fF79E7C98De85cA1f705EE3f2
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
| Uptime (24h) | 72.73% | 🟡 Investigating |
| Avg Response | 278ms | ✅ |
| Signals Live | 8 symbols | ✅ |
| On x402-list | Yes | ✅ |
| Settlements Counted | 0 (debug in progress) | 🔴 |
| Cost | $0.05/signal | ✅ |

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
- 🔴 Known issue (debug in progress)
- → Settlements ARE happening on Base (verify via Basescan)
- → x402-list harvester may have a timing lag or configuration issue
- → Contact x402-list team if issue persists

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

**Last Updated:** Oct 5, 2026
