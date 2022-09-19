var genLogic = require("../src/index");
var testCollectionA = require("@random-tables/npc-fantasy");
// var testCollectionB = require("@random-tables/utility-nature");
var testCollectionUtility = require("@random-tables/utility-nature");
// const testCollectionMissingLib = {};
var assert = require("assert");
// END -- Imports

const tableCallA = "npc-fantasy/dwarf/male";

describe("Generator Logic", function () {
  describe("buildIndex", function buildNoEr() {
    it("should run buildIndex without erroring", function () {
      assert.doesNotThrow(
        () => genLogic.buildIndex([testCollectionA, testCollectionUtility]),
        Error,
        "Error thrown"
      );
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
