import { generateExpectedInterestSchedule } from './src/utils/interestEngine.js';
import { mockInvestments } from './src/mocks/investments.js';

// Find FD-QUARTER-TEST investment
const investment = mockInvestments.find(inv => inv.externalInvestmentId === 'FD-QUARTER-TEST');

if (!investment) {
  console.error('FD-QUARTER-TEST investment not found');
  process.exit(1);
}

console.log('Testing FD-QUARTER-TEST Investment:');
console.log('=====================================');
console.log(`Principal: ${investment.principal}`);
console.log(`Rate: ${investment.interestRate}%`);
console.log(`Start Date: ${investment.startDate}`);
console.log(`Maturity Date: ${investment.maturityDate}`);
console.log(`Calculation: ${investment.interestCalculationFrequency}`);
console.log(`Payout: ${investment.interestPayoutFrequency}`);
console.log('');

// Generate schedule
const schedule = generateExpectedInterestSchedule(investment, []);

console.log('Generated Interest Schedule:');
console.log('----------------------------');
schedule.forEach((cf, index) => {
  const date = new Date(cf.date);
  const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  console.log(`${index + 1}. ${dateStr} | ${cf.type.padEnd(12)} | ₹${cf.amount.toFixed(2).padStart(10)} | ${cf.label}`);
  if (cf.periodNote) {
    console.log(`   └─ ${cf.periodNote}`);
  }
});

console.log('');
console.log('VALIDATION CHECKS:');
console.log('==================');

// Check 1: First interest date should be 31 Mar 2026
const firstInterest = schedule.find(cf => cf.type === 'interest' || cf.type === 'accrued');
if (firstInterest) {
  const firstDate = new Date(firstInterest.date);
  const expectedDate = new Date('2026-03-31');
  const match = firstDate.toDateString() === expectedDate.toDateString();
  console.log(`✓ First period ends 31-Mar-2026: ${match ? 'PASS' : 'FAIL'} (got ${firstDate.toDateString()})`);
  
  // Check 2: First interest amount (prorated 59 days: Feb 1-Mar 31)
  // 100,000 × 7% × 59/365 = 1,131.51
  const expectedAmount = 100000 * 0.07 * 59 / 365;
  const amountMatch = Math.abs(firstInterest.amount - expectedAmount) < 0.1;
  console.log(`✓ First amount ~1,131.51: ${amountMatch ? 'PASS' : 'FAIL'} (got ₹${firstInterest.amount.toFixed(2)})`);
}

// Check 3: Should have quarterly periods (Jun 30, Sep 30, Dec 31)
const interestDates = schedule
  .filter(cf => cf.type === 'interest' || cf.type === 'accrued' || cf.type === 'maturity')
  .map(cf => new Date(cf.date));

const jun30 = interestDates.some(d => d.getMonth() === 5 && d.getDate() === 30);
const sep30 = interestDates.some(d => d.getMonth() === 8 && d.getDate() === 30);
const dec31 = interestDates.some(d => d.getMonth() === 11 && d.getDate() === 31);

console.log(`✓ Has Jun 30 period: ${jun30 ? 'PASS' : 'FAIL'}`);
console.log(`✓ Has Sep 30 period: ${sep30 ? 'PASS' : 'FAIL'}`);
console.log(`✓ Has Dec 31 period: ${dec31 ? 'PASS' : 'FAIL'}`);

console.log('');
console.log('All tests completed!');
