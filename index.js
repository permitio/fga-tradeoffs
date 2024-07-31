require("dotenv").config();

const assert = require("assert");

const {
  bulkFlatCheck,
  graphFilterCheck,
  customRegoSingleCheck,
} = require("./checks");
const {
  flatSync,
  graphSync,
  clearAllInstances,
  syncRego,
  syncUser,
} = require("./sync");

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
  const customRegoResult = await customRegoSingleCheck();
  console.log("Custom rego check result: ", JSON.stringify(customRegoResult));
  assert.deepEqual(customRegoResult, [true, false, false, false, true, true]);
})();
