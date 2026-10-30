import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SearchResult, WasteResult } from "./eco-types";

const alt = {
  type: "object",
  additionalProperties: false,
  required: ["name", "price", "store", "url", "ecoScore", "whyBetter", "co2SavedKg"],
  properties: {
    name: { type: "string" },
    price: { type: "string" },
    store: { type: "string" },
    url: { type: "string" },
    ecoScore: { type: "number" },
    whyBetter: { type: "string" },
    co2SavedKg: { type: "number" },
  },
};

const searchSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "products"],
  properties: {
    summary: { type: "string" },
    products: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "name", "brand", "price", "store", "url", "category", "ecoScore",
          "materials", "co2Kg", "reasons", "alternatives",
        ],
        properties: {
          name: { type: "string" },
          brand: { type: "string" },
          price: { type: "string" },
          store: { type: "string" },
          url: { type: "string" },
          category: { type: "string" },
          ecoScore: { type: "number" },
          materials: { type: "string" },
          co2Kg: { type: "number" },
          reasons: { type: "array", items: { type: "string" } },
          alternatives: { type: "array", items: alt },
        },
      },
    },
  },
};

const SEARCH_PROMPT = `You are Eco Agent, an AI shopping assistant that turns ordinary shopping into sustainable shopping.
Use web search to find REAL products currently sold online that match the user's request (6 products, mix of conventional and eco-friendly options so the user can compare).
For each product give an Eco Score from 0-100 judging: materials (recycled/organic/biodegradable/plastic), durability & repairability, packaging, carbon footprint of manufacture & shipping, certifications (FSC, GOTS, Fairtrade, Energy Star, B-Corp), and end-of-life recyclability.
Estimate co2Kg = approximate lifecycle kg CO2e of the product. Give 2-4 short reasons for the score.
If ecoScore < 50, you MUST include 1-3 real, better alternatives found online with higher scores, why they are better and estimated co2SavedKg vs the original. Otherwise alternatives = [].
Use real product page URLs from your search. Prices with currency symbol. If the user mentions a country or currency, prefer stores there; default to India (₹) stores like Amazon.in, Flipkart, brand sites.
summary: 1-2 sentences of eco advice about this purchase.`;

export const searchProducts = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ query: z.string().trim().min(2).max(300) }).parse(d))
  .handler(async ({ data }): Promise<SearchResult | { error: string }> => {
    const { runResponses, AiError } = await import("./ai.server");
    try {
      const text = await runResponses({
        instructions: SEARCH_PROMPT,
        input: data.query,
        tools: [{ type: "web_search" }],
        text: { format: { type: "json_schema", name: "eco_search", strict: true, schema: searchSchema } },
      });
      const parsed = JSON.parse(text) as SearchResult;
      parsed.products = parsed.products.map((p) => ({
        ...p,
        ecoScore: Math.max(0, Math.min(100, Math.round(p.ecoScore))),
        url: p.url.replace(/[?&]utm_source=openai/, ""),
        alternatives: p.alternatives.map((a) => ({ ...a, url: a.url.replace(/[?&]utm_source=openai/, "") })),
      }));
      return parsed;
    } catch (e) {
      console.error("searchProducts failed", e);
      return { error: e instanceof AiError ? e.message : "Couldn't read the search results. Please try again." };
    }
  });

const wasteSchema = {
  type: "object",
  additionalProperties: false,
  required: ["item", "material", "condition", "summary", "reuseIdeas", "recycleSteps", "doNot", "co2SavedKg"],
  properties: {
    item: { type: "string" },
    material: { type: "string" },
    condition: { type: "string" },
    summary: { type: "string" },
    reuseIdeas: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "difficulty", "steps"],
        properties: {
          title: { type: "string" },
          difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
          steps: { type: "array", items: { type: "string" } },
        },
      },
    },
    recycleSteps: { type: "array", items: { type: "string" } },
    doNot: { type: "array", items: { type: "string" } },
    co2SavedKg: { type: "number" },
  },
};

export const analyzeWaste = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        description: z.string().max(500).default(""),
        image: z.string().max(8_000_000).nullable().default(null),
      })
      .refine((v) => v.description.trim().length > 1 || v.image, "Describe the item or add a photo")
      .parse(d),
  )
  .handler(async ({ data }): Promise<WasteResult | { error: string }> => {
    const { runResponses, AiError } = await import("./ai.server");
    const content: Array<Record<string, unknown>> = [
      { type: "input_text", text: `Item: ${data.description || "(see photo)"}` },
    ];
    if (data.image) content.push({ type: "input_image", image_url: data.image });
    try {
      const text = await runResponses({
        instructions: `You are Eco Agent's waste analyst. Identify the waste/old item (from photo and/or description), its material and condition.
Give 3 creative, practical upcycle/reuse ideas with clear steps (3-5 steps each), proper recycling/disposal steps (mention where in India it can go: kabadiwala, e-waste centres, municipal dry waste etc. unless another country is mentioned), and things NOT to do.
co2SavedKg = realistic estimate of kg CO2e saved by reusing/recycling instead of landfill + buying new. Be concise.`,
        input: [{ role: "user", content }],
        text: { format: { type: "json_schema", name: "waste", strict: true, schema: wasteSchema } },
      });
      return JSON.parse(text) as WasteResult;
    } catch (e) {
      console.error("analyzeWaste failed", e);
      return { error: e instanceof AiError ? e.message : "Couldn't analyze that item. Please try again." };
    }
  });
