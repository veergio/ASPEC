"use client";
import { useState, useEffect } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function AiChatbot({ assetId }: { assetId: number }) {
  const role = useRole();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>(seed);
  const [draft, setDraft] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  useEffect(() => {
    setMessages(seed);
    setChatHistory([]);
    setDraft("");
  }, [assetId]);

  if (role === "teknisi") {
    return null;
  }

  const send = async (text: string) => {
    if (!text.trim() || isTyping) return;

    // Optimistic UI update
    setMessages((m) => [...m, { from: "user", text }]);
    setDraft("");
    setIsTyping(true);

    try {
      console.log("mengirim chat dengan asset id : ", assetId)
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_id: assetId,
          user_query: text,
          chat_history: chatHistory
        }),
      });


      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      // Menyiapkan gelembung chat AI yang kosong untuk diisi dari stream
      setMessages((m) => [...m, { from: "ai", text: "" }]);

      let accumulatedText = "";

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");

          buffer = parts.pop() || ""; // Simpan sisa chunk yang belum lengkap

          for (const part of parts) {
            if (part.startsWith("data: ")) {
              try {
                const jsonStr = part.slice(6);
                const data = JSON.parse(jsonStr);

                if (data.type === "token" && data.content) {
                  accumulatedText += data.content;
                  setMessages((m) => {
                    const newM = [...m];
                    newM[newM.length - 1] = { from: "ai", text: accumulatedText };
                    return newM;
                  });
                } else if (data.type === "done") {
                  if (data.updated_history) {
                    setChatHistory(data.updated_history);
                  }
                } else if (data.type === "error") {
                  accumulatedText += "\n\n[Error: " + data.content + "]";
                  setMessages((m) => {
                    const newM = [...m];
                    newM[newM.length - 1] = { from: "ai", text: accumulatedText };
                    return newM;
                  });
                }
              } catch (e) {
                console.error("Gagal memparsing JSON dari SSE", e, part);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((m) => [...m, { from: "ai", text: "Maaf, terjadi kesalahan koneksi ke server AI." }]);
    } finally {
      setIsTyping(false);
    }
  };
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`flex flex-col overflow-hidden shadow-2xl border border-border bg-card transition-all duration-300 origin-bottom-right ${open
          ? "h-[520px] w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl opacity-100 scale-100"
          : "h-14 w-14 rounded-full opacity-0 scale-50 pointer-events-none absolute bottom-0 right-0"
          }`}
      >
        {open && (
          <>
            {/* HEADER CHATBOT */}
            <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/20 to-cyan/10 px-4 py-3 select-none">
              <div className="flex items-center gap-2 pointer-events-none">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary to-cyan text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    ASPEC AI Assistant
                  </div>
                  <div className="text-[10px] text-muted-foreground">Predictive maintenance copilot</div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
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
                    disabled={isTyping}
                    className="rounded-full border border-border bg-background/40 px-2.5 py-1 text-[11px] text-muted-foreground transition hover:border-cyan/50 hover:text-foreground disabled:opacity-50"
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
                  placeholder={isTyping ? "ASPEC AI is typing..." : "Ask ASPEC AI…"}
                  disabled={isTyping}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
                />
                <Button type="submit" size="icon" disabled={isTyping || !draft.trim()} className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-cyan disabled:opacity-50">
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>

      {!open && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          className="absolute bottom-0 right-0 flex h-14 w-14 items-center justify-center rounded-full outline-none bg-gradient-to-br from-primary to-cyan shadow-[0_10px_40px_-8px_var(--cyan)] transition-transform hover:scale-105 active:scale-95"
          aria-label="Open ASPEC AI"
        >
          <Bot className="h-6 w-6 text-primary-foreground" />
          <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-background bg-success" />
        </button>
      )}
    </div>
  );
}