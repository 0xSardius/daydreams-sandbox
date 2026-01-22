# Project 01: Wisdom Agent

A simple AI agent that dispenses wisdom in exchange for payment via x402 protocol.

## What You'll Learn

- **Lucid Agents basics**: Creating an agent with `createAgent()`
- **Entrypoints**: Defining typed API endpoints with Zod schemas
- **x402 Protocol**: How payments work at the HTTP level
- **Payments Extension**: Using `@lucid-agents/payments`

## x402 Concepts in This Project

```
┌─────────────────────────────────────────────────────────────┐
│                      x402 Payment Flow                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Client: GET /wisdom?topic=life                          │
│                    │                                         │
│                    ▼                                         │
│  2. Server: 402 Payment Required                            │
│     Headers: X-Payment-Required: {"amount": "0.01", ...}    │
│                    │                                         │
│                    ▼                                         │
│  3. Client: Signs payment with wallet                       │
│                    │                                         │
│                    ▼                                         │
│  4. Client: GET /wisdom?topic=life                          │
│     Headers: X-Payment: {signed payment data}               │
│                    │                                         │
│                    ▼                                         │
│  5. Server: Verifies payment via Facilitator                │
│                    │                                         │
│                    ▼                                         │
│  6. Server: 200 OK + wisdom response                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Setup

1. **Install dependencies**
   ```bash
   bun install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Run the agent**
   ```bash
   bun dev
   ```

4. **Test the endpoints**
   ```bash
   # Check agent info
   curl http://localhost:3000/.well-known/agent.json

   # List entrypoints
   curl http://localhost:3000/entrypoints

   # Request wisdom (will return 402 without payment)
   curl http://localhost:3000/wisdom?topic=life
   ```

## Project Structure

```
01-wisdom-agent/
├── src/
│   └── index.ts      # Agent definition + entrypoints
├── package.json
├── .env.example
└── README.md
```

## Next Steps

After completing this project:
- Try changing the price
- Add multiple wisdom "tiers" with different prices
- Move to Project 02: Multi-Tool Agent
