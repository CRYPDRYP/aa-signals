# AA Signals API Deployment Status

**API URL:** https://signals.brobotapp.com  
**Network:** Base mainnet (eip155:8453)  
**Status:** ✅ **LIVE** — listed, online, payment-ready on x402-list.com  
**Last Updated:** Oct 7, 2026, 21:00 UTC

**Current payTo address (verified live from `/.well-known/x402` and the captured 402 payload on x402-list):** `0x9B1b09caD288D90b4A0AcE7cA3f67462c88B6a6d`

> This address superseded an earlier `0x4DBfdd49b1C57b8fF79E7C98De85cA1f705EE3f2` referenced in older internal notes/docs. The address returned live in the 402 response is always the source of truth for payment — never a hardcoded doc value, since it can rotate. x402-list's `/api/v1/changes` feed tracks `payto_changed` events if this needs auditing later.

---

## Deployment Checklist

### ✅ API Core
- [x] Service running on signals.brobotapp.com
- [x] Health endpoint responding (OK status)
- [x] x402 manifest at /.well-known/x402 (proper format)
- [x] 8 symbols configured (BTC, ETH, TAO, QNT, ZEC, DOGE, DOG, VVV)
- [x] Jev model integration live
- [x] Kraken market data feed connected
- [x] Base mainnet RPC configured

### ✅ Payment Gating (resolved — was a stale reading)
- [x] Signal endpoints returning HTTP 402 correctly (confirmed live Oct 7: `curl -i https://signals.brobotapp.com/v1/signal/BTC` → `HTTP/2 402`)
- [x] Payment routing to the live payTo address `0x9B1b09caD288D90b4A0AcE7cA3f67462c88B6a6d` (settled via Coinbase facilitator per x402-list's `settled_via` field)
- [ ] On-chain settlement proof spot-check for buyer identity (see Discovery & Indexing note below — unresolved)

### ✅ Blockchain Infrastructure
- [x] Payment address live: `0x9B1b09caD288D90b4A0AcE7cA3f67462c88B6a6d` (NOT the `0x4DBfdd49b1C57b8fF79E7C98De85cA1f705EE3f2` referenced in older docs — that value is stale/wrong, fixed throughout this repo Oct 7)
- [x] USDC balance tracked: $1.04 on Basescan as of Oct 7, 2026 21:00 UTC

### ✅ Discovery & Indexing — reconciled Oct 7, 2026
- [x] Listed on x402-list.com (slug: `aa-signals`), status: **online**, payment_ready: true, compliance grade A (14/14 checks)
- [x] Settlement tracking IS working — the "0 counted" reading in the Oct 5 version of this doc was stale/wrong, not a real blocker

**Two numbers exist and they measure different windows — report both, do not pick one:**
| Source | What it measures | Value as of 2026-10-07 |
|---|---|---|
| Our own `/api/revenue_status` | Calls settled since the last container rebuild (today) | 1 call, $0.05, last payment 19:40 UTC |
| x402-list.com directory (on-chain facilitator measurement, independent of our server) | All settlements since first listing | 13 tx, $1.00 all-time, 2 unique buyers (30d), last settlement Oct 5 03:42 UTC (harvester hasn't yet picked up today's $0.05 call) |

Both are real, neither is wrong — our own counter reset on the rebuild; x402-list's number is the durable on-chain-backed one and should be treated as the primary public figure going forward.

**UNRESOLVED — do not claim "real customers" until this is checked:** x402-list reports 2 unique buyers over the last 30 days (top buyer = 60% of volume). Public block explorers (Basescan/Blockscout) require a paid API key to pull the actual payer wallet list from this environment, so I could not independently confirm whether either of those 2 wallets is the team's own test wallet. Whoever holds the team's test wallet key should check it against the payer addresses before any external claim of "external paying customer" is made.

### 🟡 Performance & Reliability
- Uptime (24h): 72.73% (LOW - investigate routing)
- Avg response time: 278ms (acceptable)
- Symbol coverage: 8/8 live

**ACTION:** Check API logs for downtime pattern. May be health check frequency issue.

### ✅ Documentation
- [x] Complete README with getting started
- [x] x402 Protocol Guide
- [x] API Reference (all endpoints)
- [x] TypeScript examples (ethers.js)
- [x] Python examples (web3.py)
- [x] Contributing guide
- [x] GitHub issue templates

### ⏳ Future Deployments (Roadmap)

**Week 2 (Oct 12):**
- [ ] Publish signal backtest results
- [ ] Add position-aware hysteresis (/signals?current_side=long)
- [ ] Improve uptime to 99%+

**Week 3 (Oct 19):**
- [ ] Release TypeScript SDK (npm)
- [ ] Release Python SDK (PyPI)
- [ ] Batch settlement endpoint (/signals/batch)

**Week 4+ (Oct 26+):**
- [ ] Premium tier ($0.10/signal)
- [ ] Monthly subscription ($10/month)
- [ ] Webhook streaming endpoint

---

## Troubleshooting

### Signal Endpoints — RESOLVED, was a stale reading
As of Oct 7, 2026 `curl -i https://signals.brobotapp.com/v1/signal/BTC` returns `HTTP/2 402` with a proper `payment-required` header, as expected. The Oct 5 "404" note in earlier versions of this doc did not reflect current behavior — don't trust it without re-checking live.

### Settlements on x402-list — RESOLVED, was a stale reading
x402-list IS counting settlements: 13 tx / $1.00 all-time as of today's pull, first settlement 2026-09-27. The "$0 volume" note in earlier versions of this doc was stale. **Our own `/api/revenue_status` separately shows only 1 call/$0.05 because that counter reset on a container rebuild today — this is a different, narrower number from x402-list's on-chain-backed one, not a contradiction.** Report both when asked, never just one.

**Correct current API paths (the old `/api/services/aa-signals` REST path 404s — deprecated):**
- `GET https://x402-list.com/api/v1/services/aa-signals` — single service record (verified working 2026-10-07)
- `GET https://x402-list.com/api/v1/services?q=AA%20Signals` — free-text search, also returns our record
- `GET https://x402-list.com/api/v1/services/aa-signals/checks` — raw probe history
- `POST https://x402-list.com/api/v1/submit` — current submission endpoint (JSON body: url, email, service_name, description, website_url, endpoints[], notes)

---

## Health Checks

### Manual Health Check
```bash
curl https://signals.brobotapp.com/health
# {"service":"AA Signals","status":"ok","network":"eip155:8453","price":"$0.05"}
```

### Manifest Check
```bash
curl https://signals.brobotapp.com/.well-known/x402 | jq '.resources | length'
# 8
```

### Settlement Address Check
```bash
# Via Basescan (note: the free public endpoint now requires an API key —
# "deprecated V1 endpoint" / "upgrade your api plan" errors are expected without one)
curl "https://basescan.org/api?module=account&action=txlist&address=0x9B1b09caD288D90b4A0AcE7cA3f67462c88B6a6d"
```

---

## Deployment Contacts

**API Operations:** [TBD]  
**x402-list Support:** support@x402-list.com  
**Coinbase Bazaar:** [TBD - Workstream 5 to identify]  
**Jev AI Team:** [TBD]  

---

**Last Deployed:** Oct 4, 2026  
**Last Status Check:** Oct 5, 2026, 05:00 UTC  
**Deployed By:** Terrence L. Thomas (21 Million Publishing House)
