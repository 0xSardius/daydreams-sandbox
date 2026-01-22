import { z } from "zod";
import { createAgent } from "@lucid-agents/core";
import { http } from "@lucid-agents/http";
import { payments, paymentsFromEnv } from "@lucid-agents/payments";
import { createAgentApp } from "@lucid-agents/hono";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Price for wisdom (in USD)
const WISDOM_PRICE = Number(process.env.WISDOM_PRICE_USD ?? 0.01);

/**
 * Create the Wisdom Agent
 *
 * x402 Concept: The agent uses the payments extension which implements
 * the x402 protocol. When a paid entrypoint is called without payment,
 * it automatically returns HTTP 402 with payment requirements.
 */
const agent = await createAgent({
  name: "Wisdom Agent",
  version: "1.0.0",
  description: "An AI agent that dispenses wisdom for a small fee via x402",
})
  .use(http())
  .use(
    payments({
      config: {
        ...paymentsFromEnv(),
      },
    })
  )
  .build();

// Create the Hono app from the agent
const { app, addEntrypoint } = await createAgentApp(agent);

/**
 * Free entrypoint: Check available topics
 *
 * x402 Concept: Not all entrypoints need to be paid.
 * This one is free - no payment required.
 */
addEntrypoint({
  key: "topics",
  description: "List available wisdom topics (free)",
  input: z.object({}),
  output: z.object({
    topics: z.array(z.string()),
    priceUsd: z.number(),
  }),
  async handler() {
    return {
      output: {
        topics: [
          "life",
          "success",
          "happiness",
          "relationships",
          "career",
          "creativity",
          "resilience",
          "purpose",
        ],
        priceUsd: WISDOM_PRICE,
      },
    };
  },
});

/**
 * Paid entrypoint: Get wisdom on a topic
 *
 * x402 Concept: This entrypoint requires payment.
 * The flow is:
 * 1. Client calls /wisdom without payment
 * 2. Server returns 402 with payment details
 * 3. Client signs payment and retries
 * 4. Server verifies via facilitator
 * 5. Server returns wisdom
 */
addEntrypoint({
  key: "wisdom",
  description: `Get AI-generated wisdom on a topic ($${WISDOM_PRICE})`,
  input: z.object({
    topic: z.string().describe("The topic you want wisdom about"),
    style: z
      .enum(["philosophical", "practical", "poetic", "humorous"])
      .default("philosophical")
      .describe("The style of wisdom delivery"),
  }),
  output: z.object({
    wisdom: z.string(),
    topic: z.string(),
    style: z.string(),
  }),
  // x402: Mark this entrypoint as requiring payment
  payment: {
    required: true,
    amount: WISDOM_PRICE,
    currency: "USD",
  },
  async handler({ input }) {
    const { topic, style } = input;

    // Generate wisdom using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a wise sage who dispenses wisdom in a ${style} style.
          Keep responses concise but profound (2-3 sentences).
          Be original - don't use common quotes.`,
        },
        {
          role: "user",
          content: `Share wisdom about: ${topic}`,
        },
      ],
      max_tokens: 150,
    });

    const wisdom =
      completion.choices[0]?.message?.content ??
      "The greatest wisdom is knowing that wisdom cannot always be summoned on demand.";

    return {
      output: {
        wisdom,
        topic,
        style,
      },
    };
  },
});

/**
 * Streaming entrypoint: Extended wisdom discourse
 *
 * x402 Concept: Streaming endpoints can also be paid.
 * The payment is verified before the stream begins.
 */
addEntrypoint({
  key: "discourse",
  description: `Get an extended wisdom discourse via streaming ($${WISDOM_PRICE * 2})`,
  input: z.object({
    topic: z.string(),
    questions: z.array(z.string()).max(3).describe("Up to 3 questions to explore"),
  }),
  streaming: true,
  payment: {
    required: true,
    amount: WISDOM_PRICE * 2,
    currency: "USD",
  },
  async stream({ input }, emit) {
    const { topic, questions } = input;

    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a wise philosopher giving a discourse on ${topic}.
          Address each question thoughtfully but concisely.
          Speak with gravitas but accessibility.`,
        },
        {
          role: "user",
          content: `Topic: ${topic}\n\nQuestions to address:\n${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`,
        },
      ],
      max_tokens: 500,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        emit({ chunk: content });
      }
    }
  },
});

// Log startup info
console.log(`
╔═══════════════════════════════════════════════════════════╗
║                     WISDOM AGENT                          ║
╠═══════════════════════════════════════════════════════════╣
║  Endpoints:                                               ║
║  • GET  /topics    - List topics (free)                   ║
║  • POST /wisdom    - Get wisdom ($${WISDOM_PRICE.toFixed(2)})                     ║
║  • POST /discourse - Extended discourse ($${(WISDOM_PRICE * 2).toFixed(2)})           ║
║                                                           ║
║  x402 Payment Flow:                                       ║
║  1. Call paid endpoint → receive 402 + payment details    ║
║  2. Sign payment with wallet                              ║
║  3. Retry with payment header → receive wisdom            ║
╚═══════════════════════════════════════════════════════════╝
`);

// Export for Bun.serve
export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch,
};
