type ResultBriefProps = {
  result: string;
};

export default function ResultBrief({ result }: ResultBriefProps) {
  return (
    <section style={{ borderTop: "1px solid #eee", paddingTop: 12 }}>
      <h3>Result Brief</h3>
      <p>{result}</p>
    </section>
  );
}
