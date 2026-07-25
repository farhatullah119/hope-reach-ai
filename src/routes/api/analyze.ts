import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Body = {
  filename: string;
  mimeType: string;
  dataUrl: string; // data:...;base64,...
  lang?: "en" | "ur" | "ps";
};

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as Body;
          if (!body?.dataUrl || !body?.mimeType) return new Response("Bad request", { status: 400 });
          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
          const gateway = createLovableAiGatewayProvider(key);

          const outLang = body.lang === "ur" ? "Urdu" : body.lang === "ps" ? "Pashto" : "English";
          const instruction = `Analyze this document and reply in ${outLang}. Give:
1. A short plain-language summary (3-6 sentences).
2. Key information: names, dates, deadlines, amounts, addresses, IDs, decisions.
3. Any action items or steps the reader should take.
4. If a deadline exists, highlight it clearly.
Format as markdown with headings: **Summary**, **Key Information**, **Action Items**.`;

          const isImage = body.mimeType.startsWith("image/");
          const isPdf = body.mimeType === "application/pdf";
          const isText = body.mimeType.startsWith("text/");

          type Part =
            | { type: "text"; text: string }
            | { type: "image"; image: string; mediaType?: string }
            | { type: "file"; data: string; mediaType: string; filename?: string };
          const parts: Part[] = [{ type: "text", text: instruction }];
          if (isImage) {
            parts.push({ type: "image", image: body.dataUrl, mediaType: body.mimeType });
          } else if (isPdf) {
            parts.push({ type: "file", data: body.dataUrl, mediaType: body.mimeType, filename: body.filename });
          } else if (isText) {
            // Decode text and send inline
            const base64 = body.dataUrl.split(",")[1] ?? "";
            const text = Buffer.from(base64, "base64").toString("utf-8").slice(0, 40000);
            parts.push({ type: "text", text: `\n\nDocument text:\n${text}` });
          } else {
            return new Response(JSON.stringify({ error: "Unsupported file type. Use PDF, image, or text." }), {
              status: 400, headers: { "Content-Type": "application/json" },
            });
          }

          const { text } = await generateText({
            model: gateway("google/gemini-3.6-flash"),
            messages: [{ role: "user", content: parts as never }],
          });

          return Response.json({ text });
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error("[/api/analyze]", msg);
          return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});