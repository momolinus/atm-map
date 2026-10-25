/**
 *
 */

import { layerBuilder } from "../atmmap_layerbuilder.js";

QUnit.test("Brandenburger Bank", function(assert) {
	var bankName = "Brandenburger Bank";

	var isCooperative = layerBuilder.matchingCooperativeBank(bankName);
	assert.ok(isCooperative, bankName + " is a Genossenschaftsbank");

	var isSaving = layerBuilder.matchingSavingsBank(bankName);
	assert.notOk(isSaving, bankName + " is not a Sparkasse");

	var isCashPool = layerBuilder.matchingCashPool(bankName);
	assert.notOk(isCashPool, bankName + " is not a CashPool-Bank");

	var isCashCroup = layerBuilder.matchingCashGroup(bankName);
	assert.notOk(isCashCroup, bankName + " is not a CashGroup-Bank");

});

QUnit.test("Vector tile properties are used for bank categories", function(assert) {
	assert.equal(
		layerBuilder.getCategoryIndex({
			properties: { operator: "Volksbank Berlin" }
		}),
		0
	);
	assert.equal(
		layerBuilder.getCategoryIndex({
			properties: { name: "Sparkasse Berlin" }
		}),
		1
	);
	assert.deepEqual(
		layerBuilder.getCategoryIndexes({
			properties: { name: "Santander", network: "CashPool" }
		}),
		[2]
	);
	assert.deepEqual(
		layerBuilder.getCategoryIndexes({
			properties: { name: "Sparkasse Santander" }
		}),
		[1, 2]
	);
});