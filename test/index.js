var genLogic = require("../src/index");
var STR = require("../src/strings");
var testCollectionA = require("@random-tables/npc-fantasy");
var testCollectionUtility = require("@random-tables/utility-nature");
var assert = require("assert");

const STRINGS = {
  noneExistTable: "non-existant-table@3",
  tooLowVersionTablename: "table-version-too-low",
  rootTable: "root-table",
  recTable: "test-table-rec",
  appendTable: "table-append",
  asyncUtilTable: "table-asnyc-get",
  asyncFullTable: "table-full-asnyc-get",
  asyncVal: "async-val",
  asyncTableValA: "fulltableA",
  asyncTableValB: "fulltableB",
  splitterTable: "splitter-table",
  splitterUtilTable: "splitter-util-table",
};

function asyncFunction(table) {
  return new Promise((res, rej) => {
    switch (table.collectionID) {
      case STRINGS.asyncUtilTable:
        res({
          testasync: { test: { table: [STRINGS.asyncVal, STRINGS.asyncVal] } },
        });
      case STRINGS.asyncFullTable:
        res({
          testtable: {
            test: {
              tableSections: [
                {
                  name: "Name:",
                  table: [STRINGS.asyncTableValA],
                  type: "simple",
                },
                {
                  name: "SName:",
                  table: [STRINGS.asyncTableValB],
                  type: "simple",
                },
              ],
            },
          },
        });

      default:
        rej("No table");
        break;
    }
  });
}

const TEST_TABLES = {
  nonTable: "",
  badObject: { x: "x" },
  lowVersion: {
    collectionID: STRINGS.tooLowVersionTablename,
    collectionName: "Low V Table",
    version: 1,
    tags: ["testing"],
    tables: {
      test: ["tester"],
    },
    tableData: {
      test: {
        tester: {},
      },
    },
  },
  hasRequirements: {
    collectionID: "test-table",
    collectionName: "Test Table",
    category: "Other",
    isUtility: false,
    version: 2,
    required: [
      STRINGS.noneExistTable,
      STRINGS.tooLowVersionTablename + "@4",
      STRINGS.recTable + "@1",
    ],
    tags: ["testing"],
    tables: {
      test: ["tester"],
    },
    tableData: {
      test: {
        tester: {},
      },
    },
    requirements: [
      {
        collectionID: STRINGS.recTable,
        collectionName: "Test Table Recursive",
        category: "Other",
        isUtility: false,
        version: 2,
        required: [STRINGS.rootTable],
        tags: ["testing"],
        tables: {
          test: ["tester"],
        },
        tableData: {
          test: {
            tester: {},
          },
        },
        requirements: [
          {
            collectionID: STRINGS.rootTable,
            collectionName: "root utility Table",
            isUtility: true,
            version: 1,
            tags: ["testing"],
            tables: {
              test: ["tester"],
            },
            tableData: {
              test: {
                tester: {
                  table: ["{{not/a/table:default}}"],
                },
              },
            },
          },
        ],
      },
    ],
  },
  asyncGet: {
    collectionID: STRINGS.asyncUtilTable,
    collectionName: "Async Utils Table",
    isUtility: true,
    version: 1,
    tags: ["testing"],
    tables: {
      testasync: ["test"],
    },
  },
  asyncFullGet: {
    collectionID: STRINGS.asyncFullTable,
    collectionName: "Async Full Table",
    isUtility: false,
    version: 1,
    tags: ["testing"],
    tables: {
      testtable: ["test"],
    },
  },
  appendTable: {
    collectionID: STRINGS.appendTable,
    collectionName: "Append Table",
    version: 1,
    tables: {
      test: ["tester"],
    },
    tableData: {
      test: {
        tester: {
          table: ["test"],
        },
      },
    },
  },
  splitterTable: {
    collectionID: STRINGS.splitterTable,
    collectionName: "splitter Table",
    version: 1,
    isUtility: true,
    tables: {
      test: ["number", "dice", "start-vowel", "start-consonant", "uppercase"],
    },
    tableData: {
      test: {
        number: {
          table: ["{{Number#100-300}}"],
        },
        dice: {
          table: ["{{D#3d6 + 2d4}}"],
        },
        "dice-b": {
          table: ["{{D#3d6 + 4}}"],
        },
        "start-vowel": {
          table: [`{{${STRINGS.splitterUtilTable}/test/start-vowel#AN:fail}}`],
        },
        "start-consonant": {
          table: [`{{${STRINGS.splitterUtilTable}/test/start-consonant#AN:fail}}`],
        },
        uppercase: {
          table: [`{{${STRINGS.splitterUtilTable}/test/uppercase#UP:fail}}`],
        },
      },
    },
  },
  splitterUtilTable: {
    collectionID: STRINGS.splitterUtilTable,
    collectionName: "splitter util Table",
    version: 1,
    isUtility: true,
    tables: {
      test: ["start-vowel", "start-consonant", "uppercase"],
    },
    tableData: {
      test: {
        "start-vowel": {
          table: ["object"],
        },
        "start-consonant": {
          table: ["thing"],
        },
        uppercase: {
          table: ["thing"],
        },
      },
    },
  },
};

const expectedErrors = {
  missingtable: "Missing table::" + STRINGS.noneExistTable,
  lowVersionTable: `Table::${STRINGS.tooLowVersionTablename} required at version::4, but is version::1`,
};

const tableCallA = "npc-fantasy/dwarf/male";
const utilityTableCall = "utility-npc/hobby/outdoor";
const utilityNestedTableCall = "utility-npc/hobby/all";
const incorrectTableCall = "npc-fantasy/dwarf";

const SplitterCallPre =  `${STRINGS.splitterTable}/test`;
const splitterNumber = `${SplitterCallPre}/number`;
const splitterDice = `${SplitterCallPre}/dice`;
const splitterDiceB = `${SplitterCallPre}/dice-b`;
const splitterAnVowel = `${SplitterCallPre}/start-vowel`;
const splitterAnConsonant = `${SplitterCallPre}/start-consonant`;
const splitterUppercase = `${SplitterCallPre}/uppercase`;

describe("Generator Logic", function () {
  describe("buildIndex", function buildNoEr() {
    let index;
    let issues;

    let complete = false;
    function onComplete() {
      complete = true;
    }

    it("should run buildIndex and error with non-table arguement", function () {
      let error = false;
      function onErr(err) {
        assert.ok(err.includes(STR.tableNotArray));
        error = true;
      }

      const r = genLogic.buildIndex(TEST_TABLES.nonTable, onComplete, onErr);
      index = r.generalIndex;
      issues = r.issues;
      assert.ok(error);
    });

    it("should run buildIndex and error with table badly constructed object", function () {
      let error = false;
      function onErr() {
        error = true;
      }

      const r = genLogic.buildIndex(TEST_TABLES.badObject, onComplete, onErr);
      index = r.generalIndex;
      issues = r.issues;
      assert.ok(error);
    });

    it("should run buildIndex without erroring, but should have async function missing issue", function () {
      assert.doesNotThrow(
        () => {
          const r = genLogic.buildIndex([TEST_TABLES.asyncGet], onComplete);
          index = r.generalIndex;
          issues = r.issues;
        },
        Error,
        "Error thrown"
      );
      assert.ok(issues.includes(STR.missingAsync));
    });

    it("should run buildIndex & trigger onComplete", function () {
      assert.ok(complete);
    });

    it("should run buildIndex without erroring", function () {
      assert.doesNotThrow(
        () => {
          const r = genLogic.buildIndex([
            testCollectionA,
            testCollectionUtility,
            TEST_TABLES.notTable,
            TEST_TABLES.hasRequirements,
            TEST_TABLES.lowVersion,
            TEST_TABLES.asyncGet,
            TEST_TABLES.splitterTable,
            TEST_TABLES.splitterUtilTable,
          ]);
          index = r.generalIndex;
          issues = r.issues;
        },
        Error,
        "Error thrown"
      );
    });

    it("Should return message in issues, missing table", function () {
      assert.ok(issues.includes(expectedErrors.missingtable));
    });

    it("Should return message in issues, table version wrong", function () {
      assert.ok(issues.includes(expectedErrors.lowVersionTable));
    });

    it("Should allow to append a table", function () {
      const r = genLogic.appendIndex(TEST_TABLES.appendTable);

      assert.ok(Object.keys(r.generalIndex.all).includes(STRINGS.appendTable));
    });

    it("Should accept a call for a table - full table", async function () {
      const call = await genLogic.getCall(tableCallA);
      assert.ok(Array.isArray(call));

      assert.ok(!call[0].value.includes("{{"));
      assert.ok(!call[2].value.includes("{{"));
    });

    it("Should accept a call for a table - utility table", async function () {
      await genLogic.getCall(utilityTableCall).then((val) => {
        console.log("U>call", val);
        assert.ok(!val.type);
        assert.ok(typeof val === "string");
      });
    });

    it("Should accept a call for a table - nested utility table", async function () {
      await genLogic.getCall(utilityNestedTableCall).then((val) => {
        console.log("UN>call", val);
        assert.ok(!val.type);
        assert.ok(typeof val === "string");
        assert.ok(!val.includes("{{"));
      });
    });

    it("Should error when given an incorrectly structured call key", async function () {
      await genLogic.getCall(incorrectTableCall).catch((err) => {
        console.log("ER>call", err);
        assert.ok(err.includes(STR.incorrectCallString));
      });
    });

    it("Should return default value if nested table call not found.", async function () {
      await genLogic.getCall(STRINGS.rootTable + "/test/tester").then((res) => {
        console.log(">>>DF>call-"+res+"-");
        assert.ok(res === "default");
      });
    });

    it("Should return correct Number value.", async function () {
      await genLogic.getCall(splitterNumber).then((res) => {
        console.log(">>>NUM>call", res);
        assert.ok(parseInt(res) || res === "0");
      });
    });

    it("Should return correct Dice value.", async function () {
      await genLogic.getCall(splitterDice).then((res) => {
        console.log(">>>DC>call", res);
        assert.ok(parseInt(res) || res === "0");
      });
    });

    it("Should return correct 2 added Dice values.", async function () {
      await genLogic.getCall(splitterDiceB).then((res) => {
        console.log(">>>DCB>call", res);
        assert.ok(parseInt(res) || res === "0");
      });
    });

    it("Should return correct [AN] value, prefixing with 'a'.", async function () {
      await genLogic.getCall(splitterAnConsonant).then((res) => {
        console.log(">>>A>call", res);
        assert.ok(res.substring(0, 2) === "a ");
      });
    });

    it("Should return correct [AN] value, prefixing with 'an'.", async function () {
      await genLogic.getCall(splitterAnVowel).then((res) => {
        console.log(">>>AN>call", res);
        assert.ok(res.substring(0, 3) === "an ");
      });
    });

    it("Should return correct uppercase value.", async function () {
      await genLogic.getCall(splitterUppercase).then((res) => {
        console.log(">>>UP>call", res);
        assert.ok(res.substring(0, 1) === res.substring(0, 1).toUpperCase());
      });
    });

    it("should run buildIndex with single table without erroring", function () {
      assert.doesNotThrow(
        () => {
          const r = genLogic.buildIndex(
            [TEST_TABLES.appendTable],
            null,
            null,
            asyncFunction
          );
          index = r.generalIndex;
          issues = r.issues;
        },
        Error,
        "Error thrown"
      );
    });

    // check originals removed
    it("Should not work with removed tables", async function () {
      await genLogic.getCall(utilityTableCall).catch((e) => {
        assert.ok(e === STR.callFailGet);
      });
    });

    it("should run buildIndex with async table without erroring", function () {
      assert.doesNotThrow(
        () => {
          const r = genLogic.buildIndex(
            [TEST_TABLES.asyncGet, TEST_TABLES.asyncFullGet],
            null,
            null,
            asyncFunction
          );
          index = r.generalIndex;
          issues = r.issues;
        },
        Error,
        "Error thrown"
      );
    });

    it("Should accept an async utility call", async function () {
      await genLogic
        .getCall(`${TEST_TABLES.asyncGet.collectionID}/testasync/test`)
        .then((res) => {
          assert.ok(res === STRINGS.asyncVal);
        });
    });

    it("Should accept an async table call", async function () {
      await genLogic
        .getCall(`${TEST_TABLES.asyncFullGet.collectionID}/testtable/test`)
        .then((res) => {
          // table call
          assert.ok(res[0].value === STRINGS.asyncTableValA);
          assert.ok(res[1].value === STRINGS.asyncTableValB);
        });
    });
  });
});
