import { mockCashFlows } from '../src/mocks/cashflows.js';

const tds = mockCashFlows.filter(cf => cf.type === 'tds' || cf.type === 'TDS' || cf.type === 'Tds');
let issues = [];
for (const t of tds) {
  const dateStr = t.date.split('T')[0];
  const relatedInterest = mockCashFlows.find(cf => cf.investmentId === t.investmentId && (cf.type === 'interest') && cf.date.split('T')[0] === dateStr && cf.status === t.status);
  if (!relatedInterest) {
    issues.push({ tds: t, problem: 'No matching interest on same date' });
    continue;
  }
  const expectedTds = Math.round(relatedInterest.amount * 0.2 * 100) / 100 * -1;
  if (Math.round(t.amount * 100) / 100 !== Math.round(expectedTds * 100) / 100) {
    issues.push({ tds: t, interest: relatedInterest, expectedTds });
  }
}

if (issues.length === 0) {
  console.log('All TDS entries match expected 20% of same-date interest.');
} else {
  console.log('TDS verification issues:');
  issues.forEach(i => console.log(JSON.stringify(i, null, 2)));
}
