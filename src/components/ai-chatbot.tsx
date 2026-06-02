"use client";
import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, X, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useDragControls, useMotionValue } from "framer-motion";
import { useRole } from "@/lib/role";

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
  const role = useRole();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>(seed);
  const [draft, setDraft] = useState("");
  const dragControls = useDragControls();

  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // 🔴 Ref untuk mendeteksi apakah user sedang melakukan drag atau sekadar klik biasa
  const isDraggingRef = useRef(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });

      x.set(window.innerWidth - 80);
      y.set(window.innerHeight - 80);

      const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [x, y]);

  if (role === "teknisi") {
    return null;
  }

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [
      ...m,
      { from: "user", text },
      { from: "ai", text: "Analyzing telemetry… I'll surface insights based on the latest predictive model run." },
    ]);
    setDraft("");
  };

  const dragConstraints = {
    left: 16,
    top: 16,
    right: open ? windowSize.width - 376 : windowSize.width - 72,
    bottom: open ? windowSize.height - 536 : windowSize.height - 72,
  };

  return (
    <>
      <motion.div
        layout
        drag
        dragConstraints={dragConstraints}
        dragElastic={0}
        dragMomentum={false}
        dragControls={dragControls}
        dragListener={!open}

        onDragStart={() => {
          isDraggingRef.current = true;
        }}

        onDragEnd={() => {
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 50);
        }}

        style={{ position: "fixed", top: 0, left: 0, x, y }}
        className={`pointer-events-auto z-50 flex flex-col overflow-hidden shadow-2xl border border-border bg-card ${open
            ? "h-[520px] w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl"
            : "h-14 w-14 rounded-full cursor-grab active:cursor-grabbing bg-gradient-to-br from-primary to-cyan shadow-[0_10px_40px_-8px_var(--cyan)] items-center justify-center"
          }`}
      >
        {!open ? (
          <button
            onClick={(e) => {
              e.stopPropagation();

              if (isDraggingRef.current) return;

              const curX = x.get();
              const curY = y.get();
              if (curX + 360 > windowSize.width) x.set(windowSize.width - 384);
              if (curY + 520 > windowSize.height) y.set(windowSize.height - 544);
              setOpen(true);
            }}
            className="relative flex h-full w-full items-center justify-center rounded-full outline-none"
            aria-label="Open ASPEC AI"
          >
            <Bot className="h-6 w-6 text-primary-foreground" />
            <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-background bg-success" />
          </button>
        ) : (
          <>
            {/* HEADER CHATBOT */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="flex cursor-move items-center justify-between border-b border-border bg-gradient-to-r from-primary/20 to-cyan/10 px-4 py-3 select-none active:cursor-grabbing"
            >
              <div className="flex items-center gap-2 pointer-events-none">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary to-cyan text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    ASPEC AI Assistant
                    <Move className="h-3 w-3 text-muted-foreground opacity-60" />
                  </div>
                  <div className="text-[10px] text-muted-foreground">Predictive maintenance copilot</div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors hover:bg-background/40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* AREA PESAN CHAT */}
            <div className="flex-1 space-y-3 overflow-y-auto p-4 bg-card">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.from === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-background/60 text-foreground"
                      }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* INPUT & REKOMENDASI */}
            <div className="space-y-2 border-t border-border p-3 bg-card">
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
          </>
        )}
      </motion.div>
    </>
  );
}