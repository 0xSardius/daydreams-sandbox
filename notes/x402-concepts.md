# x402 Protocol Concepts

Learning notes on the x402 payment protocol as we build through the projects.

---

## What is x402?

x402 is an open standard (created by Coinbase) for **internet-native payments**. It uses HTTP status code `402 Payment Required` - a code reserved since 1999 but rarely used until now.

### The Core Idea

Instead of API keys + billing dashboards, payments happen **per-request** directly in HTTP:

```
Client: GET /wisdom
Server: 402 Payment Required + payment details
Client: GET /wisdom + payment signature
Server: 200 OK + wisdom response
```

---

## Key Components

### 1. The 402 Response

When you hit a paid endpoint without payment, you get:
- HTTP 402 status
- Payment requirements (amount, token, network)
- Accepted payment schemes

### 2. The Facilitator

A server that handles blockchain complexity:
- Verifies payment signatures
- Submits transactions to chain
- Manages RPC connections and gas
- Returns settlement confirmation

**You don't need to run your own blockchain node.**

### 3. Payment Schemes

- `exact` - Pay exact amount specified
- `upto` - Pay up to a max (for variable-cost resources)

### 4. Supported Networks

- **EVM**: Ethereum, Base, Polygon, etc.
- **SVM**: Solana

---

## Lucid Agents Abstraction

The `@lucid-agents/payments` package wraps x402:

```typescript
// Instead of raw x402 middleware...
import { payments } from '@lucid-agents/payments';

// You get a clean extension
const agent = createAgent({
  extensions: [payments({ /* config */ })],
});
```

---

## Project Learnings

### Project 01: Wisdom Agent

*Notes will be added as we build...*
