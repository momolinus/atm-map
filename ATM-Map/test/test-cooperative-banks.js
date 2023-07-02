/**
 *
 */

// eslint settings
/*global LAYER_BUILDER, QUnit*/

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