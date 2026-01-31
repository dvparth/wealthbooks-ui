import { generateExpectedInterestSchedule } from '../src/utils/interestEngine.js';
import { mockInvestments } from '../src/mocks/investments.js';
import { mockCashFlows } from '../src/mocks/cashflows.js';

const printSchedule = (inv) => {
  const confirmed = mockCashFlows.filter(cf => cf.investmentId === inv.id && cf.status === 'confirmed');
  const schedule = generateExpectedInterestSchedule(inv, confirmed);
  console.log('='.repeat(80));
  console.log(`Investment: ${inv.externalInvestmentId || inv.id} (${inv.name})`);
  console.log(`Principal: ${inv.principal}, Rate: ${inv.interestRate}%, Start: ${inv.startDate}, Maturity: ${inv.maturityDate}`);
  console.log('Schedule:');
  schedule.forEach(row => {
    console.log(`  ${row.date} | ${row.type} | ${row.amount} | priority:${row.typePriority || '-'} ${row.periodNote ? '| ' + row.periodNote : ''}`);
  });

  // If maturity present, compare to expectedMaturityAmount
  const mat = schedule.find(r => r.type === 'maturity');
  if (mat) {
    console.log(`Maturity generated amount: ${mat.amount}`);
    console.log(`Investment.expectedMaturityAmount: ${inv.expectedMaturityAmount}`);
    const diff = Math.round((mat.amount - (inv.expectedMaturityAmount || 0)) * 100) / 100;
    console.log(`Difference (generated - expected): ${diff}`);
  }
  console.log('='.repeat(80));
}

(async function main(){
  for (const inv of mockInvestments) {
    try {
      printSchedule(inv);
    } catch (err) {
      console.error('Error generating schedule for', inv.externalInvestmentId || inv.id, err.message);
    }
  }
})();
