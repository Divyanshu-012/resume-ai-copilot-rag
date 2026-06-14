const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function parseError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return data.detail || data.error || fallback;
  } catch {
    return fallback;
  }
}

export type IngestResult = {
  resume_id: string;
  skills: string[];
  chunks: number;
  text_length: number;
  message: string;
};

export type RagChunk = {
  text: string;
  similarity: number | null;
};

export type AnalyzeResult = {
  resume_id: string;
  jd_skills: string[];
  resume_skills: string[];
  match: {
    score: number;
    matched: string[];
    missing: string[];
    semantic_matches: { jd_skill: string; resume_skill: string; similarity: string }[];
  };
  rag_context: RagChunk[];
  analysis: string;
};

export async function ingestResume(file: File): Promise<IngestResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/resume/ingest`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Resume ingest failed"));
  }

  return response.json();
}

export async function analyzeApplication(
  resumeId: string,
  jd: string,
  resumeSkills: string[]
): Promise<AnalyzeResult> {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resume_id: resumeId,
      jd,
      resume_skills: resumeSkills,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Analysis failed"));
  }

  return response.json();
}

export async function generateEmail(
  resumeId: string,
  jd: string,
  resumeSkills: string[]
): Promise<{ email: string; rag_context: RagChunk[] }> {
  const response = await fetch(`${API_BASE}/ai/generate-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resume_id: resumeId,
      jd,
      resume_skills: resumeSkills,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Email generation failed"));
  }

  return response.json();
}

export async function generateSuggestions(
  missingSkills: string[],
  jd: string,
  resumeId: string
): Promise<{ suggestions: string; rag_context: RagChunk[] }> {
  const response = await fetch(`${API_BASE}/ai/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      missing_skills: missingSkills,
      jd,
      resume_id: resumeId,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Suggestions failed"));
  }

  return response.json();
}

export async function semanticSearch(query: string, resumeId?: string) {
  const response = await fetch(`${API_BASE}/search/semantic`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      resume_id: resumeId,
      top_k: 5,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, "Semantic search failed"));
  }

  return response.json();
}
