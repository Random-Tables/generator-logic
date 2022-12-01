const STR = require("./strings.js");

let localIndex;

function setlocalIndex(i) {
  localIndex = i;
}

const Splitters = {
  number: "Number#",
  dice: "D#",
  an: "#AN",
  uppercase: "#UP",
};

const callRegex = /\{{(.*?)\}}/g;

async function regexToGetCall(regexString) {
  const removeCurlyBraces = regexString.substring(2, regexString.length - 2);
  const [callString, defaultValue] = removeCurlyBraces.includes(":")
    ? removeCurlyBraces.split(":")
    : [removeCurlyBraces, ""];
  try {
    const getCallData = await getCall(callString);
    return getCallData;
  } catch (e) {
    console.error("regexToGetCall::", e);
    return defaultValue;
  }
}

function recursiveStringCheck(tableString) {
  return new Promise((resolve, reject) => {
    if (typeof tableString === "string") {
      let externalCallRegex = tableString.match(callRegex);

      if (externalCallRegex) {
        Promise.all(externalCallRegex.map(regexToGetCall)).then(
          (resultsArray) => {
            let iter = 0;
            function replaceCallsWithResults() {
              const val = iter;
              iter++;
              return resultsArray[val];
            }
            const tableReturnString = tableString.replace(
              callRegex,
              replaceCallsWithResults
            );
            resolve(tableReturnString);
          }
        );
      } else {
        resolve(tableString);
      }
    } else {
      resolve(tableString);
    }
  });
}

function getRandom(arrayTables) {
  return new Promise((resolve, reject) => {
    const choicesAvailable = arrayTables.length;
    const randomTableNum = Math.floor(Math.random() * choicesAvailable);
    recursiveStringCheck(arrayTables[randomTableNum]).then((r) => {
      resolve(r);
    });
  });
}

function getCall(tableCall, asyncGetFunction) {
  return new Promise(async (resolve, reject) => {
    try {
      if (typeof tableCall === "string") {
        const tableStringSplit = tableCall.split("/");

        if (tableStringSplit.length === 3) {
          const [collection, tableGroup, table] = tableStringSplit;

          const collectionData = localIndex.all?.[collection];

          if (collectionData && !collectionData.tableData && asyncGetFunction) {
            const tableDataAsync = await asyncGetFunction(collectionData);
            collectionData.tableData = tableDataAsync;
          }

          const tableGet = collectionData?.tableData?.[tableGroup]?.[table];
          if (tableGet) {
            if (collectionData.isUtility) {
              const value = await getRandom(tableGet.table);

              resolve(value);
            } else {
              const tableSectionData = tableGet.tableSections || [
                { name: "err", value: "err" },
              ];
              const randomisedTableSections = await Promise.all(
                tableSectionData.map(async (section) => {
                  const value = await getRandom(section.table);
                  return { ...section, table: null, value };
                })
              );
              resolve(randomisedTableSections);
            }
          } else {
            // granular err
            reject(STR.callFailGet);
          }
        } else {
          console.error(
            STR.incorrectCallString +
              tableCall +
              " :Len: " +
              tableStringSplit.length,
            tableStringSplit
          );
          reject(
            "tableCall is incorrectly structured, unable to divide by / key ::" +
              tableCall
          );
        }
      } else {
        reject(
          "tableCall is not a string::" + typeof tableCall + "::" + tableCall
        );
      }
    } catch (e) {
      reject("tableCall failed with error::" + tableCall + "::" + e);
    }
  });
}

function getCallNoAsync(tableCall) {}

module.exports = { getCall, getCallNoAsync, setlocalIndex };
