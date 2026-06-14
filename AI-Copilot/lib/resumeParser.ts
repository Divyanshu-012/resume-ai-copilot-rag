import Groq from "groq-sdk";
import PDFParser from "pdf2json";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Extracts plain text from a PDF buffer using pdf2json
function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new (PDFParser as any)(null, 1);

    pdfParser.on("pdfParser_dataError", (err: any) => {
      reject(new Error(err.parserError));
    });

    pdfParser.on("pdfParser_dataReady", () => {
      // getRawTextContent() returns all text with form-feed separators between pages
      const raw: string = pdfParser.getRawTextContent();
      // Clean up: remove form-feed chars and collapse whitespace
      const text = raw
        .replace(/\f/g, "\n")
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim();
      resolve(text);
    });

    pdfParser.parseBuffer(buffer);
  });
}

export async function parseResume(buffer: Buffer) {
  // Step 1: extract real text from the PDF
  const text = await extractTextFromPDF(buffer);

  if (!text || text.length < 50) {
    return { text: "", skills: [] };
  }

  // Step 2: send clean text to Groq for skill extraction
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "You extract technical skills from resumes. Return ONLY a valid JSON array of skill strings, with no explanation or markdown.",
      },
      {
        role: "user",
        content: `Extract all technical skills from this resume.

Return ONLY a JSON array like: ["JavaScript","React","Node.js"]

Resume:
${text}`,
      },
    ],
  });

  let skills: string[] = [];

  try {
    const raw = completion.choices[0].message.content || "[]";
    // Strip any accidental markdown code fences before parsing
    const cleaned = raw.replace(/```json|```/g, "").trim();
    skills = JSON.parse(cleaned);
  } catch {
    skills = [];
  }

  return { text, skills };
}
