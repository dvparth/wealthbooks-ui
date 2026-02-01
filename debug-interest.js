const start = new Date('2024-09-19');
const maturity = new Date('2025-12-07');

// Compute quarterly compounded amount
let amount = 457779;
const rate = 7.75;

// Quarter ends: Mar 31, Jun 30, Sep 30, Dec 31
const quarterEnds = [
  new Date(2024, 8, 30),  // Sep 30
  new Date(2024, 11, 31), // Dec 31
  new Date(2025, 2, 31),  // Mar 31
  new Date(2025, 5, 30),  // Jun 30
  new Date(2025, 8, 30),  // Sep 30
];

console.log('Start:', start.toISOString().split('T')[0]);
console.log('Maturity:', maturity.toISOString().split('T')[0]);
console.log('---');

// Verify which quarters fall strictly before maturity
const validQuarters = quarterEnds.filter(q => q < maturity);
console.log('Valid quarters before maturity:', validQuarters.length);
validQuarters.forEach((q, i) => {
  console.log('  Q' + (i+1) + ': ' + q.toISOString().split('T')[0]);
});

// Apply quarterly compounding
for (const q of validQuarters) {
  const oldAmount = amount;
  amount = amount * (1 + rate / 400);
  console.log('After ' + q.toISOString().split('T')[0] + ': ₹' + Math.round(amount).toLocaleString('en-IN'));
}

// Remainder days
const lastQuarter = validQuarters[validQuarters.length - 1];
const remDays = Math.ceil((maturity - lastQuarter) / (1000 * 60 * 60 * 24));
const remInterest = amount * rate * (remDays / 36500);

console.log('---');
console.log('After compounding: ₹' + Math.round(amount).toLocaleString('en-IN'));
console.log('Remainder days:', remDays);
console.log('Remainder interest: ₹' + Math.round(remInterest).toLocaleString('en-IN'));
console.log('Final maturity: ₹' + Math.round(amount + remInterest).toLocaleString('en-IN'));
console.log('Total interest: ₹' + Math.round(amount + remInterest - 457779).toLocaleString('en-IN'));
console.log('Expected maturity: ₹502593');
