const STR = require("./strings.js");

let localIndex;

function setlocalIndex(i) {
  localIndex = i;
}

let asyncGetFunction;

function setAsyncGetFunction(newFunc) {
  asyncGetFunction = newFunc;
}

const Splitters = {
  number: "Number#",
  dice: "D#",
  an: "#AN",
  uppercase: "#UP",
};

const callRegex = /\{{(.*?)\}}/g;

function diceRoller(diceStr) {
  const [num, dice] = diceStr.split("d");
  var total = 0;
  for (var i = 0; i < num; i++) {
    const random = Math.random() * dice;
    total += Math.round(random + 1);
  }
  return total;
}

async function regexToGetCall(regexString) {
  const removeCurlyBraces = regexString.substring(2, regexString.length - 2);
  const [callString, defaultValue] = removeCurlyBraces.includes(":")
    ? removeCurlyBraces.split(":")
    : [removeCurlyBraces, ""];

  if (callString.includes(Splitters.number)) {
    const valueRange = callString.split("#")[1].split("-");
    const lowValue = parseInt(valueRange[0]);
    const highValue = parseInt(valueRange[1]);

    if ((lowValue || lowValue === 0) && (highValue || highValue === 0)) {
      return (
        "" + (Math.floor(Math.random() * (highValue - lowValue)) + lowValue)
      );
    }
    return defaultValue;
  } else if (callString.includes(Splitters.dice)) {
    try {
      const string = callString.replace("D#", "").replace("/s/g", "");
      const valArr = string.split("+").map((s) => {
        if (s.includes("d")) {
          return diceRoller(s);
        }
        return parseInt(s, 10);
      });
      return valArr.reduce(function (a, b) {
        return a + b;
      }, 0);
    } catch {
      return defaultValue || 0;
    }
  } else {
    try {
      const [noFilter] = callString.split("#");
      return await getCall(noFilter)
        .then((res) => {
          if (callString.includes(Splitters.an))
            return `${
              ["a", "e", "i", "o", "u"].includes(res.substring(0, 1))
                ? "an"
                : "a"
            } ${res}`;
          if (callString.includes(Splitters.uppercase))
            return res.toUpperCase();
          return res;
        })
        .catch((e) => {
          return defaultValue;
        });
    } catch (e) {
      console.error("regexToGetCall::", e);
      return defaultValue;
    }
  }
}

function recursiveStringCheck(tableString) {
  return new Promise((resolve, reject) => {
    if (typeof tableString === "string") {
      let externalCallRegex = tableString.match(callRegex);

      if (externalCallRegex) {
        Promise.all(externalCallRegex.map(regexToGetCall))
          .then((resultsArray) => {
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
          })
          .catch((err) => {
            console.error("recursivestringcheck err::" + err);
          });
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

function getCall(tableCall) {
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

module.exports = { getCall, setlocalIndex, setAsyncGetFunction };
