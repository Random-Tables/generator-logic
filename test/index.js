var genLogic = require("../src/index");
var testCollectionA = require("@random-tables/npc-fantasy");
// var testCollectionB = require("@random-tables/utility-nature");
var testCollectionUtility = require("@random-tables/utility-nature");
// const testCollectionMissingLib = {};
var assert = require("assert");
// END -- Imports

const STRINGS = {
  noneExistTable: "non-existant-table@3",
  tooLowVersionTablename: "table-version-too-low",
  rootTable: "root-table",
  recTable: "test-table-rec",
};
const TEST_TABLES = {
  nonTable: "",
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
        ],
      },
    ],
  },
};

const expectedErrors = {
  nonTable: "A non-table item was passed inside buildIndex array",
  missingtable: "Missing table::" + STRINGS.noneExistTable,
  lowVersionTable: `Table::${STRINGS.tooLowVersionTablename} required at version::4, but is version::1`,
};

const tableCallA = "npc-fantasy/dwarf/male";

describe("Generator Logic", function () {
  describe("buildIndex", function buildNoEr() {
    let index;
    let issues;

    it("should run buildIndex without erroring", function () {
      assert.doesNotThrow(
        () => {
          const r = genLogic.buildIndex([
            testCollectionA,
            testCollectionUtility,
            TEST_TABLES.notTable,
            TEST_TABLES.hasRequirements,
            TEST_TABLES.lowVersion,
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

    it("Should accept a call for a table", function () {
      const call = genLogic.getCall(tableCallA);
      console.log("call", call);
      assert.ok(!!call.type);
      assert.equal(call.call, tableCallA, "Incorrect call value returned");
      assert.ok(!call.utility);
      assert.ok(Array.isArray(call.data));
    });

    // Add Single item test B

    // test call B

    // test call C

    // test call utility

    // test testCollectionMissingLib returns missingLib true
  });
});
