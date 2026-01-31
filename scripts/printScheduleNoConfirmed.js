import { generateExpectedInterestSchedule } from '../src/utils/interestEngine.js';
import { mockInvestments } from '../src/mocks/investments.js';

const externalId = process.argv[2];
if (!externalId) {
  console.error('Usage: node scripts/printScheduleNoConfirmed.js <externalInvestmentId>');
  process.exit(1);
}
const inv = mockInvestments.find(i => i.externalInvestmentId === externalId);
if (!inv) {
  console.error('Investment not found:', externalId);
  process.exit(1);
}
const schedule = generateExpectedInterestSchedule(inv, []);
console.log('Investment:', externalId);
schedule.forEach(r => console.log(`${r.date} | ${r.type} | ${r.amount} | ${r.label || ''}`));
