import React, { useEffect, useState } from 'react';
export default function EscrowDisputeScore() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/escrow-dispute-score').then(r => r.json()).then(setData).catch(() => {}); }, []);
  return <div><h1>Escrow Dispute Score</h1><p>Prioritizes marketplace escrow holds by dispute amount, lateness, evidence, and seller history.</p>{data?.disputes?.map(d => <section className="card" key={d.order}><h2>{d.order}</h2><p>{d.action} - score {d.dispute_score}</p></section>)}</div>;
}
