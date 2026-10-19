import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { explainError, type Explanation } from "@/lib/explain.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ErrorBuddy AI — Compiler Errors Explained Simply" },
      { name: "description", content: "Paste buggy C, C++, Python or Java code and get a simple English/Hinglish explanation, fixed code and a beginner tip." },
      { property: "og:title", content: "ErrorBuddy AI" },
      { property: "og:description", content: "Compiler errors explained in simple human language for beginner programmers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const LANGS = ["C", "C++", "Python", "Java"];

const SAMPLE_C = `#include <stdio.h>

int main() {
    print("Hello, World!\\n");
    return 0;
}

// error: implicit declaration of function 'print'; did you mean 'printf'?`;

const SAMPLE_PY = `def greet(name):
print("Hello, " + name)

greet("Riya")

#   File "main.py", line 2
#     print("Hello, " + name)
#     ^
# IndentationError: expected an indented block after function definition on line 1`;

function Index() {
  const explain = useServerFn(explainError);
  const [language, setLanguage] = useState("C");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Explanation | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      setResult(await explain({ data: { language, code } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.correctedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-screen bg-grid">
      <header className="border-b border-border/60 glass">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 font-mono text-sm font-bold text-primary">
            {"</>"}
          </div>
          <div>
            <h1 className="flex items-center gap-2 font-mono text-lg font-bold text-foreground">
              ErrorBuddy <span className="text-primary">AI</span>
              <span className="online-dot" aria-label="online" />
            </h1>
            <p className="text-xs text-muted-foreground">Compiler Errors Explained in Simple Human Language</p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-2">
        <section className="glass-panel flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">// input.{language.toLowerCase().replace("++", "pp")}</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-md border border-input bg-input/40 px-3 py-1.5 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              {LANGS.map((l) => (
                <option key={l} value={l} className="bg-popover">{l}</option>
              ))}
            </select>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your buggy code or error log here..."
            spellCheck={false}
            className="code-area min-h-[340px] flex-1 resize-y rounded-md border border-input p-4 font-mono text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />
          <button onClick={run} disabled={loading || !code.trim()} className="btn-glow rounded-md px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Analyzing your code…" : "⚡ Explain My Error Simply"}
          </button>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { setLanguage("C"); setCode(SAMPLE_C); }} className="chip">
              Try Sample C Error (print vs printf)
            </button>
            <button onClick={() => { setLanguage("Python"); setCode(SAMPLE_PY); }} className="chip">
              Try Sample Python Indentation Error
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          {error && <div className="glass-panel border-destructive/50 p-4 text-sm text-destructive">{error}</div>}
          {!result && !loading && !error && (
            <div className="glass-panel flex min-h-[200px] flex-1 items-center justify-center p-8 text-center font-mono text-sm text-muted-foreground">
              {"> waiting for your buggy code..."}<span className="caret" />
            </div>
          )}
          {loading && [0, 1, 2].map((i) => <div key={i} className="glass-panel h-32 animate-pulse" />)}
          {result && !loading && (
            <>
              <article className="glass-panel p-5 accent-bar-red">
                <h2 className="mb-2 font-semibold text-foreground">❌ What Went Wrong</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{result.whatWentWrong}</p>
              </article>
              <article className="glass-panel p-5 accent-bar-green">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-semibold text-foreground">✅ Corrected Code</h2>
                  <button onClick={copy} className="chip">{copied ? "Copied!" : "Copy Code"}</button>
                </div>
                <pre className="code-area overflow-x-auto rounded-md p-4 font-mono text-sm text-foreground"><code>{result.correctedCode}</code></pre>
              </article>
              <article className="glass-panel p-5 accent-bar-yellow">
                <h2 className="mb-2 font-semibold text-foreground">💡 Pro Beginner Tip</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{result.proTip}</p>
              </article>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
