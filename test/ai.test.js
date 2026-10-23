import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  chatWithAssistant,
  generatePosterWithGemini,
  DEFAULT_MODEL,
  FALLBACK_MODEL,
} from "../src/services/llm.service.js";
import {
  buildEventsSummary,
  buildChatSystemPrompt,
  buildActiveEventContext,
  fenceSafe,
} from "../src/utils/promptBuilder.js";

describe("AI Chat Assistant (chatWithAssistant)", () => {
  test("returns notice when AI chat is not configured", async () => {
    const reply = await chatWithAssistant("Hello", [], "", { clientContext: null });
    assert.match(reply, /AI chat is not configured on this server/);
  });

  test("generates response with valid client context and history", async () => {
    const calls = [];
    const mockCtx = {
      model: DEFAULT_MODEL,
      ai: {
        models: {
          generateContent: async (params) => {
            calls.push(params);
            return { text: "Here is your customized wedding planning advice." };
          },
        },
      },
    };

    const history = [
      { role: "user", content: "I need help with my wedding." },
      { role: "assistant", content: "Sure, let me know what you need." },
    ];
    const reply = await chatWithAssistant("What is my budget?", history, "Event 1: Wedding", {
      clientContext: mockCtx,
    });

    assert.equal(reply, "Here is your customized wedding planning advice.");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].model, DEFAULT_MODEL);
    assert.match(calls[0].config.systemInstruction, /Event 1: Wedding/);
    assert.equal(calls[0].contents.length, 3); // 2 history + 1 new message
  });

  test("retries with fallback model on 503 error", async () => {
    const calls = [];
    const mockCtx = {
      model: DEFAULT_MODEL,
      ai: {
        models: {
          generateContent: async (params) => {
            calls.push(params);
            if (params.model === DEFAULT_MODEL) {
              const err = new Error("High demand");
              err.status = 503;
              throw err;
            }
            return { text: "Fallback model reply." };
          },
        },
      },
    };

    const reply = await chatWithAssistant("Help me", [], "", { clientContext: mockCtx });
    assert.equal(reply, "Fallback model reply.");
    assert.equal(calls.length, 2);
    assert.equal(calls[0].model, DEFAULT_MODEL);
    assert.equal(calls[1].model, FALLBACK_MODEL);
  });

  test("returns courteous error message when LLM call throws", async () => {
    const mockCtx = {
      model: DEFAULT_MODEL,
      ai: {
        models: {
          generateContent: async () => {
            const err = new Error("Rate limit exceeded");
            err.status = 429;
            throw err;
          },
        },
      },
    };

    const reply = await chatWithAssistant("Hello", [], "", { clientContext: mockCtx });
    assert.match(reply, /I apologize, but the AI service is currently unavailable/);
    assert.match(reply, /AI service is busy/);
  });

  test("returns default string when assistant response is blank", async () => {
    const mockCtx = {
      model: DEFAULT_MODEL,
      ai: {
        models: {
          generateContent: async () => ({ text: "   " }),
        },
      },
    };

    const reply = await chatWithAssistant("Hello", [], "", { clientContext: mockCtx });
    assert.equal(reply, "(No response from assistant.)");
  });
});

describe("Prompt Builder & Event Summary utilities", () => {
  test("fenceSafe removes angle brackets to prevent prompt injection", () => {
    assert.equal(fenceSafe("<script>alert(1)</script>"), "scriptalert(1)/script");
    assert.equal(fenceSafe("Clean text"), "Clean text");
  });

  test("buildEventsSummary formats events or returns fallback message", () => {
    assert.equal(buildEventsSummary([]), "(No saved events yet.)");
    assert.equal(buildEventsSummary(null), "(No saved events yet.)");

    const events = [
      {
        input: { eventName: "Gala 2026", eventType: "community", date: "2026-10-15", guestCount: 150, budget: 5000, currency: "USD" },
        plan: { budget: { tier: "moderate" } },
      },
    ];
    const summary = buildEventsSummary(events);
    assert.match(summary, /Event 1: community — "Gala 2026"/);
    assert.match(summary, /Budget: 5000 USD/);
    assert.match(summary, /Guests: 150/);
  });

  test("buildChatSystemPrompt injects events context into system role", () => {
    const prompt = buildChatSystemPrompt("Event 1: Birthday");
    assert.match(prompt, /You are a friendly, practical event-planning assistant/);
    assert.match(prompt, /Event 1: Birthday/);
  });

  test("buildActiveEventContext builds real-time financial, task, and vendor status", () => {
    assert.equal(buildActiveEventContext(null), "");

    const mockEv = {
      input: { eventName: "Grand Wedding", eventType: "wedding", date: "2026-11-20", budget: 25000, currency: "USD" },
      plan: { summary: { daysToGo: 100 } },
    };
    const mockMetrics = {
      budget: { totalBudget: 25000, totalActualCost: 12000, remainingBudget: 13000, currency: "USD" },
      tasks: { total: 10, pending: 4, overdue: 1 },
      vendors: { total: 6, booked: 3, pending: 3 },
      guests: { attending: 80, totalInvited: 120 },
    };

    const activeCtx = buildActiveEventContext(mockEv, mockMetrics);
    assert.match(activeCtx, /ACTIVE EVENT IN FOCUS/);
    assert.match(activeCtx, /Grand Wedding/);
    assert.match(activeCtx, /Actual Spent: 12000 USD/);
    assert.match(activeCtx, /1 OVERDUE/);
    assert.match(activeCtx, /3 booked \/ 3 pending/);
    assert.match(activeCtx, /ACTIONABLE RECOMMENDATIONS FORMAT/);

    const fullPrompt = buildChatSystemPrompt("Event 1: Birthday", activeCtx);
    assert.match(fullPrompt, /ACTIVE EVENT IN FOCUS/);
    assert.match(fullPrompt, /Event 1: Birthday/);
  });
});

describe("AI Poster Studio (generatePosterWithGemini)", () => {
  test("returns error when API key is unconfigured and no aiClient is provided", async () => {
    const originalGeminiKey = process.env.GEMINI_API_KEY;
    const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    try {
      const res = await generatePosterWithGemini({
        title: "Summer Gala",
        subtitle: "Annual Fundraiser",
        date: "2026-07-20",
        location: "Community Center",
      });
      assert.match(res.error, /GEMINI_API_KEY is not configured/);
    } finally {
      if (originalGeminiKey) process.env.GEMINI_API_KEY = originalGeminiKey;
      if (originalAnthropicKey) process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
    }
  });

  test("generates and cleans SVG poster using mock aiClient", async () => {
    const rawSvg = `\`\`\`xml
<svg width="800" height="1120">
  <rect width="800" height="1120" fill="#111" />
  <text x="400" y="300">Summer Gala</text>
</svg>
\`\`\``;

    const mockAi = {
      models: {
        generateContent: async () => ({ text: rawSvg }),
      },
    };

    const res = await generatePosterWithGemini({
      title: "Summer Gala",
      subtitle: "Annual Fundraiser",
      date: "2026-07-20",
      location: "Community Center",
      style: "modern",
      aiClient: mockAi,
      engine: "svg",
    });

    assert.equal(res.type, "svg");
    assert.ok(res.data.includes("<svg"));
    assert.ok(res.data.includes("Summer Gala"));
    assert.ok(res.data.includes('viewBox="0 0 800 1120"'));
    assert.ok(!res.data.includes("```"));
  });

  test("generates raster image when engine is set to 'flux'", async () => {
    const origFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      headers: new Headers({ "content-type": "image/jpeg" }),
      arrayBuffer: async () => Buffer.from("fake-image-bytes"),
    });

    try {
      const res = await generatePosterWithGemini({
        title: "Neon Birthday",
        subtitle: "30th Birthday Celebration",
        date: "2026-09-12",
        location: "Sky Lounge",
        style: "neon",
        engine: "flux",
      });

      assert.equal(res.type, "image");
      assert.ok(res.imageUrl.includes("pollinations.ai/p/"));
      assert.ok(res.imageUrl.includes("Neon%20Birthday"));
      assert.ok(res.data.startsWith("data:image/jpeg;base64,"));
    } finally {
      globalThis.fetch = origFetch;
    }
  });
});
