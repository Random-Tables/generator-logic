const rootIndex = {
  all: {},
  utility: {},
};
let generalIndex;
let issues = [];
const STR = {
  nonTableIssue: "A non-table item was passed inside buildIndex array",
  missingAsync: "table missing tableData & no asyncGet function passed"
};
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
    console.log(">>arr", arr.collectionID);
    const { collectionID, tables, tableData, category, version, required } =
      arr;
    const dataObject = {
      tables,
      tableData,
      category,
      version,
    };
	if(!tableData && !asyncGet) {
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

function buildIndex(arrayOfTableIndexes, onComplete, onError) {
  generalIndex = JSON.parse(JSON.stringify(rootIndex));
  issues = [];
  let requiredTables = [];
  // REQURSIVE
  function recursiveReqCall(array) {
    let required = addTableToIndex(array);
    if (required) requiredTables = requiredTables.concat(required);
    if (typeof array === "object" && array.requirements) {
      array.requirements.forEach(recursiveReqCall);
    }
  }

  try {
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
    console.log(">>>onComplete", Object.keys(generalIndex.all));
    console.log(">>issues", issues);
  } catch (e) {
    console.error("failed to build Index", e);
    onError();
    throw e;
  }

  return { generalIndex, issues };
}

module.exports = {
  buildIndex,
  appendIndex: function (indexObject) {},
  getCall: function (tableCallString) {},
  getCallNoAsync: function (tableCallString) {},
};
