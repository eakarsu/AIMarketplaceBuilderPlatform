const express = require('express');
const router = express.Router();
function score(input = {}) {
  const disputes = input.disputes || [
    { order: 'ORD-88', amount: 420, late_days: 6, evidence_count: 2, repeat_seller_flags: 3 },
    { order: 'ORD-91', amount: 35, late_days: 0, evidence_count: 5, repeat_seller_flags: 0 },
  ];
  return { disputes: disputes.map(d => {
    const risk = Math.min(100, Number(d.amount) / 12 + Number(d.late_days) * 6 + Number(d.repeat_seller_flags) * 14 - Number(d.evidence_count) * 4);
    return { ...d, dispute_score: Math.round(risk), action: risk >= 60 ? 'hold_escrow_and_review' : risk >= 30 ? 'request_more_evidence' : 'release' };
  }) };
}
router.get('/', (req, res) => res.json(score()));
router.post('/score', (req, res) => res.json(score(req.body || {})));
module.exports = router;
