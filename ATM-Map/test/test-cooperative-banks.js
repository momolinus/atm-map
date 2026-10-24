/**
 *
 */

// eslint settings
/*global QUnit*/

import { LAYER_BUILDER } from "../atmmap_layerbuilder.js";

QUnit.test("Brandenburger Bank", function(assert) {
	var bankName = "Brandenburger Bank";

	var isCooperative = LAYER_BUILDER.matchingCooperativeBank(bankName);
	assert.ok(isCooperative, bankName + " is a Genossenschaftsbank");

	var isSaving = LAYER_BUILDER.matchingSavingsBank(bankName);
	assert.notOk(isSaving, bankName + " is not a Sparkasse");

	var isCashPool = LAYER_BUILDER.matchingCashPool(bankName);
	assert.notOk(isCashPool, bankName + " is not a CashPool-Bank");

	var isCashCroup = LAYER_BUILDER.matchingCashGroup(bankName);
	assert.notOk(isCashCroup, bankName + " is not a CashGroup-Bank");

});

QUnit.test("Vector tile properties are used for bank categories", function(assert) {
	assert.equal(
		LAYER_BUILDER.getCategoryIndex({
			properties: { operator: "Volksbank Berlin" }
		}),
		0
	);
	assert.equal(
		LAYER_BUILDER.getCategoryIndex({
			properties: { name: "Sparkasse Berlin" }
		}),
		1
	);
	assert.deepEqual(
		LAYER_BUILDER.getCategoryIndexes({
			properties: { name: "Santander", network: "CashPool" }
		}),
		[2]
	);
	assert.deepEqual(
		LAYER_BUILDER.getCategoryIndexes({
			properties: { name: "Sparkasse Santander" }
		}),
		[1, 2]
	);
});