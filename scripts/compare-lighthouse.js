import fs from 'fs';
import path from 'path';

const baselinePath = process.argv[2] || '.lighthouseci/baseline.json';
const currentPath = process.argv[3] || '.lighthouseci/current.json';

const loadReport = (filePath) => {
  if (!fs.existsSync(filePath)) {
    console.error(`Report not found: ${filePath}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(filePath));
};

const extractMetrics = (report) => ({
  performance: Math.round(report.categories.performance.score * 100),
  fcp: Math.round(report.audits['first-contentful-paint'].numericValue),
  lcp: Math.round(report.audits['largest-contentful-paint'].numericValue),
  tbt: Math.round(report.audits['total-blocking-time'].numericValue),
  cls: parseFloat(report.audits['cumulative-layout-shift'].numericValue.toFixed(3)),
  speedIndex: Math.round(report.audits['speed-index'].numericValue),
});

const baseline = loadReport(baselinePath);
const current = loadReport(currentPath);

const baselineMetrics = extractMetrics(baseline);
const currentMetrics = extractMetrics(current);

console.log('\n📊 Lighthouse Performance Comparison\n');
console.log('Metric'.padEnd(20), 'Baseline'.padEnd(15), 'Current'.padEnd(15), 'Change');
console.log('-'.repeat(70));

const metrics = ['performance', 'fcp', 'lcp', 'tbt', 'cls', 'speedIndex'];
metrics.forEach(metric => {
  const base = baselineMetrics[metric];
  const curr = currentMetrics[metric];
  const change = metric === 'performance' || metric === 'cls'
    ? `${((curr - base) / base * 100).toFixed(1)}%`
    : `${((base - curr) / base * 100).toFixed(1)}% faster`;
  
  const changeValue = metric === 'performance' || metric === 'cls'
    ? curr - base
    : base - curr;
  
  const indicator = changeValue > 0 ? '✅' : '❌';
  
  console.log(
    `${indicator} ${metric.padEnd(17)}`,
    String(base).padEnd(15),
    String(curr).padEnd(15),
    change
  );
});

