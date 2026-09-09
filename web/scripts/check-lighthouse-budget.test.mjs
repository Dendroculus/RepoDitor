import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateLighthouse,
  LIGHTHOUSE_BUDGET,
  LIGHTHOUSE_RUNS,
} from "./check-lighthouse-budget.mjs";

function report(performance = 0.95, accessibility = 1) {
  return {
    categories: {
      accessibility: { score: accessibility },
      "best-practices": { score: 1 },
      performance: { score: performance },
      seo: { score: 1 },
    },
  };
}

test("accepts five reports meeting every budget", () => {
  const result = evaluateLighthouse(
    "desktop",
    Array.from({ length: LIGHTHOUSE_RUNS }, () => report()),
  );
  assert.deepEqual(result.failures, []);
  assert.equal(result.mean, 95);
});

test("keeps the blocking budget unchanged", () => {
  assert.deepEqual(LIGHTHOUSE_BUDGET, {
    accessibilityMin: 100,
    bestPracticesMin: 100,
    performanceMeanMin: 95,
    performanceRunMin: 90,
    runCount: 5,
    seoMin: 100,
  });
});

test("uses the arithmetic performance mean without rounding", () => {
  const result = evaluateLighthouse(
    "mobile",
    [0.9, 0.95, 0.95, 0.95, 1].map((performance) => report(performance)),
  );
  assert.equal(result.mean, 95);
  assert.deepEqual(result.failures, []);

  const below = evaluateLighthouse(
    "mobile",
    [0.94, 0.94, 0.94, 0.94, 0.98].map((performance) => report(performance)),
  );
  assert.equal(below.mean, 94.8);
  assert.ok(below.failures.some((failure) => failure.includes("performance mean")));
});

test("reports run count, mean, floor, and exact category failures", () => {
  assert.throws(() => evaluateLighthouse("mobile", [report()]), /expected 5 reports/u);
  const result = evaluateLighthouse("mobile", [
    report(0.89, 0.99),
    report(0.95),
    report(0.95),
    report(0.95),
    report(0.95),
  ]);
  assert.ok(result.failures.some((failure) => failure.includes("performance mean")));
  assert.ok(result.failures.some((failure) => failure.includes("performance floor")));
  assert.ok(result.failures.some((failure) => failure.includes("accessibility run 1")));
});

test("does not round a category score up to 100", () => {
  const reports = Array.from({ length: LIGHTHOUSE_RUNS }, () => report(0.95, 0.999));
  assert.ok(
    evaluateLighthouse("desktop", reports).failures.some((failure) =>
      failure.includes("accessibility run 1"),
    ),
  );
});
