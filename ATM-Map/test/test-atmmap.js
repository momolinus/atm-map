// eslint settings
/*global QUnit, ATMMAP, LAYER_BUILDER, UTILS*/

QUnit.module("ATM data sources");

QUnit.test("Overpass errors are described by status and text status", function (assert) {
	let describe = ATMMAP.overpass.describeError;
	assert.ok(describe({ status: 0 }, "error").indexOf("nicht erreichbar") >= 0);
	assert.ok(describe({ status: 429 }, "error").indexOf("Zu viele Anfragen") >= 0);
	assert.ok(describe({ status: 503 }, "error").indexOf("nicht verfügbar") >= 0);
	assert.ok(describe({ status: 200 }, "timeout").indexOf("zu lange") >= 0);
	assert.ok(describe({ status: 418 }, "error").indexOf("unerwarteter Fehler") >= 0);
});

QUnit.test("ATM vector tiles are the default data source", function (assert) {
	assert.equal(ATMMAP.getDataSource(), ATMMAP.SOURCE_VECTOR_TILES);
	assert.strictEqual(ATMMAP.setDataSource(ATMMAP.SOURCE_VECTOR_TILES), undefined);
});

QUnit.test("Cash withdrawal shops use the green supermarket icon", function (assert) {
	assert.strictEqual(ATMMAP.getCashWithdrawalStyle().icon, UTILS.cashWithdrawal);
	assert.ok(UTILS.cashWithdrawal.options.iconUrl.indexOf("supermarket") > -1);
});

QUnit.test("Minimum zoom for ATMs is 14", function (assert) {
	assert.equal(ATMMAP.MIN_ZOOM, 14);
});

QUnit.test("Unknown data sources are rejected", function (assert) {
	assert.throws(function () {
		ATMMAP.setDataSource("unknown");
	}, /Unknown ATM data source/);
});

QUnit.test("Vector tile points use the existing ATM status icons", function (assert) {
	assert.strictEqual(
		ATMMAP.getVectorTileStyle({ amenity: "atm" }, 15).icon,
		UTILS.atm
	);
	assert.strictEqual(
		ATMMAP.getVectorTileStyle({ amenity: "bank", atm: "yes" }, 15).icon,
		UTILS.yesAtm
	);
	assert.strictEqual(
		ATMMAP.getVectorTileStyle({ amenity: "bank", atm: "no" }, 15).icon,
		UTILS.noAtm
	);
	assert.strictEqual(
		ATMMAP.getVectorTileStyle({ amenity: "bank" }, 15).icon,
		UTILS.unknownAtm
	);
});

QUnit.test("Vector tile styling filters unknown features and disabled categories", function (assert) {
	assert.deepEqual(
		ATMMAP.getVectorTileStyle({ amenity: "bench" }, 15),
		[]
	);

	let previousValue = LAYER_BUILDER.enabledCategories[0];
	LAYER_BUILDER.enabledCategories[0] = false;
	assert.deepEqual(
		ATMMAP.getVectorTileStyle({
			amenity: "bank",
			atm: "yes",
			operator: "Volksbank"
		}, 15),
		[]
	);
	if (typeof previousValue === "undefined") {
		delete LAYER_BUILDER.enabledCategories[0];
	}
	else {
		LAYER_BUILDER.enabledCategories[0] = previousValue;
	}
});
