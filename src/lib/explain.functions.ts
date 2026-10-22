import { createServerFn } from "@tanstack/react-start";

export type Explanation = {
  whatWentWrong: string;
  correctedCode: string;
  proTip: string;
  roast: string;
  mentorScript: string;
};

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["whatWentWrong", "correctedCode", "proTip", "roast", "mentorScript"],
  properties: {
    whatWentWrong: { type: "string" },
    correctedCode: { type: "string" },
    proTip: { type: "string" },
    roast: { type: "string" },
    mentorScript: { type: "string" },
  },
};

export const explainError = createServerFn({ method: "POST" })
  .inputValidator((input: { language: string; code: string; roast?: boolean }) => {
    if (!input?.code?.trim()) throw new Error("Drop some code or an error first, fam.");
    if (input.code.length > 20000) throw new Error("Input is too long (max 20,000 characters).");
    return { language: String(input.language).slice(0, 20), code: input.code, roast: input.roast === true };
  })
  .handler(async ({ data }): Promise<Explanation> => {
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
        instructions:
          "You are ErrorBuddy, a funny Gen-Z coding mentor for beginner programmers. Given buggy code or a compiler/runtime error, respond with these fields. " +
          "whatWentWrong: explain the mistake in easy English mixed with Gen-Z Hinglish slang (e.g. 'Bhai, line 4 pe semicolon hi bhool gaya 💀'), no scary jargon, mention the line if possible, 3-6 sentences. " +
          "correctedCode: ONLY the full corrected code as plain text, no markdown fences. If only an error log was given, write a minimal corrected example. " +
          "proTip: one practical beginner habit or syntax trick related to this mistake, Gen-Z tone, 1-3 sentences. " +
          (data.roast
            ? "roast: a short, funny, friendly meme-style roast that playfully mocks the buggy code (Gen-Z Hinglish, emojis welcome). Keep it kind — roast the code, never the person. 2-4 sentences. "
            : "roast: return an empty string. ") +
          "mentorScript: a 'Bhai-to-Bhai' audio-style monologue — a friendly senior mentor explaining the fix out loud in casual Hinglish (start like 'Sun bhai...'), warm and reassuring, 4-7 sentences, plain spoken text with no markdown.",
        input: [{ role: "user", content: `Language: ${data.language}\n\n${data.code}` }],
        text: { format: { type: "json_schema", name: "explanation", strict: true, schema } },
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
    try {
      return JSON.parse(text) as Explanation;
    } catch {
      throw new Error("Couldn't read the AI response. Please try again.");
    }
  });
