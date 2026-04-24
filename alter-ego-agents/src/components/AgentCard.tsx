type AgentCardProps = {
  title: string;
  description: string;
};

export default function AgentCard({ title, description }: AgentCardProps) {
  return (
    <section style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, maxWidth: 480 }}>
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}
