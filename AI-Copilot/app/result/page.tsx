interface ResultPageProps {
  searchParams: {
    score?: string;
    matched?: string;
    missing?: string;
  };
}

export default function ResultPage({ searchParams }: ResultPageProps) {
  const score = searchParams.score || "0";
  const matched = searchParams.matched ? searchParams.matched.split(",") : [];
  const missing = searchParams.missing ? searchParams.missing.split(",") : [];

  return (
    <div style={{ padding: 40 }}>
      <h1>Match Score: {score}%</h1>

      <h2>Matched Skills</h2>
      {matched.map((s) => (
        <div key={s}>{s}</div>
      ))}

      <h2>Missing Skills</h2>
      {missing.map((s) => (
        <div key={s}>{s}</div>
      ))}
    </div>
  );
}
