import Groq from "groq-sdk";

export async function POST(req: Request) {

  try {

    const { missingSkills } = await req.json();

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a helpful career mentor for software engineers."
        },
        {
          role: "user",
          content: `A candidate is missing these skills:

${missingSkills.join(", ")}

Suggest how they can learn or improve these skills quickly. Give practical advice.`
        }
      ]
    });

    return Response.json({
      suggestions: completion.choices[0].message.content
    });

  } catch (error) {

    console.error("SUGGESTION ERROR:", error);

    return Response.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );

  }

}
