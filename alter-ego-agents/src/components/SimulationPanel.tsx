"use client";

export default function SimulationPanel() {
  return (
    <section style={{ marginBottom: 16 }}>
      <label htmlFor="scenario">Scenario</label>
      <textarea id="scenario" rows={4} style={{ display: "block", width: "100%", marginTop: 8 }} />
      <button type="button" style={{ marginTop: 8, padding: "8px 12px" }}>
        Run Simulation
      </button>
    </section>
  );
}
