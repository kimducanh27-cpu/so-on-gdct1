import fs from 'node:fs';

const css = fs.readFileSync(new URL('../assets/landing.css', import.meta.url), 'utf8');
const tokens = Object.fromEntries(
  [...css.matchAll(/--([a-z-]+):\s*(#[0-9A-Fa-f]{6})\b/g)].map((m) => [m[1], m[2]])
);

function luminance(hex) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const linear = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const pairs = [
  ['ink', 'paper', 4.5, 'body text'],
  ['muted', 'paper', 4.5, 'body text'],
  ['green', 'paper', 4.5, 'link/label'],
  ['ink', 'paper-deep', 4.5, 'footer text'],
  ['muted', 'paper-deep', 4.5, 'footer text'],
  ['green', 'paper-deep', 4.5, 'footer text'],
  ['ink', 'paper-soft', 4.5, 'body text'],
  ['muted', 'paper-soft', 4.5, 'body text'],
  ['green', 'paper-soft', 4.5, 'link/label'],
  ['on-green', 'green', 4.5, 'answers band'],
  ['on-green-soft', 'green', 4.5, 'answers band'],
  ['amber', 'paper', 4.5, 'accent'],
  ['rust', 'paper', 3, 'large text + focus ring'],
  ['rust', 'paper-deep', 3, 'large text + focus ring'],
  ['rust', 'paper-soft', 3, 'large text + focus ring'],
];

let failed = 0;
for (const [fg, bg, min, use] of pairs) {
  if (!tokens[fg] || !tokens[bg]) {
    console.error(`MISSING token ${!tokens[fg] ? fg : bg}`);
    failed++;
    continue;
  }
  const value = ratio(tokens[fg], tokens[bg]);
  const pass = value >= min;
  if (!pass) failed++;
  console.log(
    `${pass ? 'PASS' : 'FAIL'} ${fg} on ${bg}: ${value.toFixed(2)} (min ${min}, ${use})`
  );
}

if (failed) {
  console.error(`${failed} contrast pair(s) failed`);
  process.exit(1);
}
console.log('All contrast pairs pass');
