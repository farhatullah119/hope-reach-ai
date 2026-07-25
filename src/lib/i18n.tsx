import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ur" | "ps";

const dict = {
  en: {
    brand: "ISF Hub AI",
    tagline: "Empowering Refugees & Vulnerable Communities",
    nav_home: "Home",
    nav_about: "About",
    nav_resources: "Resources",
    nav_contact: "Contact",
    nav_faq: "FAQ",
    nav_dashboard: "Dashboard",
    nav_assistant: "AI Assistant",
    nav_documents: "Documents",
    nav_translator: "Translator",
    nav_signin: "Sign in",
    nav_signout: "Sign out",
    nav_signup: "Get started",
    lang_label: "Language",
    theme_toggle: "Toggle theme",
    hero_title: "AI help for refugees, students & families",
    hero_sub: "Get instant, respectful guidance on education, health, legal, jobs and emergencies — in English, Urdu and Pashto.",
    hero_cta: "Open AI Assistant",
    hero_cta2: "Browse resources",
    features_title: "One place. Everything you need.",
    f1_t: "AI Refugee Assistant", f1_d: "Ask anything about scholarships, UNHCR, jobs, health or legal aid.",
    f2_t: "Document Analyzer", f2_d: "Upload a letter or ID — get plain-language summary & translation.",
    f3_t: "Translator", f3_d: "Instant translation between English, Urdu and Pashto.",
    f4_t: "Resource Directory", f4_d: "NGOs, hospitals, schools, emergency numbers — searchable.",
    f5_t: "Scholarships", f5_d: "Curated scholarship opportunities worldwide.",
    f6_t: "Emergency Help", f6_d: "24/7 ambulance & rescue contacts you can trust.",
    audience_title: "Built for those who need it most",
    audiences: "Afghan & Pakistani refugees · IDPs · Students · Women · Children · Elderly · Persons with disabilities · NGOs & volunteers",
    footer_note: "A humanitarian initiative. Free to use.",
    about_title: "About ISF Hub AI",
    about_p1: "ISF Hub AI is a humanitarian platform that puts trustworthy information and AI assistance in the hands of refugees and vulnerable communities. We built it because access to accurate guidance on documentation, education, healthcare, legal rights and emergency services should not depend on where you were born or the language you speak.",
    about_p2: "The platform supports English, Urdu and Pashto, works on any phone, and is free to use.",
    problem: "Problem",
    problem_d: "Millions of refugees and displaced people struggle to find accurate, timely, multilingual information about the services they urgently need.",
    solution: "Solution",
    solution_d: "A single AI-powered hub with an assistant, document reader, translator and vetted resource directory — accessible from any browser.",
    resources_title: "Resource directory",
    resources_sub: "NGOs, scholarships, health, legal, education, employment, emergency & government services.",
    search_ph: "Search resources…",
    filter_all: "All",
    contact_title: "Contact us",
    contact_sub: "Tell us how we can help — we read every message.",
    field_name: "Full name", field_email: "Email", field_phone: "Phone", field_subject: "Subject", field_message: "Message",
    submit: "Send message", sending: "Sending…", sent: "Thank you — your message was received.",
    faq_title: "Frequently asked questions",
    auth_signin_title: "Sign in to ISF Hub AI",
    auth_signup_title: "Create your free account",
    auth_email: "Email", auth_password: "Password", auth_name: "Full name",
    auth_switch_to_signup: "New here? Create an account",
    auth_switch_to_signin: "Already have an account? Sign in",
    auth_or: "or",
    auth_google: "Continue with Google",
    dashboard_welcome: "Welcome back",
    dashboard_sub: "Your personal humanitarian AI workspace.",
    stat_chats: "Conversations", stat_docs: "Documents", stat_saved: "Saved resources",
    quick_actions: "Quick actions",
    recent_chats: "Recent conversations", recent_docs: "Recent documents",
    assistant_title: "AI Refugee Assistant",
    assistant_sub: "Ask about scholarships, UNHCR, health, jobs, legal aid, emergencies — anything.",
    assistant_ph: "Type your question…",
    send: "Send",
    new_chat: "New chat",
    thinking: "Thinking…",
    documents_title: "AI Document Analyzer",
    documents_sub: "Upload a PDF, image, or text file. AI will summarize, translate and extract key info.",
    upload_cta: "Choose file",
    analyze: "Analyze",
    analyzing: "Analyzing…",
    summary: "Summary", key_info: "Key information", suggested_language: "Detected language",
    translator_title: "AI Translator",
    translator_sub: "Translate between English, Urdu and Pashto.",
    from: "From", to: "To", translate: "Translate", translating: "Translating…",
    result: "Result",
    en: "English", ur: "اردو (Urdu)", ps: "پښتو (Pashto)",
    disclaimer: "AI can make mistakes. For emergencies, call your local emergency number.",
  },
  ur: {
    brand: "آئی ایس ایف ہب اے آئی",
    tagline: "پناہ گزینوں اور کمزور برادریوں کو بااختیار بنانا",
    nav_home: "ہوم", nav_about: "ہمارے بارے میں", nav_resources: "وسائل", nav_contact: "رابطہ", nav_faq: "عمومی سوالات",
    nav_dashboard: "ڈیش بورڈ", nav_assistant: "اے آئی معاون", nav_documents: "دستاویزات", nav_translator: "مترجم",
    nav_signin: "سائن ان", nav_signout: "سائن آؤٹ", nav_signup: "شروع کریں",
    lang_label: "زبان", theme_toggle: "تھیم تبدیل کریں",
    hero_title: "پناہ گزینوں، طلباء اور خاندانوں کے لیے اے آئی مدد",
    hero_sub: "تعلیم، صحت، قانونی، ملازمت اور ہنگامی حالات کے بارے میں فوری، محترمانہ رہنمائی — انگریزی، اردو اور پشتو میں۔",
    hero_cta: "اے آئی معاون کھولیں", hero_cta2: "وسائل دیکھیں",
    features_title: "ایک جگہ۔ ہر چیز۔",
    f1_t: "اے آئی پناہ گزین معاون", f1_d: "اسکالرشپ، یو این ایچ سی آر، ملازمت، صحت یا قانونی مدد کے بارے میں کچھ بھی پوچھیں۔",
    f2_t: "دستاویز تجزیہ کار", f2_d: "کوئی خط یا شناختی کارڈ اپلوڈ کریں — سادہ زبان میں خلاصہ اور ترجمہ حاصل کریں۔",
    f3_t: "مترجم", f3_d: "انگریزی، اردو اور پشتو کے درمیان فوری ترجمہ۔",
    f4_t: "وسائل ڈائریکٹری", f4_d: "این جی اوز، ہسپتال، اسکول، ہنگامی نمبر — قابلِ تلاش۔",
    f5_t: "اسکالرشپ", f5_d: "دنیا بھر میں منتخب اسکالرشپ کے مواقع۔",
    f6_t: "ہنگامی مدد", f6_d: "24/7 ایمبولینس اور ریسکیو رابطے۔",
    audience_title: "ان کے لیے بنایا گیا جنہیں سب سے زیادہ ضرورت ہے",
    audiences: "افغان اور پاکستانی پناہ گزین · IDPs · طلباء · خواتین · بچے · بزرگ · معذور افراد · این جی اوز اور رضاکار",
    footer_note: "ایک انسانی ہمدردی کا اقدام۔ مفت استعمال۔",
    about_title: "آئی ایس ایف ہب اے آئی کے بارے میں",
    about_p1: "آئی ایس ایف ہب اے آئی ایک انسانی ہمدردی کا پلیٹ فارم ہے جو پناہ گزینوں اور کمزور برادریوں کو قابل اعتماد معلومات اور اے آئی مدد فراہم کرتا ہے۔",
    about_p2: "پلیٹ فارم انگریزی، اردو اور پشتو کو سپورٹ کرتا ہے، کسی بھی فون پر کام کرتا ہے، اور مفت ہے۔",
    problem: "مسئلہ", problem_d: "لاکھوں پناہ گزین درست معلومات تک رسائی کے لیے جدوجہد کرتے ہیں۔",
    solution: "حل", solution_d: "ایک اے آئی سے چلنے والا مرکز۔",
    resources_title: "وسائل ڈائریکٹری", resources_sub: "این جی اوز، اسکالرشپ، صحت، قانونی، تعلیم، ملازمت، ہنگامی اور حکومتی خدمات۔",
    search_ph: "وسائل تلاش کریں…", filter_all: "سب",
    contact_title: "ہم سے رابطہ کریں", contact_sub: "ہمیں بتائیں ہم کیسے مدد کر سکتے ہیں۔",
    field_name: "پورا نام", field_email: "ای میل", field_phone: "فون", field_subject: "موضوع", field_message: "پیغام",
    submit: "پیغام بھیجیں", sending: "بھیج رہے ہیں…", sent: "شکریہ — آپ کا پیغام موصول ہوگیا۔",
    faq_title: "عمومی سوالات",
    auth_signin_title: "آئی ایس ایف ہب اے آئی میں سائن ان کریں",
    auth_signup_title: "اپنا مفت اکاؤنٹ بنائیں",
    auth_email: "ای میل", auth_password: "پاس ورڈ", auth_name: "پورا نام",
    auth_switch_to_signup: "نئے ہیں؟ اکاؤنٹ بنائیں",
    auth_switch_to_signin: "پہلے سے اکاؤنٹ ہے؟ سائن ان کریں",
    auth_or: "یا", auth_google: "گوگل کے ساتھ جاری رکھیں",
    dashboard_welcome: "خوش آمدید", dashboard_sub: "آپ کا ذاتی انسانی ہمدردی اے آئی ورک اسپیس۔",
    stat_chats: "گفتگو", stat_docs: "دستاویزات", stat_saved: "محفوظ وسائل",
    quick_actions: "فوری اقدامات", recent_chats: "حالیہ گفتگو", recent_docs: "حالیہ دستاویزات",
    assistant_title: "اے آئی پناہ گزین معاون", assistant_sub: "اسکالرشپ، یو این ایچ سی آر، صحت، ملازمت، قانونی مدد کے بارے میں پوچھیں۔",
    assistant_ph: "اپنا سوال ٹائپ کریں…", send: "بھیجیں", new_chat: "نئی گفتگو", thinking: "سوچ رہا ہے…",
    documents_title: "اے آئی دستاویز تجزیہ کار", documents_sub: "PDF، تصویر یا متن اپلوڈ کریں۔",
    upload_cta: "فائل منتخب کریں", analyze: "تجزیہ کریں", analyzing: "تجزیہ ہو رہا ہے…",
    summary: "خلاصہ", key_info: "اہم معلومات", suggested_language: "پتہ چلنے والی زبان",
    translator_title: "اے آئی مترجم", translator_sub: "انگریزی، اردو اور پشتو کے درمیان ترجمہ۔",
    from: "سے", to: "تک", translate: "ترجمہ کریں", translating: "ترجمہ ہو رہا ہے…",
    result: "نتیجہ", en: "English", ur: "اردو", ps: "پښتو",
    disclaimer: "اے آئی غلطیاں کر سکتا ہے۔ ہنگامی حالات میں اپنے مقامی ہنگامی نمبر پر کال کریں۔",
  },
  ps: {
    brand: "ISF Hub AI",
    tagline: "کډوالو او زیانمنو ټولنو ته ځواک ورکول",
    nav_home: "کور", nav_about: "زموږ په اړه", nav_resources: "سرچینې", nav_contact: "اړیکه", nav_faq: "پوښتنې",
    nav_dashboard: "ډشبورډ", nav_assistant: "AI مرستیال", nav_documents: "اسناد", nav_translator: "ژباړونکی",
    nav_signin: "ننوتل", nav_signout: "وتل", nav_signup: "پیل وکړئ",
    lang_label: "ژبه", theme_toggle: "ثیم بدلول",
    hero_title: "د کډوالو، زده کوونکو او کورنیو لپاره د AI مرسته",
    hero_sub: "د زده کړې، روغتیا، قانوني، دندې او بېړني حالاتو په اړه سمدستي، درناوی رهنمایي — په انګلیسي، اردو او پښتو کې.",
    hero_cta: "AI مرستیال پرانیستل", hero_cta2: "سرچینې وګورئ",
    features_title: "یو ځای. هرڅه.",
    f1_t: "د AI کډوال مرستیال", f1_d: "د سکالرشیپ، UNHCR، دندې، روغتیا یا قانوني مرستې په اړه هرڅه وپوښتئ.",
    f2_t: "د اسنادو شنونکی", f2_d: "لیک یا پېژندپاڼه اپلوډ کړئ — ساده لنډیز او ژباړه ترلاسه کړئ.",
    f3_t: "ژباړونکی", f3_d: "د انګلیسي، اردو او پښتو ترمنځ سمدستي ژباړه.",
    f4_t: "د سرچینو لارښود", f4_d: "NGOs، روغتونونه، ښوونځي، بېړني شمېرې.",
    f5_t: "سکالرشیپونه", f5_d: "په ټوله نړۍ کې د سکالرشیپ فرصتونه.",
    f6_t: "بېړنۍ مرسته", f6_d: "24/7 امبولانس او ژغورنې اړیکې.",
    audience_title: "د هغو چا لپاره جوړ شوی چې ډېره اړتیا لري",
    audiences: "افغان او پاکستاني کډوال · IDPs · زده کوونکي · ښځې · ماشومان · مشران · معلولین · NGOs او رضاکاران",
    footer_note: "یو بشري نوښت. وړیا کارول.",
    about_title: "د ISF Hub AI په اړه",
    about_p1: "ISF Hub AI یو بشري پلیټ فارم دی چې د کډوالو په لاس کې د باور وړ معلومات او د AI مرسته ورکوي.",
    about_p2: "دا پلیټ فارم انګلیسي، اردو او پښتو ملاتړ کوي، په هر ټیلیفون کار کوي، او وړیا دی.",
    problem: "ستونزه", problem_d: "میلیونونه کډوال د سمو معلوماتو ترلاسه کولو کې ستونزه لري.",
    solution: "حل", solution_d: "یو د AI پر بنسټ مرکز.",
    resources_title: "د سرچینو لارښود", resources_sub: "NGOs، سکالرشیپونه، روغتیا، قانوني، زده کړه، دندې، بېړني او دولتي خدمتونه.",
    search_ph: "سرچینې ولټوئ…", filter_all: "ټول",
    contact_title: "زموږ سره اړیکه", contact_sub: "موږ ته ووایاست چې څنګه مرسته وکړو.",
    field_name: "بشپړ نوم", field_email: "برېښنالیک", field_phone: "ټیلیفون", field_subject: "موضوع", field_message: "پیغام",
    submit: "پیغام واستوئ", sending: "لیږل کیږي…", sent: "مننه — ستاسو پیغام ترلاسه شو.",
    faq_title: "ډېرې پوښتل شوې پوښتنې",
    auth_signin_title: "ISF Hub AI ته ننوځئ", auth_signup_title: "وړیا حساب جوړ کړئ",
    auth_email: "برېښنالیک", auth_password: "پټ نوم", auth_name: "بشپړ نوم",
    auth_switch_to_signup: "نوی یاست؟ حساب جوړ کړئ",
    auth_switch_to_signin: "حساب لرئ؟ ننوځئ",
    auth_or: "یا", auth_google: "د ګوګل سره دوام ورکړئ",
    dashboard_welcome: "بېرته ښه راغلاست", dashboard_sub: "ستاسو شخصي بشري AI کاري ځای.",
    stat_chats: "خبرې اترې", stat_docs: "اسناد", stat_saved: "خوندي شوي سرچینې",
    quick_actions: "چټک عملونه", recent_chats: "وروستي خبرې اترې", recent_docs: "وروستي اسناد",
    assistant_title: "د AI کډوال مرستیال", assistant_sub: "د سکالرشیپ، UNHCR، روغتیا، دندې په اړه پوښتنه وکړئ.",
    assistant_ph: "خپله پوښتنه ولیکئ…", send: "واستوئ", new_chat: "نوې خبرې اترې", thinking: "فکر کوي…",
    documents_title: "د AI اسنادو شنونکی", documents_sub: "PDF، انځور یا متن اپلوډ کړئ.",
    upload_cta: "فایل غوره کړئ", analyze: "تحلیل", analyzing: "تحلیل کیږي…",
    summary: "لنډیز", key_info: "کلیدي معلومات", suggested_language: "کشف شوې ژبه",
    translator_title: "د AI ژباړونکی", translator_sub: "د انګلیسي، اردو او پښتو ترمنځ ژباړه.",
    from: "له", to: "ته", translate: "ژباړل", translating: "ژباړل کیږي…",
    result: "پایله", en: "English", ur: "اردو", ps: "پښتو",
    disclaimer: "AI کولی شي غلطي وکړي. په بېړني حالاتو کې، خپلې محلي بېړني شمېرې ته زنګ ووهئ.",
  },
} as const;

type Key = keyof typeof dict.en;

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string; dir: "ltr" | "rtl" };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("isf-lang")) as Lang | null;
    if (saved && ["en", "ur", "ps"].includes(saved)) setLangState(saved);
  }, []);
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ur" || lang === "ps" ? "rtl" : "ltr";
    }
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("isf-lang", l);
  };
  const t = (k: Key) => (dict[lang] as Record<string, string>)[k] ?? (dict.en as Record<string, string>)[k];
  const dir = lang === "ur" || lang === "ps" ? "rtl" : "ltr";
  return <I18nContext.Provider value={{ lang, setLang, t, dir }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const v = useContext(I18nContext);
  if (!v) throw new Error("useI18n must be used inside I18nProvider");
  return v;
}

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ur", label: "اردو" },
  { code: "ps", label: "پښتو" },
];