import { mockInvestments } from '../src/mocks/investments.js';

const args = process.argv.slice(2);
const externalId = args[0];
if (!externalId) {
  console.error('Usage: node scripts/computeInvestment.js <externalInvestmentId>');
  process.exit(1);
}

const inv = mockInvestments.find(i => i.externalInvestmentId === externalId);
if (!inv) {
  console.error('Investment not found:', externalId);
  process.exit(1);
}

const { principal, interestRate, startDate, maturityDate, interestCalculationFrequency } = inv;
const start = new Date(startDate);
const maturity = new Date(maturityDate);

const getMonthEnd = (year, month) => {
  return new Date(year, month + 1, 0);
};
const getNextQuarterEnd = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  if (month < 2) return getMonthEnd(year, 2); // Mar 31
  if (month < 5) return getMonthEnd(year, 5); // Jun 30
  if (month < 8) return getMonthEnd(year, 8); // Sep 30
  if (month < 11) return getMonthEnd(year, 11); // Dec 31
  return getMonthEnd(year + 1, 2);
};
const getFYEnd = (year) => getMonthEnd(year, 2);

const calculateInterestForPeriod = (periodStart, periodEnd, basePrincipal = principal) => {
  const days = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
  return (basePrincipal * interestRate * days) / (100 * 365);
};

const generateCalendarPeriods = () => {
  const periods = [];
  let periodStart = new Date(start);
  if (interestCalculationFrequency === 'quarterly') {
    while (periodStart < maturity) {
      let periodEnd = getNextQuarterEnd(periodStart);
      if (periodEnd > maturity) periodEnd = new Date(maturity);
      periods.push({ start: new Date(periodStart), end: new Date(periodEnd), isProrated: periodStart.getTime() === start.getTime() });
      if (periodEnd >= maturity) break;
      periodStart = new Date(periodEnd);
      periodStart.setDate(periodStart.getDate() + 1);
    }
  } else if (interestCalculationFrequency === 'yearly') {
    while (periodStart < maturity) {
      const year = periodStart.getFullYear();
      let periodEnd = getFYEnd(year);
      if (periodEnd <= periodStart) periodEnd = getFYEnd(year + 1);
      if (periodEnd > maturity) periodEnd = new Date(maturity);
      periods.push({ start: new Date(periodStart), end: new Date(periodEnd), isProrated: periodStart.getTime() === start.getTime() });
      if (periodEnd >= maturity) break;
      periodStart = new Date(periodEnd);
      periodStart.setDate(periodStart.getDate() + 1);
    }
  } else {
    // monthly
    while (periodStart < maturity) {
      const year = periodStart.getFullYear();
      const month = periodStart.getMonth();
      let periodEnd = getMonthEnd(year, month);
      if (periodEnd > maturity) periodEnd = new Date(maturity);
      periods.push({ start: new Date(periodStart), end: new Date(periodEnd), isProrated: periodStart.getTime() === start.getTime() });
      if (periodEnd >= maturity) break;
      periodStart = new Date(periodEnd);
      periodStart.setDate(periodStart.getDate() + 1);
    }
  }
  return periods;
};

const periods = generateCalendarPeriods();
let runningPrincipal = principal;
let idx = 0;
for (const p of periods) {
  idx += 1;
  const interest = calculateInterestForPeriod(p.start, p.end, runningPrincipal);
  console.log(`${idx}: ${p.start.toISOString().split('T')[0]} -> ${p.end.toISOString().split('T')[0]} | days=${Math.ceil((p.end - p.start)/(1000*60*60*24))} | base=${runningPrincipal.toFixed(2)} | interest=${interest.toFixed(2)}`);
  runningPrincipal = Math.round((runningPrincipal + interest) * 100) / 100;
}
console.log(`Maturity payout (principal + compounded interest): ${runningPrincipal}`);
