import { parseResume } from "@/lib/resumeParser";

export async function POST(req: Request) {
  try {

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await parseResume(buffer);

    return Response.json(result);

  } catch (error) {
    console.error("PARSE RESUME ERROR:", error);

    return Response.json(
      { error: "Resume parsing failed" },
      { status: 500 }
    );
  }
}
