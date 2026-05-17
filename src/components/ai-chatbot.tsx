import { useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const suggestions = [
  "How to extend asset lifetime?",
  "Estimated maintenance budget next month?",
  "Recommended preventive action?",
];

type ChatMsg = { from: "ai" | "user"; text: string };
const seed: ChatMsg[] = [
  { from: "ai", text: "Hi, I'm ASPEC AI. Ask me about asset health, maintenance budgets, or predictive insights." },
];

export function AiChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>(seed);
  const [draft, setDraft] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [
      ...m,
      { from: "user", text },
      { from: "ai", text: "Analyzing telemetry… I'll surface insights based on the latest predictive model run." },
    ]);
    setDraft("");
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary to-cyan text-primary-foreground shadow-[0_10px_40px_-8px_var(--cyan)] transition hover:scale-105"
          aria-label="Open ASPEC AI"
        >
          <Bot className="h-6 w-6" />
          <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-background bg-success" />
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-40 flex h-[520px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/20 to-cyan/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary to-cyan text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-foreground">ASPEC AI Assistant</div>
                <div className="text-[10px] text-muted-foreground">Predictive maintenance copilot</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    m.from === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/60 text-foreground"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-border p-3">
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-background/40 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-cyan/50 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(draft);
              }}
              className="flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask ASPEC AI…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button type="submit" size="icon" className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-cyan">
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
