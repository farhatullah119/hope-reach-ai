import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Send, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [
    { title: "AI Assistant — ISF Hub AI" },
    { name: "description", content: "Chat with the ISF Hub AI Refugee Assistant about scholarships, UNHCR, health, jobs, legal aid and more." },
  ]}),
  component: Assistant,
});

type Msg = { role: "user" | "assistant"; content: string };
type Conv = { id: string; title: string; updated_at: string };

function Assistant() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("chat_conversations").select("id,title,updated_at").order("updated_at", { ascending: false })
      .then(({ data }) => setConvs((data as Conv[]) ?? []));
  }, [user]);

  useEffect(() => {
    if (!activeId) { setMsgs([]); return; }
    supabase.from("chat_messages").select("role,content").eq("conversation_id", activeId).order("created_at")
      .then(({ data }) => setMsgs(((data as { role: string; content: string }[] | null) ?? []).filter(m => m.role !== "system").map(m => ({ role: m.role as "user" | "assistant", content: m.content }))));
  }, [activeId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [msgs]);

  async function newChat() { setActiveId(null); setMsgs([]); }

  async function send() {
    if (!input.trim() || sending || !user) return;
    const text = input.trim();
    setInput("");
    setSending(true);

    let convId = activeId;
    if (!convId) {
      const { data, error } = await supabase.from("chat_conversations")
        .insert({ user_id: user.id, title: text.slice(0, 50) }).select("id,title,updated_at").single();
      if (error || !data) { toast.error(error?.message ?? "Failed"); setSending(false); return; }
      convId = data.id;
      setActiveId(convId);
      setConvs((c) => [data as Conv, ...c]);
    }

    const nextMsgs: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(nextMsgs);
    await supabase.from("chat_messages").insert({ conversation_id: convId, user_id: user.id, role: "user", content: text });

    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMsgs, lang }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { text: string };
      setMsgs((m) => [...m, { role: "assistant", content: json.text }]);
      await supabase.from("chat_messages").insert({ conversation_id: convId, user_id: user.id, role: "assistant", content: json.text });
      await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <AppLayout>
      <section className="mx-auto max-w-7xl px-4 py-6 grid md:grid-cols-[260px_1fr] gap-4 h-[calc(100dvh-8rem)]">
        <aside className="glass rounded-2xl p-3 overflow-y-auto">
          <Button onClick={newChat} className="w-full gap-2 mb-3"><Plus className="h-4 w-4" /> {t("new_chat")}</Button>
          <div className="space-y-1">
            {convs.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition truncate ${activeId === c.id ? "bg-accent text-accent-foreground" : ""}`}
              >
                <MessageSquare className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5" />{c.title}
              </button>
            ))}
            {convs.length === 0 && <p className="text-xs text-muted-foreground px-3 py-2">No chats yet.</p>}
          </div>
        </aside>

        <div className="glass rounded-2xl flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b">
            <h1 className="font-semibold">{t("assistant_title")}</h1>
            <p className="text-xs text-muted-foreground">{t("assistant_sub")}</p>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {msgs.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                <MessageSquare className="mx-auto h-10 w-10 opacity-40" />
                <p className="mt-2 text-sm">{t("assistant_sub")}</p>
              </div>
            )}
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  {m.role === "assistant"
                    ? <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{m.content}</ReactMarkdown></div>
                    : m.content}
                </div>
              </div>
            ))}
            {sending && <div className="text-sm text-muted-foreground animate-pulse">{t("thinking")}</div>}
          </div>
          <div className="border-t p-3 flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={t("assistant_ph")}
              rows={1}
              className="resize-none min-h-[44px] max-h-40"
            />
            <Button onClick={send} disabled={sending || !input.trim()} size="icon"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}