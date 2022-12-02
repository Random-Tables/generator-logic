const calls = require("./getCall.js");
const STR = require("./strings.js");

const rootIndex = {
  all: {},
  utility: {},
};
let generalIndex;
let issues = [];
let asyncGetFunction;

function addTableToIndex(arr, asyncGet) {
  asyncGetFunction = asyncGet;
  let categories = Object.keys(generalIndex);
  if (
    typeof arr === "object" &&
    arr.hasOwnProperty &&
    arr.hasOwnProperty("collectionID") &&
    arr.hasOwnProperty("tables")
  ) {
    const {
      collectionID,
      tables,
      tableData,
      category,
      version,
      required,
      isUtility,
    } = arr;
    const dataObject = {
      collectionID,
      tables,
      tableData,
      category,
      version,
      isUtility,
    };
    if (!tableData && !asyncGet) {
      if (!issues.includes(STR.missingAsync)) issues.push(STR.missingAsync);
    }
    if (arr.isUtility) {
      generalIndex.utility[collectionID] = dataObject;
    }
    generalIndex.all[collectionID] = dataObject;

    if (category) {
      if (!categories.includes(category)) {
        categories.push(category);
        generalIndex[category] = {};
      }
      generalIndex[category][collectionID] = dataObject;
    }

    if (required) return required;
  } else if (!issues.includes(STR.nonTableIssue)) {
    issues.push(STR.nonTableIssue);
  }
}

function buildIndex(
  arrayOfTableIndexes,
  rebuild,
  onComplete,
  onError,
  asyncGet
) {
  if (rebuild) {
    generalIndex = JSON.parse(JSON.stringify(rootIndex));
    issues = [];
  }
  let requiredTables = [];
  // RECURSIVE
  function recursiveReqCall(array) {
    let required = addTableToIndex(array, asyncGet);
    if (required) requiredTables = requiredTables.concat(required);
    if (typeof array === "object" && array.requirements) {
      array.requirements.forEach(recursiveReqCall);
    }
  }

  try {
    if (Array.isArray(arrayOfTableIndexes)) {
      arrayOfTableIndexes.forEach(recursiveReqCall);

      const tableIdArray = Object.keys(generalIndex.all);

      // add missing required tables to issues array
      requiredTables.forEach(function (req) {
        const [tableName, tableVersion] = req.split("@");
        if (tableIdArray.includes(tableName)) {
          if (
            tableVersion &&
            parseInt(generalIndex.all[tableName].version) < tableVersion
          ) {
            issues.push(
              "Table::" +
                tableName +
                " required at version::" +
                tableVersion +
                ", but is version::" +
                generalIndex.all[tableName].version
            );
          }
        } else {
          const errorString = "Missing table::" + req;
          if (!issues.includes(errorString)) issues.push(errorString);
        }
      });

      calls.setlocalIndex(generalIndex);
      if (onComplete) onComplete();
    } else {
      console.error("failed to build Index, should pass array");
      if (onError) onError(STR.tableNotArray);
    }
  } catch (e) {
    console.error("failed to build Index", e);
    if (onError) onError(e);
    throw e;
  }

  return { generalIndex, issues };
}

module.exports = {
  buildIndex: (arr, onComplete, onError, asyncGet) =>
    buildIndex(arr, true, onComplete, onError, asyncGet),
  appendIndex: (arr, onComplete, onError, asyncGet) =>
    buildIndex([arr], false, onComplete, onError, asyncGet),
  getCall: (tableCall) => calls.getCall(tableCall, asyncGetFunction),
};
