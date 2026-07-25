import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider, SYSTEM_ASSISTANT } from "@/lib/ai-gateway.server";

type Msg = { role: "user" | "assistant" | "system"; content: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { messages?: Msg[]; lang?: string };
          if (!Array.isArray(body.messages)) return new Response("Bad request", { status: 400 });
          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
          const gateway = createLovableAiGatewayProvider(key);
          const langHint =
            body.lang === "ur" ? "\nUser prefers Urdu. Reply in Urdu unless they ask otherwise."
            : body.lang === "ps" ? "\nUser prefers Pashto. Reply in Pashto unless they ask otherwise."
            : "";
          const { text } = await generateText({
            model: gateway("google/gemini-3.6-flash"),
            messages: [
              { role: "system", content: SYSTEM_ASSISTANT + langHint },
              ...body.messages.filter((m) => m.role !== "system"),
            ],
          });
          return Response.json({ text });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[/api/chat]", msg);
          return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});