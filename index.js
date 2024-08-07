require("dotenv").config();

const assert = require("assert");

const {
  bulkFlatCheck,
  graphFilterCheck,
  singleCheck,
} = require("./lib/checks");
const {
  flatSync,
  graphSync,
  clearAllInstances,
  syncRego,
  syncUser,
  allowedVisitConditionSet,
} = require("./lib/sync");

const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  await syncUser();
  await syncRego("reset");

  await clearAllInstances();
  await flatSync();
  await sleep(10000);
  const flatFilterResult = await bulkFlatCheck();
  console.log("Flat filter result: ", JSON.stringify(flatFilterResult));
  assert.deepEqual(flatFilterResult, [true, false, false, false, true, true]);

  await clearAllInstances();
  await graphSync();
  await sleep(10000);
  const graphFilterResult = await graphFilterCheck();
  console.log("Graph filter result: ", JSON.stringify(graphFilterResult));
  assert.deepEqual(graphFilterResult, [true, false, false, false, true, true]);

  await syncRego("custom");
  await clearAllInstances();
  await flatSync();
  await sleep(10000);
  const customRegoResult = await singleCheck();
  console.log("Custom rego check result: ", JSON.stringify(customRegoResult));
  assert.deepEqual(customRegoResult, [true, false, false, false, true, true]);

  await clearAllInstances();
  await allowedVisitConditionSet();
  await flatSync();
  await sleep(10000);
  const singleCheckResult = await singleCheck();
  console.log("Single check result: ", JSON.stringify(singleCheckResult));
  assert.deepEqual(singleCheckResult, [true, false, false, false, true, true]);
})();
