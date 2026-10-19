import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { askCodeGuru, type ChatMessage } from "@/lib/chatbot.functions";

export function CodeGuruChat() {
  const ask = useServerFn(askCodeGuru);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Namaste! 🙏 I'm Code Guru. Ask me any coding doubt — C, C++, Python, Java — main simple words mein samjha dunga.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await ask({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages([
        ...next,
        { role: "assistant", content: e instanceof Error ? e.message : "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {open && (
        <div className="glass-panel fixed bottom-24 right-6 z-50 flex h-[480px] w-[360px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧙‍♂️</span>
              <div>
                <p className="font-mono text-sm font-bold text-foreground">Code Guru</p>
                <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span className="online-dot" style={{ width: ".4rem", height: ".4rem" }} /> your coding mentor
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-md px-2 py-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "user"
                    ? "ml-8 self-end rounded-lg rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "mr-8 self-start rounded-lg rounded-bl-sm bg-secondary px-3 py-2 text-sm text-secondary-foreground"
                }
              >
                {m.role === "user" ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                ) : (
                  <div className="chat-md leading-relaxed">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="mr-8 flex items-center gap-1.5 self-start rounded-lg bg-secondary px-3 py-2.5">
                <span className="typing-dot" />
                <span className="typing-dot" style={{ animationDelay: "0.15s" }} />
                <span className="typing-dot" style={{ animationDelay: "0.3s" }} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-border/60 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask a coding doubt..."
              className="flex-1 rounded-md border border-input bg-input/40 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="btn-glow rounded-md px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close Code Guru chat" : "Open Code Guru chat"}
        className="btn-glow fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
      >
        {open ? "✕" : "🧙‍♂️"}
      </button>
    </>
  );
}
