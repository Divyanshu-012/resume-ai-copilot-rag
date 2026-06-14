import Groq from "groq-sdk";

export async function POST(req: Request) {
  try {

    const { resumeText, jd } = await req.json();

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", 
      messages: [
        {
          role: "system",
          content: "You help job seekers write short recruiter cold emails."
        },
        {
          role: "user",
          content: `
Write a short recruiter cold email.

Resume Skills:
${resumeText}

Job Description:
${jd}
`
        }
      ]
    });

    return Response.json({
      email: completion.choices[0].message.content
    });

  } catch (error) {

    console.error("AI EMAIL ERROR:", error);

    return Response.json(
      { error: "Email generation failed" },
      { status: 500 }
    );

  }
}
