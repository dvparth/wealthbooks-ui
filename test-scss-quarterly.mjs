import { generateExpectedInterestSchedule } from './src/utils/interestEngine.js';
import { mockInvestments } from './src/mocks/investments.js';
import { mockCashFlows } from './src/mocks/cashflows.js';

// Find SCSS_ST002 investment
const investment = mockInvestments.find(inv => inv.externalInvestmentId === 'SCSS_ST002');

if (!investment) {
  console.error('SCSS_ST002 investment not found');
  process.exit(1);
}

console.log('\n================== SCSS_ST002 CALENDAR QUARTER TEST ==================');
console.log(`Investment: SCSS_ST002`);
console.log(`Start Date: ${investment.startDate}`);
console.log(`Maturity Date: ${investment.maturityDate}`);
console.log(`Calculation: ${investment.interestCalculationFrequency}`);
console.log(`Payout: ${investment.interestPayoutFrequency}`);
console.log('');

// Get confirmed cashflows for this investment
const confirmedCFs = mockCashFlows.filter(cf => cf.investmentId === investment.id && cf.type === 'interest' && cf.status === 'confirmed');

console.log('CONFIRMED INTEREST CASHFLOWS:');
console.log('=============================');
confirmedCFs.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach((cf, idx) => {
  const d = new Date(cf.date);
  const day = d.getDate();
  const month = d.toLocaleString('en-IN', { month: 'short' });
  const year = d.getFullYear();
  const dayName = d.toLocaleString('en-IN', { weekday: 'short' });
  console.log(`${idx + 1}. ${day} ${month} ${year} (${dayName}) - ₹${cf.amount.toFixed(2)}`);
});

console.log('');
console.log('GENERATED EXPECTED SCHEDULE:');
console.log('=============================');

// Generate expected schedule
const expected = generateExpectedInterestSchedule(investment, mockCashFlows);
const expectedInterest = expected.filter(cf => cf.type === 'interest');

expectedInterest.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach((cf, idx) => {
  const d = new Date(cf.date);
  const day = d.getDate();
  const month = d.toLocaleString('en-IN', { month: 'short' });
  const year = d.getFullYear();
  const dayName = d.toLocaleString('en-IN', { weekday: 'short' });
  console.log(`${idx + 1}. ${day} ${month} ${year} (${dayName}) - ₹${cf.amount.toFixed(2)} | ${cf.label}`);
});

console.log('');
console.log('VALIDATION RULES:');
console.log('=================');

// Rule 1: All interest dates must be calendar quarter ends
const quarterEnds = [31, 30, 31, 30]; // Mar 31, Jun 30, Sep 30, Dec 31
const quarterMonths = [3, 6, 9, 12];

const allInterestDates = [...confirmedCFs, ...expectedInterest].map(cf => new Date(cf.date));
let allOnQuarterEnds = true;

allInterestDates.forEach(date => {
  const isQuarterEnd = (date.getDate() === 31 && date.getMonth() === 2) || // 31 Mar
                       (date.getDate() === 30 && date.getMonth() === 5) || // 30 Jun
                       (date.getDate() === 30 && date.getMonth() === 8) || // 30 Sep
                       (date.getDate() === 31 && date.getMonth() === 11);  // 31 Dec
  
  if (!isQuarterEnd) {
    allOnQuarterEnds = false;
    console.log(`✗ FAIL: ${date.toISOString().split('T')[0]} is NOT a calendar quarter end`);
  }
});

if (allOnQuarterEnds) {
  console.log(`✓ PASS: All interest dates align to calendar quarter ends`);
}

// Rule 2: First period should be 30 Sept 2023 (from 18 Sept start)
const firstConfirmedDate = confirmedCFs.length > 0 ? confirmedCFs[0].date : null;
if (firstConfirmedDate === '2023-09-30') {
  console.log(`✓ PASS: First confirmed interest on 30 Sep 2023 (quarter end)`);
} else {
  console.log(`✗ FAIL: First confirmed interest expected 2023-09-30, got ${firstConfirmedDate}`);
}

// Rule 3: Sequence should be Sept → Dec → Mar → Jun → Sept
const expectedSequence = ['2023-09-30', '2023-12-31', '2024-03-31', '2024-06-30', '2024-09-30'];
const actualSequence = confirmedCFs.map(cf => cf.date);
const sequenceMatch = expectedSequence.every((date, idx) => actualSequence[idx] === date);

if (sequenceMatch) {
  console.log(`✓ PASS: Quarterly sequence follows calendar ends exactly`);
} else {
  console.log(`✗ FAIL: Quarterly sequence does not match calendar ends`);
  console.log(`  Expected: ${expectedSequence.join(' → ')}`);
  console.log(`  Got:      ${actualSequence.join(' → ')}`);
}

console.log('');
console.log('========================================================================\n');
