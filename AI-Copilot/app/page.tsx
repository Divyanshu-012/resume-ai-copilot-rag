"use client";

import { useState } from "react";
import {
  analyzeApplication,
  chatWithResume,
  generateEmail as generateEmailApi,
  generateSuggestions as generateSuggestionsApi,
  ingestResume,
  type AnalyzeResult,
  type RagChunk,
  type RagSource,
} from "@/lib/api";

type MatchResult = AnalyzeResult["match"];

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [analysis, setAnalysis] = useState("");
  const [ragContext, setRagContext] = useState<RagChunk[]>([]);
  const [email, setEmail] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatContext, setChatContext] = useState<RagChunk[]>([]);
  const [chatSources, setChatSources] = useState<RagSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!file) { alert("Upload resume first"); return; }
    if (!jd.trim()) { alert("Paste a job description first"); return; }
    setLoading(true);
    setError("");
    setMatchResult(null);
    setSkills([]);
    setAnalysis("");
    setRagContext([]);
    setEmail("");
    setSuggestions("");

    try {
      const ingestData = await ingestResume(file);
      setResumeId(ingestData.resume_id);
      setSkills(ingestData.skills || []);

      const analyzeData = await analyzeApplication(
        ingestData.resume_id,
        jd,
        ingestData.skills || []
      );

      setMatchResult(analyzeData.match);
      setAnalysis(analyzeData.analysis);
      setRagContext(analyzeData.rag_context || []);
    } catch (err: unknown) {
      console.error(err);
      setError(getErrorMessage(err, "Something went wrong. Check backend/.env and NEXT_PUBLIC_API_URL"));
    } finally {
      setLoading(false);
    }
  };

  const generateEmail = async () => {
    if (!matchResult || !resumeId) { alert("Analyze resume first"); return; }
    setEmailLoading(true);
    try {
      const data = await generateEmailApi(resumeId, jd, skills);
      setEmail(data.email);
      if (data.rag_context?.length) setRagContext(data.rag_context);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Email generation failed"));
    } finally {
      setEmailLoading(false);
    }
  };

  const generateSuggestions = async () => {
    if (!matchResult || !resumeId) return;
    setSuggestLoading(true);
    try {
      const data = await generateSuggestionsApi(matchResult.missing, jd, resumeId);
      setSuggestions(data.suggestions);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Suggestions failed"));
    } finally {
      setSuggestLoading(false);
    }
  };

  const askResumeQuestion = async () => {
    if (!chatQuestion.trim()) { alert("Ask a question first"); return; }
    if (!resumeId && !file) { alert("Upload a resume first"); return; }

    setChatLoading(true);
    setError("");
    setChatAnswer("");
    setChatContext([]);
    setChatSources([]);

    try {
      let activeResumeId = resumeId;

      if (!activeResumeId && file) {
        const ingestData = await ingestResume(file);
        activeResumeId = ingestData.resume_id;
        setResumeId(ingestData.resume_id);
        setSkills(ingestData.skills || []);
      }

      const data = await chatWithResume(activeResumeId, chatQuestion);
      setChatAnswer(data.answer);
      setChatContext(data.rag_context || []);
      setChatSources(data.sources || []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Resume chat failed"));
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>

      {/* ── NAV ── */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 0 40px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 48 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.5px" }}>
          <span className="shimmer">⚡ JobCopilot</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <span className="badge badge-green"><span className="pulse" style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} /> Live</span>
          <span className="badge badge-purple">✦ AI-Powered</span>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="fade-up d1" style={{ textAlign: "center", marginBottom: 64 }}>
        <div className="badge badge-green" style={{ marginBottom: 24 }}>
          <span className="pulse" style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
          Smart Resume Analysis · Powered by AI
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2.2rem,5vw,3.8rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-2px", marginBottom: 18 }}>
          Land Your Dream Job<br />
          <span className="glow-text">10× Faster</span>
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "1rem", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
          Upload your resume, paste the JD, and let AI handle the heavy lifting — match scoring, cover letters, interview prep.
        </p>
      </div>

      {/* ── STATS ── */}
      <div className="fade-up d2 card border-pulse" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", marginBottom: 48, overflow: "hidden" }}>
        {[["94%","Match Accuracy"],["3×","More Callbacks"],["2 min","Avg Analysis"],["50k+","Resumes Done"]].map(([num,label],i)=>(
          <div key={i} style={{ padding: "24px 16px", textAlign: "center", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 800, color: "var(--accent)", textShadow: "0 0 20px rgba(0,255,170,0.4)" }}>{num}</div>
            <div className="label" style={{ marginTop: 6 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── INPUT GRID ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* Upload Resume */}
        <div className="card fade-up d2" style={{ padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(0,255,170,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>📄</div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem" }}>Upload Resume</div>
              <div className="label" style={{ marginBottom: 2 }}>PDF · TXT · embedded into ChromaDB</div>
            </div>
          </div>

          <label style={{ display: "block", cursor: "none" }}>
            <div style={{
              border: "2px dashed rgba(0,255,170,0.2)", borderRadius: 12, padding: "32px 20px",
              textAlign: "center", transition: "all 0.3s", background: "rgba(0,255,170,0.02)"
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,255,170,0.5)"; (e.currentTarget as HTMLDivElement).style.background = "rgba(0,255,170,0.05)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,255,170,0.2)"; (e.currentTarget as HTMLDivElement).style.background = "rgba(0,255,170,0.02)"; }}
            >
              <div style={{ fontSize: "1.8rem", marginBottom: 10 }}>☁️</div>
              {fileName ? (
                <div>
                  <div style={{ color: "var(--accent)", fontWeight: 600, fontSize: "0.85rem" }}>✓ {fileName}</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.72rem", marginTop: 4 }}>File ready to analyze</div>
                </div>
              ) : (
                <div style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.5 }}>
                  <span style={{ color: "var(--accent)", fontWeight: 600 }}>Drop your resume here</span><br />or click to browse
                </div>
              )}
              <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
                {["PDF","DOCX","TXT"].map(f => (
                  <span key={f} className="tag tag-green" style={{ fontSize: "0.65rem", padding: "3px 8px" }}>{f}</span>
                ))}
              </div>
            </div>
            <input type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: "none" }} onChange={e => {
              if (e.target.files?.[0]) { setFile(e.target.files[0]); setFileName(e.target.files[0].name); }
            }} />
          </label>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn btn-outline" style={{ flex: 1, fontSize: "0.72rem", padding: "10px 12px" }}>📋 Template</button>
            <button className="btn btn-outline" style={{ flex: 1, fontSize: "0.72rem", padding: "10px 12px" }}>🔗 LinkedIn</button>
          </div>
        </div>

        {/* Job Description */}
        <div className="card fade-up d3" style={{ padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(124,58,237,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>🎯</div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem" }}>Job Description</div>
              <div className="label" style={{ marginTop: 2 }}>Paste the full JD</div>
            </div>
          </div>
          <textarea
            className="field"
            placeholder={"Paste the job description here…\n\nBest results with the full JD including requirements, skills, and responsibilities."}
            style={{ minHeight: 160, resize: "vertical" }}
            value={jd}
            onChange={e => setJd(e.target.value)}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button className="btn btn-outline" style={{ flex: 1, fontSize: "0.72rem", padding: "10px 12px" }}>🌐 From URL</button>
            <button className="btn btn-outline" style={{ flex: 1, fontSize: "0.72rem", padding: "10px 12px" }}>✨ Auto-detect</button>
          </div>
        </div>
      </div>

      {/* ── FEATURE CARDS ── */}
      <div className="card fade-up d3" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(0,255,170,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>🤖</div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem" }}>AI Actions</div>
            <div className="label" style={{ marginTop: 2 }}>Choose what you need — or run them all</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
          {[
            ["🎯","Match Score","See how well your resume aligns with the job requirements"],
            ["✍️","Cover Letter","Generate a tailored, ATS-friendly cover letter instantly"],
            ["🔑","Keyword Gap","Find missing keywords ATS systems scan for"],
            ["💬","Interview Prep","Get likely interview questions + suggested answers"],
            ["✏️","Resume Rewrite","AI rewrites your bullets to better match the role"],
            ["📊","Full Report","Comprehensive analysis PDF to download and share"],
          ].map(([emoji, title, desc]) => (
            <div key={title} className="card" style={{ padding: "18px 16px", cursor: "none" }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(0,255,170,0.25)"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = ""}
            >
              <div style={{ fontSize: "1.3rem", marginBottom: 10 }}>{emoji}</div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.82rem", marginBottom: 5 }}>{title}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", fontSize: "0.82rem", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ flexShrink: 0 }}>⚠️</span>
            <div>
              <strong>Error:</strong> {error}
              <div style={{ marginTop: 4, color: "rgba(248,113,113,0.7)", fontSize: "0.75rem" }}>Ensure the FastAPI backend is running and <code style={{ background: "rgba(255,255,255,0.05)", padding: "1px 5px", borderRadius: 4 }}>backend/.env</code> has <code style={{ background: "rgba(255,255,255,0.05)", padding: "1px 5px", borderRadius: 4 }}>GROQ_API_KEY</code> set.</div>
            </div>
          </div>
        )}

        <button className="btn btn-primary" style={{ width: "100%", padding: "16px", fontSize: "0.9rem" }} onClick={handleAnalyze} disabled={loading}>
          {loading ? (
            <><span className="spin" style={{ display:"inline-block",width:16,height:16,border:"2px solid #02020a",borderTopColor:"transparent",borderRadius:"50%" }} /> Analyzing…</>
          ) : "⚡ Analyze My Application"}
        </button>
      </div>

      {/* ── RESULTS ── */}
      {(skills.length > 0 || matchResult) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

          {skills.length > 0 && (
            <div className="card fade-up" style={{ padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <span style={{ fontSize: "1.1rem" }}>🧠</span>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem" }}>Detected Skills</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {skills.map(s => <span key={s} className="tag tag-neutral">{s}</span>)}
              </div>
            </div>
          )}

          {matchResult && (
            <div className="card fade-up" style={{ padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: "1.1rem" }}>📊</span>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem" }}>Match Score</div>
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 800, color: "var(--accent)", textShadow: "0 0 20px rgba(0,255,170,0.5)" }}>
                  {matchResult.score}%
                </div>
              </div>
              <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 20 }}>
                <div style={{ height: "100%", borderRadius: 999, width: `${matchResult.score}%`, background: "linear-gradient(90deg,var(--accent),#00cc88)", boxShadow: "0 0 12px rgba(0,255,170,0.5)", transition: "width 1s cubic-bezier(0.16,1,0.3,1)" }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div className="label" style={{ marginBottom: 8 }}>✓ Matched Skills</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {matchResult.matched.map((s: string) => <span key={s} className="tag tag-green">{s}</span>)}
                </div>
              </div>
              <div>
                <div className="label" style={{ marginBottom: 8 }}>✗ Missing Skills</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {matchResult.missing.map((s: string) => <span key={s} className="tag tag-red">{s}</span>)}
                </div>
              </div>
              {matchResult.semantic_matches?.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="label" style={{ marginBottom: 8 }}>≈ Semantic Matches</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {matchResult.semantic_matches.map((item) => (
                      <div key={`${item.jd_skill}-${item.resume_skill}`} style={{ fontSize: "0.72rem", color: "var(--muted)" }}>
                        {item.jd_skill} ↔ {item.resume_skill} ({item.similarity})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── RAG + ANALYSIS ── */}
      {(analysis || ragContext.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          {analysis && (
            <div className="card fade-up" style={{ padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <span style={{ fontSize: "1.1rem" }}>🧩</span>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem" }}>RAG Fit Analysis</div>
              </div>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "rgba(232,232,240,0.8)", lineHeight: 1.7 }}>{analysis}</pre>
            </div>
          )}

          {ragContext.length > 0 && (
            <div className="card fade-up" style={{ padding: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <span style={{ fontSize: "1.1rem" }}>🔍</span>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem" }}>Retrieved Resume Chunks</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {ragContext.map((chunk, index) => (
                  <div key={index} style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="label" style={{ marginBottom: 6 }}>Similarity {chunk.similarity ?? "—"}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.6 }}>{chunk.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ACTION BUTTONS ── */}
      {matchResult && (
        <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
          <button className="btn btn-outline" style={{ flex: 1, padding: "14px" }} onClick={generateEmail} disabled={emailLoading}>
            {emailLoading ? <><span className="spin" style={{ display:"inline-block",width:14,height:14,border:"2px solid var(--muted)",borderTopColor:"var(--accent)",borderRadius:"50%" }} /> Generating…</> : "✉️ Generate Recruiter Email"}
          </button>
          <button className="btn btn-amber" style={{ flex: 1, padding: "14px" }} onClick={generateSuggestions} disabled={suggestLoading}>
            {suggestLoading ? <><span className="spin" style={{ display:"inline-block",width:14,height:14,border:"2px solid var(--muted)",borderTopColor:"var(--accent3)",borderRadius:"50%" }} /> Loading…</> : "💡 Get Skill Suggestions"}
          </button>
        </div>
      )}

      {/* ── EMAIL OUTPUT ── */}
      {email && (
        <div className="card fade-up" style={{ padding: 28, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "1.1rem" }}>✉️</span>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem" }}>AI Generated Email</div>
            </div>
            <button className="btn btn-outline" style={{ padding: "8px 16px", fontSize: "0.72rem" }} onClick={() => navigator.clipboard.writeText(email)}>
              📋 Copy
            </button>
          </div>
          <div className="hr" style={{ marginBottom: 18 }} />
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "rgba(232,232,240,0.8)", lineHeight: 1.7 }}>{email}</pre>
        </div>
      )}

      {/* ── SUGGESTIONS OUTPUT ── */}
      {suggestions && (
        <div className="card fade-up" style={{ padding: 28, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: "1.1rem" }}>💡</span>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem" }}>AI Skill Suggestions</div>
          </div>
          <div className="hr" style={{ marginBottom: 18 }} />
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "rgba(232,232,240,0.8)", lineHeight: 1.7 }}>{suggestions}</pre>
        </div>
      )}

      {/* ── CHAT WITH RESUME ── */}
      <div className="card fade-up" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(124,58,237,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>💬</div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem" }}>Chat With Resume</div>
            <div className="label" style={{ marginTop: 2 }}>Ask questions grounded in retrieved resume chunks</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "stretch" }}>
          <input
            className="field"
            placeholder="Ask about projects, skills, work experience, education..."
            value={chatQuestion}
            onChange={e => setChatQuestion(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !chatLoading) askResumeQuestion();
            }}
          />
          <button className="btn btn-primary" style={{ padding: "0 22px" }} onClick={askResumeQuestion} disabled={chatLoading}>
            {chatLoading ? <><span className="spin" style={{ display:"inline-block",width:14,height:14,border:"2px solid #02020a",borderTopColor:"transparent",borderRadius:"50%" }} /> Asking…</> : "Ask"}
          </button>
        </div>

        {chatAnswer && (
          <div style={{ marginTop: 20 }}>
            <div className="hr" style={{ marginBottom: 18 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div className="label" style={{ marginBottom: 8 }}>Answer</div>
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "rgba(232,232,240,0.84)", lineHeight: 1.7 }}>{chatAnswer}</pre>
              </div>
              <div>
                <div className="label" style={{ marginBottom: 8 }}>Retrieved Chunks</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {chatContext.map((chunk, index) => {
                    const source = chatSources[index];
                    const chunkIndex = source?.metadata?.chunk_index;

                    return (
                      <div key={`${source?.id || "chunk"}-${index}`} style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="label" style={{ marginBottom: 6 }}>
                          Chunk {typeof chunkIndex === "number" ? chunkIndex + 1 : index + 1} · Similarity {chunk.similarity ?? "—"}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.6 }}>{chunk.text}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── PRO TIPS ── */}
      <div className="card fade-up d4" style={{ padding: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem" }}>💡</div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.95rem" }}>Pro Tips</div>
            <div className="label" style={{ marginTop: 2 }}>Maximize your callbacks</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            ["01","Tailor every application","Generic resumes get 40% fewer callbacks than customized ones."],
            ["02","Use numbers","'Increased sales by 32%' beats 'improved sales performance' every time."],
            ["03","Beat the ATS","Use exact keywords from the job description in your resume."],
            ["04","One page rule","Unless you have 10+ years of experience, keep it tight and focused."],
          ].map(([num, title, text]) => (
            <div key={num} style={{ display: "flex", gap: 12, padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", transition: "background 0.2s" }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"}
            >
              <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg,var(--accent),#00cc88)", fontSize: "0.6rem", fontWeight: 800, color: "#02020a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, fontFamily: "var(--font-display)" }}>{num}</div>
              <div>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: 4, fontFamily: "var(--font-display)" }}>{title}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--muted)", lineHeight: 1.5 }}>{text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
