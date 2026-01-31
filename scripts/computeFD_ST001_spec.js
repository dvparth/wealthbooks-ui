const msPerDay = 1000*60*60*24;
const rate = 6.75/100;
let runningPrincipal = 750000;

const periods = [
  {start: new Date('2024-08-23T00:00:00'), end: new Date('2024-09-30T23:59:59')},
  {start: new Date('2024-10-01T00:00:00'), end: new Date('2024-12-31T23:59:59')},
  {start: new Date('2025-01-01T00:00:00'), end: new Date('2025-03-31T23:59:59')},
  {start: new Date('2025-04-01T00:00:00'), end: new Date('2025-06-30T23:59:59')},
];

console.log('Compute compounded interest for FD_ST001 (specified confirmed periods)');
let i = 1;
for (const p of periods) {
  const days = Math.ceil((p.end - p.start)/msPerDay);
  const interest = Math.round((runningPrincipal * rate * days / 365) * 100) / 100;
  console.log(`${i}: ${p.start.toISOString().split('T')[0]} -> ${p.end.toISOString().split('T')[0]} | days=${days} | base=${runningPrincipal.toFixed(2)} | interest=${interest.toFixed(2)}`);
  runningPrincipal = Math.round((runningPrincipal + interest) * 100) / 100;
  i++;
}
// Final partial period to maturity: 2025-07-01 -> 2025-12-01 (inclusive end at 2025-12-01T00:00:00 assumed)
const finalStart = new Date('2025-07-01T00:00:00');
const finalEnd = new Date('2025-12-01T00:00:00');
const finalDays = Math.ceil((finalEnd - finalStart)/msPerDay);
const finalInterest = Math.round((runningPrincipal * rate * finalDays / 365) * 100) / 100;
console.log(`Final: ${finalStart.toISOString().split('T')[0]} -> ${finalEnd.toISOString().split('T')[0]} | days=${finalDays} | base=${runningPrincipal.toFixed(2)} | interest=${finalInterest.toFixed(2)}`);
runningPrincipal = Math.round((runningPrincipal + finalInterest) * 100) / 100;
console.log('Maturity payout (principal + all compounded interest):', runningPrincipal.toFixed(2));
