export function calculateMatch(
  resumeSkills: string[] = [],
  jdSkills: string[] = []
) {

  const normalizedResume = resumeSkills.map(s => s.toLowerCase());
  const normalizedJD = jdSkills.map(s => s.toLowerCase());

  const matched = normalizedJD.filter(skill =>
    normalizedResume.includes(skill)
  );

  const missing = normalizedJD.filter(skill =>
    !normalizedResume.includes(skill)
  );

  const score =
    normalizedJD.length === 0
      ? 0
      : Math.round((matched.length / normalizedJD.length) * 100);

  return {
    score,
    matched,
    missing
  };
}
