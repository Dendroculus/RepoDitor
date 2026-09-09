import { readFile } from "node:fs/promises";

export const LIGHTHOUSE_BUDGET = Object.freeze({
  accessibilityMin: 100,
  bestPracticesMin: 100,
  performanceMeanMin: 95,
  performanceRunMin: 90,
  runCount: 5,
  seoMin: 100,
});
export const LIGHTHOUSE_RUNS = LIGHTHOUSE_BUDGET.runCount;

function score(report, category) {
  const value = report.categories?.[category]?.score;
  if (typeof value !== "number") {
    throw new Error(`Lighthouse report is missing ${category}.`);
  }
  return value * 100;
}

export function evaluateLighthouse(profile, reports) {
  if (reports.length !== LIGHTHOUSE_RUNS) {
    throw new Error(`${profile}: expected ${LIGHTHOUSE_RUNS} reports, received ${reports.length}.`);
  }

  const performance = reports.map((report) => score(report, "performance"));
  const failures = [];
  const mean = performance.reduce((total, value) => total + value, 0) / performance.length;
  if (mean < LIGHTHOUSE_BUDGET.performanceMeanMin)
    failures.push(`performance mean ${mean.toFixed(1)} < ${LIGHTHOUSE_BUDGET.performanceMeanMin}`);
  if (Math.min(...performance) < LIGHTHOUSE_BUDGET.performanceRunMin)
    failures.push(
      `performance floor ${Math.min(...performance)} < ${LIGHTHOUSE_BUDGET.performanceRunMin}`,
    );

  for (const [category, minimum] of [
    ["accessibility", LIGHTHOUSE_BUDGET.accessibilityMin],
    ["best-practices", LIGHTHOUSE_BUDGET.bestPracticesMin],
    ["seo", LIGHTHOUSE_BUDGET.seoMin],
  ]) {
    reports.forEach((report, index) => {
      const value = score(report, category);
      if (value < minimum) failures.push(`${category} run ${index + 1}: ${value} < ${minimum}`);
    });
  }

  return { failures, mean, performance, profile };
}

export async function readAndEvaluateLighthouse(profile, paths) {
  const reports = await Promise.all(
    paths.map(async (path) => JSON.parse(await readFile(path, "utf8"))),
  );
  return evaluateLighthouse(profile, reports);
}
