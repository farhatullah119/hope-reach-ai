import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [
    { title: "FAQ — ISF Hub AI" },
    { name: "description", content: "Answers to common questions about ISF Hub AI: is it free, is it safe, what languages, how does the AI work." },
    { property: "og:title", content: "ISF Hub AI FAQ" },
    { property: "og:description", content: "Common questions about our humanitarian AI platform." },
  ]}),
  component: FAQ,
});

const items = [
  { q: "Is ISF Hub AI free?", a: "Yes, it is completely free to use." },
  { q: "Which languages are supported?", a: "English, Urdu (اردو) and Pashto (پښتو). You can switch anytime from the top-right selector." },
  { q: "Is my data private?", a: "Your account, chats and documents are private to you. We use secure authentication and per-user access rules." },
  { q: "Can the AI make mistakes?", a: "Yes. Always verify important legal, medical or immigration information with a qualified professional or an official source." },
  { q: "How do I get emergency help?", a: "For medical emergencies in Pakistan call 1122 (Rescue) or 115 (Edhi Ambulance). See the Resources page for more contacts." },
  { q: "Do I need an account?", a: "You can browse resources without an account, but the AI Assistant, Document Analyzer and Translator require a free account." },
];

function FAQ() {
  const { t } = useI18n();
  return (
    <AppLayout>
      <section className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold">{t("faq_title")}</h1>
        <Accordion type="single" collapsible className="mt-6">
          {items.map((it, i) => (
            <AccordionItem key={i} value={`i${i}`}>
              <AccordionTrigger className="text-left">{it.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{it.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </AppLayout>
  );
}