import { mockInvestments } from '../src/mocks/investments.js';
import { mockCashFlows } from '../src/mocks/cashflows.js';

const inv = mockInvestments.find(i => i.externalInvestmentId === '54EC2020A');
if (!inv) {
  console.error('Investment 54EC2020A not found');
  process.exit(1);
}
const cfs = mockCashFlows.filter(c => c.investmentId === inv.id && c.status === 'confirmed');
console.log('Investment:', inv.externalInvestmentId, inv.name);
console.log('Principal:', inv.principal, 'Rate:', inv.interestRate, 'Start:', inv.startDate, 'Maturity:', inv.maturityDate);
console.log('Confirmed cashflows:');
let totalInterest = 0;
let maturityAmount = 0;
for (const cf of cfs) {
  console.log(`  ${cf.date} | ${cf.type} | ${cf.amount}`);
  if (cf.type === 'interest') totalInterest += cf.amount;
  if (cf.type === 'maturity') maturityAmount += cf.amount;
}
console.log('Total confirmed interest:', totalInterest);
console.log('Confirmed maturity amount sum:', maturityAmount);
console.log('Principal + totalInterest =', inv.principal + totalInterest);
