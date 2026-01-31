import { mockCashFlows } from '../src/mocks/cashflows.js';

const map = new Map();
const duplicates = [];
for (const cf of mockCashFlows) {
  const key = `${cf.investmentId}-${cf.date}-${cf.type}-${cf.amount}`;
  if (map.has(key)) duplicates.push({ original: map.get(key), duplicate: cf });
  else map.set(key, cf);
}
if (duplicates.length === 0) console.log('No exact-duplicate cashflows found.');
else console.log('Duplicates found:', JSON.stringify(duplicates, null, 2));
