import { mockInvestments } from '../src/mocks/investments.js';
import { mockCashFlows } from '../src/mocks/cashflows.js';

const reinvestments = mockCashFlows.filter(cf => cf.type === 'reinvestment' || cf.type === 'REINVESTMENT');
const issues = [];
for (const r of reinvestments) {
  const targetId = r.reinvestedInvestmentId;
  const target = mockInvestments.find(i => i.id === targetId || i.externalInvestmentId === targetId);
  if (!target) {
    issues.push({ type: 'missing-target', cashflow: r });
    continue;
  }
  // Check sign: reinvestment in source should be negative (outflow), and target principal should be positive
  if (Number(r.amount) >= 0) {
    issues.push({ type: 'unexpected-sign', cashflow: r, note: 'expected reinvestment amount to be negative (outflow from source)'});
  }
  // Check date relation: target startDate should be <= reinvestment date or near
  const reinvDate = new Date(r.date).getTime();
  const targetStart = new Date(target.startDate).getTime();
  if (Math.abs(reinvDate - targetStart) > 1000 * 60 * 60 * 24 * 365) {
    // More than a year diff — flag for review
    issues.push({ type: 'date-mismatch', cashflow: r, targetStart: target.startDate, note: 'reinvestment date far from target start date' });
  }
}

if (issues.length === 0) {
  console.log('No reinvestment reference issues found.');
} else {
  console.log('Reinvestment issues:');
  console.log(JSON.stringify(issues, null, 2));
}
