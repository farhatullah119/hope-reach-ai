import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const NAME = { en: "English", ur: "Urdu", ps: "Pashto" } as const;
type L = keyof typeof NAME;

export const Route = createFileRoute("/api/translate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { text, from, to } = (await request.json()) as { text: string; from: L; to: L };
          if (!text || !from || !to) return new Response("Bad request", { status: 400 });
          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
          const gateway = createLovableAiGatewayProvider(key);
          const { text: out } = await generateText({
            model: gateway("google/gemini-3.6-flash"),
            messages: [
              { role: "system", content: `You are a professional translator. Translate the user's text from ${NAME[from]} to ${NAME[to]}. Preserve meaning, tone and formatting. Output ONLY the translation, no explanations.` },
              { role: "user", content: text },
            ],
          });
          return Response.json({ text: out });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[/api/translate]", msg);
          return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});