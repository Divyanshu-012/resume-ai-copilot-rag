import { calculateMatch } from "@/lib/skillMatcher";

export async function POST(req: Request){

 const { resumeSkills, jdSkills } = await req.json();

 const result = calculateMatch(resumeSkills, jdSkills);

 return Response.json(result);

}
