import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const { jd } = await req.json();

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: "Generate 5 interview questions based on job description."
      },
      {
        role: "user",
        content: jd
      }
    ]
  });

  return Response.json({
    questions: completion.choices[0].message.content
  });
}
