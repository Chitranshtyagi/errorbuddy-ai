import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { CodeGuruChat } from "@/components/CodeGuruChat";
import { explainError, type Explanation } from "@/lib/explain.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ErrorBuddy ⚡ — No Cap Error Fixer" },
      { name: "description", content: "Drop your cursed code and get a Gen-Z Hinglish breakdown, a roast, fixed code and a pro brain move. Making compiler errors less scary, fam!" },
      { property: "og:title", content: "ErrorBuddy ⚡ — No Cap Error Fixer" },
      { property: "og:description", content: "Compiler errors explained in Gen-Z Hinglish, with roasts, clean code fixes and bhai-to-bhai audio vibes." },
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

type Stats = { xp: number; streak: number; lastDay: string };
const STATS_KEY = "errorbuddy-stats";
const XP_PER_FIX = 25;

const LEVELS = [
  { min: 0, name: "Syntax Noob" },
  { min: 100, name: "Syntax Slayer" },
  { min: 250, name: "Bug Hunter" },
  { min: 500, name: "Debug Demon" },
  { min: 1000, name: "Code Sensei" },
];

function levelFor(xp: number) {
  let lvl = 0;
  LEVELS.forEach((l, i) => {
    if (xp >= l.min) lvl = i;
  });
  return { num: lvl + 1, name: LEVELS[lvl]?.name ?? "Syntax Noob" };
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function Index() {
  const explain = useServerFn(explainError);
  const [language, setLanguage] = useState("C");
  const [code, setCode] = useState("");
  const [roastOn, setRoastOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Explanation | null>(null);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<Stats>({ xp: 0, streak: 0, lastDay: "" });
  const [xpPop, setXpPop] = useState(false);

  // Simulated audio player state
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (raw) setStats(JSON.parse(raw) as Stats);
    } catch {
      /* ignore */
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const stopAudio = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setPlaying(false);
  };

  const toggleAudio = () => {
    if (playing) {
      stopAudio();
      return;
    }
    setPlaying(true);
    timerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          stopAudio();
          return 100;
        }
        return p + 1;
      });
    }, 180);
  };

  const bumpStats = () => {
    setStats((prev) => {
      const today = dayKey(new Date());
      const yesterday = dayKey(new Date(Date.now() - 86400000));
      const streak = prev.lastDay === today ? prev.streak : prev.lastDay === yesterday ? prev.streak + 1 : 1;
      const next = { xp: prev.xp + XP_PER_FIX, streak, lastDay: today };
      try {
        localStorage.setItem(STATS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    setXpPop(true);
    setTimeout(() => setXpPop(false), 1800);
  };

  const run = async () => {
    if (!code.trim() || loading) return;
    setLoading(true);
    setError(null);
    stopAudio();
    setProgress(0);
    try {
      setResult(await explain({ data: { language, code, roast: roastOn } }));
      bumpStats();
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

  const level = levelFor(stats.xp);

  return (
    <div className="min-h-screen bg-cyber">
      <header className="glass relative z-10 border-b border-border/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="pixel flex h-10 w-10 items-center justify-center rounded-md border border-neon-pink/50 bg-neon-pink/15 text-[10px] text-neon-pink shadow-[0_0_16px_-2px_var(--neon-pink)]">
              {"</>"}
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <span className="pixel text-sm neon-pink">ErrorBuddy ⚡</span>
                <span className="online-dot" aria-label="online" />
              </h1>
              <p className="text-xs text-muted-foreground">
                No Cap Error Fixer — making compiler errors less scary, fam! 💀
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="stat-chip text-foreground">🔥 <span className="neon-pink">{stats.streak} Day Streak!</span></span>
            <span className="stat-chip relative text-foreground">
              ⚡ <span className="neon-cyan">{stats.xp} XP</span>
              {xpPop && (
                <span className="absolute -top-6 right-0 animate-bounce font-mono text-xs font-bold neon-green">
                  +{XP_PER_FIX} XP
                </span>
              )}
            </span>
            <span className="stat-chip text-foreground">🏆 <span className="neon-green">Level {level.num} — {level.name}</span></span>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-2">
        <section className="glass-panel flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {"// input."}{language.toLowerCase().replace("++", "pp")}
            </span>
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
            placeholder="Drop your cursed code or trash compiler errors here..."
            spellCheck={false}
            className="code-area min-h-[320px] flex-1 resize-y rounded-md border border-input p-4 font-mono text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
          />

          <button
            type="button"
            role="switch"
            aria-checked={roastOn}
            onClick={() => setRoastOn((r) => !r)}
            className="flex items-center gap-3 self-start"
          >
            <span className="toggle-track" data-on={roastOn} />
            <span className="font-mono text-sm text-foreground">
              Roast My Code 💀 <span className="text-xs text-muted-foreground">{roastOn ? "— okay, no mercy" : "— get playfully flamed"}</span>
            </span>
          </button>

          <button onClick={run} disabled={loading || !code.trim()} className="btn-neon rounded-md px-5 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Cooking your fix… 🍳" : "🔥 Roast & Fix My Code"}
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
              {"> waiting for your cursed code..."}<span className="caret" />
            </div>
          )}
          {loading && [0, 1, 2].map((i) => <div key={i} className="glass-panel h-32 animate-pulse" />)}
          {result && !loading && (
            <>
              {result.roast && (
                <article className="glass-panel accent-bar-red p-5">
                  <h2 className="mb-2 font-semibold text-foreground">🔥 The Roast</h2>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{result.roast}</p>
                </article>
              )}

              <article className="glass-panel accent-bar-red p-5">
                <h2 className="mb-2 font-semibold text-foreground">💀 The Oof Moment</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{result.whatWentWrong}</p>
              </article>

              <article className="glass-panel accent-bar-green p-5">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="font-semibold text-foreground">✅ Clean Code</h2>
                  <button onClick={copy} className="chip">{copied ? "Shipped! 🚀" : "Ship It 🚀"}</button>
                </div>
                <pre className="code-area overflow-x-auto rounded-md p-4 font-mono text-sm text-foreground"><code>{result.correctedCode}</code></pre>
              </article>

              <article className="glass-panel accent-bar-yellow p-5">
                <h2 className="mb-2 font-semibold text-foreground">🧠 Pro Brain Move</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{result.proTip}</p>
              </article>

              <article className="glass-panel p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold text-foreground">🎙️ Bhai-to-Bhai Audio Vibe</h2>
                  <div className={`eq ${playing ? "eq-playing" : ""}`} aria-hidden>
                    <span className="eq-bar" /><span className="eq-bar" /><span className="eq-bar" /><span className="eq-bar" /><span className="eq-bar" />
                  </div>
                </div>
                <div className="mb-3 flex items-center gap-3">
                  <button
                    onClick={toggleAudio}
                    aria-label={playing ? "Pause mentor audio" : "Play mentor audio"}
                    className="btn-neon flex h-10 w-10 items-center justify-center rounded-full text-sm"
                  >
                    {playing ? "⏸" : "▶"}
                  </button>
                  <div className="audio-progress flex-1"><div style={{ width: `${progress}%` }} /></div>
                  <span className="font-mono text-xs text-muted-foreground">{playing ? "vibing…" : progress >= 100 ? "done ✅" : "0:00"}</span>
                </div>
                <p className="whitespace-pre-wrap rounded-md bg-secondary/60 p-3 font-mono text-xs leading-relaxed text-secondary-foreground">
                  🗣️ {result.mentorScript}
                </p>
              </article>
            </>
          )}
        </section>
      </main>
      <CodeGuruChat />
    </div>
  );
}
