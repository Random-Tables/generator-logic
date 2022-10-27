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

function recursiveStringCheck(tableString) {
  return new Promise((resolve, reject) => {
    if (typeof tableString === "string") {
      const externalCallRegex = tableString.match(callRegex);

      if (externalCallRegex) {
        const removeCurlyBraces = tableString.substring(
          2,
          tableString.length - 2
        );
        const [callString, defaultValue] = removeCurlyBraces.includes(":")
          ? removeCurlyBraces.split(":")
          : [removeCurlyBraces, 0];
        const recursiveGetCall = getCall(callString);
        resolve(
          typeof recursiveGetCall === "string" ? recursiveGetCall : defaultValue
        );
      }
    }
    resolve(tableString);
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
  return new Promise( async (resolve, reject) => {
    if (typeof tableCall === "string") {
      const tableStringSplit = tableCall.split("/");
      if (tableStringSplit.length === 3) {
        const [collection, tableGroup, table] = tableStringSplit;

        const collectionData = localIndex.all?.[collection];
        const tableGet = collectionData.tableData?.[tableGroup]?.[table];
        if (tableGet) {

          if (collectionData.isUtility) {
            await getRandom(tableGet.table).then((v) => {
              resolve(v);
            });
          } else {
            resolve(tableGet);
          }
        } else {
          // granular err
          reject("Unable to get table from tableCall");
        }
      } else {
        console.error(
          "tableCall is incorrectly structured, unable to divide by / key ::" +
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
    }
    reject("tableCall is not a string::" + typeof tableCall + "::" + tableCall);
  });
}

function getCallNoAsync(tableCall) {}

module.exports = { getCall, getCallNoAsync, setlocalIndex };
