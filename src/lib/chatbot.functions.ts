import { createServerFn } from "@tanstack/react-start";

export type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT =
  "You are Code Guru, a friendly coding mentor for beginner programming students inside the ErrorBuddy AI app. " +
  "Answer coding questions (C, C++, Python, Java and general programming) in simple beginner English mixed with light Hinglish. " +
  "Keep answers short and clear (under 150 words unless code is needed). Use small code examples when helpful. Be encouraging.";

async function callGateway(messages: ChatMessage[]): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured.");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      Authorization: `Bearer ${key}`,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions: SYSTEM_PROMPT,
      input: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok || !res.body) {
    if (res.status === 429) throw new Error("Too many requests — please wait a moment and try again.");
    if (res.status === 402) throw new Error("AI credits have run out. Please add credits to continue.");
    const t = await res.text().catch(() => "");
    throw new Error(`AI request failed (${res.status}). ${t.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload);
        if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
        if (ev.type === "response.refusal.delta") throw new Error("The AI declined this request.");
        if (ev.type === "error" || ev.type === "response.failed")
          throw new Error(ev.error?.message ?? ev.response?.error?.message ?? "AI error");
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
  if (!text.trim()) throw new Error("Couldn't read the AI response. Please try again.");
  return text;
}

export const askCodeGuru = createServerFn({ method: "POST" })
  .inputValidator((input: { messages: ChatMessage[] }) => {
    const messages = Array.isArray(input?.messages) ? input.messages : [];
    const clean = messages
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-20);
    if (!clean.length || clean[clean.length - 1].role !== "user" || !clean[clean.length - 1].content.trim())
      throw new Error("Please type a question first.");
    if (clean.some((m) => m.content.length > 4000)) throw new Error("Message is too long (max 4,000 characters).");
    return { messages: clean };
  })
  .handler(async ({ data }): Promise<{ reply: string }> => {
    return { reply: await callGateway(data.messages) };
  });
