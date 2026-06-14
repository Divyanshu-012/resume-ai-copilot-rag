import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {
    const { jd } = await req.json();

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You extract required technical skills from job descriptions. Return ONLY a valid JSON array of skill strings, with no explanation or markdown.",
        },
        {
          role: "user",
          content: `Extract all required technical skills from this job description.

Return ONLY a JSON array like: ["JavaScript","React","Node.js"]

Job Description:
${jd}`,
        },
      ],
    });

    let jdSkills: string[] = [];
    try {
      const raw = completion.choices[0].message.content || "[]";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      jdSkills = JSON.parse(cleaned);
    } catch {
      jdSkills = [];
    }

    return Response.json({ jdSkills });
  } catch (error) {
    console.error("ANALYZE JD ERROR:", error);
    return Response.json({ error: "Failed to analyze JD" }, { status: 500 });
  }
}
