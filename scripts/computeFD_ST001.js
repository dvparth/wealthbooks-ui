import fs from 'fs';

const principal = 750000;
const rate = 6.75/100; // annual
const start = new Date('2024-08-23T00:00:00');
const maturity = new Date('2025-12-01T00:00:00');

const getMonthEnd = (year, month) => {
  const d = new Date(Date.UTC(year, month+1, 1));
  d.setUTCSeconds(d.getUTCSeconds() - 1);
  return d;
};
const getNextQuarterEnd = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  if (month < 2) return getMonthEnd(year, 2);
  if (month < 5) return getMonthEnd(year, 5);
  if (month < 8) return getMonthEnd(year, 8);
  if (month < 11) return getMonthEnd(year, 11);
  return getMonthEnd(year+1, 2);
};

const msPerDay = 1000*60*60*24;

let periodStart = new Date(start);
const periods = [];
while (periodStart < maturity) {
  let periodEnd = getNextQuarterEnd(periodStart);
  if (periodEnd > maturity) periodEnd = new Date(maturity);
  periods.push({start: new Date(periodStart), end: new Date(periodEnd)});
  if (periodEnd >= maturity) break;
  periodStart = new Date(periodEnd);
  periodStart.setDate(periodStart.getDate() + 1);
}

let runningPrincipal = principal;
console.log('Periods and compounding for FD_ST001');
periods.forEach((p, idx) => {
  const diff = Math.ceil((p.end - p.start)/msPerDay);
  const interest = Math.round((runningPrincipal * rate * diff / 365) * 100) / 100;
  console.log(`${idx+1}: ${p.start.toISOString().split('T')[0]} -> ${p.end.toISOString().split('T')[0]} | days=${diff} | base=${runningPrincipal.toFixed(2)} | interest=${interest.toFixed(2)}`);
  runningPrincipal = Math.round((runningPrincipal + interest) * 100) / 100;
});
console.log('Final runningPrincipal (maturity payout):', runningPrincipal.toFixed(2));
