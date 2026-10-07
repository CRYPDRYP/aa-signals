# AA Signals API Reference

## Base URL
```
https://signals.brobotapp.com
```

## Endpoints

### Health Check (Free)
```
GET /health
```

**Response:**
```json
{
  "service": "AA Signals",
  "status": "ok",
  "network": "eip155:8453",
  "price": "$0.05",
  "live_signal_gated": false
}
```

---

### Get Signal (x402 Gated)
```
GET /v1/signal/{SYMBOL}
```

**Parameters:**
- `SYMBOL` (path): One of: BTC, ETH, TAO, QNT, ZEC, DOGE, DOG, VVV

**Optional Query Parameters:**
- `current_side=long|short` — Use position-aware hysteresis (future)

**First Call (Unpaid):**
```
HTTP 402 Payment Required

X-Payment-Address: 0x9B1b09caD288D90b4A0AcE7cA3f67462c88B6a6d  # current live value — verify against /.well-known/x402, don't trust a hardcoded doc
X-Payment-Token: USDC
X-Payment-Amount: 0.05
X-Payment-Network: eip155:8453
```

**Paid Call (With X-Payment Header):**
```
HTTP 200 OK

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

### Response Schema

| Field | Type | Description |
|-------|------|-------------|
| `symbol` | string | Asset symbol (BTC, ETH, etc.) |
| `action` | enum | buy \| sell \| hold |
| `confidence` | float | 0–1, Jev-scaled reliability score |
| `composite_score` | int | 0–100, aggregated signal strength |
| `regime` | enum | bullish \| bearish \| sideways |
| `timestamp` | int | Unix timestamp (seconds) |
| `kraken_verified` | bool | Signal verified against live Kraken data |

---

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | ✅ Signal returned |
| 400 | Bad Request | ❌ Invalid symbol or params |
| 402 | Payment Required | → Settle and retry with X-Payment |
| 404 | Not Found | ❌ Endpoint doesn't exist |
| 429 | Too Many Requests | ⏳ Rate limited; wait before retry |
| 500 | Server Error | ⚠️  Service temporarily down |

---

## Rate Limiting

No hard rate limit, but:
- Requests are metered per wallet address
- Heavy spam may trigger temporary 429 responses
- Plan for 100+ req/sec at peak times

---

## Headers

**Request:**
```
X-Payment: <base64-encoded-settlement-proof>
User-Agent: <your-agent-name>
```

**Response:**
```
X-Request-ID: <unique-id>
X-RateLimit-Remaining: <count>
X-Server: AA Signals v1
```

---

## Timeouts

- Connection timeout: 5s
- Read timeout: 10s
- Recommended: retry with exponential backoff

---

## Examples

### cURL (with x402 proof)
```bash
PAYMENT_PROOF="eyJmYWNpbGl0YXRvcjoXg..."
curl -H "X-Payment: $PAYMENT_PROOF" \
  https://signals.brobotapp.com/v1/signal/BTC
```

### jq (parse response)
```bash
curl -H "X-Payment: ..." https://signals.brobotapp.com/v1/signal/BTC | jq '.'
```

### Python
```python
import requests

headers = {'X-Payment': payment_proof}
response = requests.get(
  'https://signals.brobotapp.com/v1/signal/BTC',
  headers=headers
)
print(response.json())
```

---

## Changelog

### v1.0.0 (Oct 2026)
- 8-symbol API live
- x402 payment gating
- Jev signal validation
- Listed on x402-list.com
