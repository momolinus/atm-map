import { atmMap } from "../atmmap.js";
import { layerBuilder } from "../atmmap_layerbuilder.js";
import { utils } from "../atmmaputils.js";
import { vectorTiles } from "../atmmap_vectortiles.js";
import { overpass } from "../atmmap_overpass.js";

QUnit.module("ATM data sources");

QUnit.test("Overpass errors are described by status and text status", function (assert) {
	let describe = overpass.describeError;
	assert.ok(describe({ status: 0 }, "error").indexOf("nicht erreichbar") >= 0);
	assert.ok(describe({ status: 429 }, "error").indexOf("Zu viele Anfragen") >= 0);
	assert.ok(describe({ status: 503 }, "error").indexOf("nicht verfügbar") >= 0);
	assert.ok(describe({ status: 200 }, "timeout").indexOf("zu lange") >= 0);
	assert.ok(describe({ status: 418 }, "error").indexOf("unerwarteter Fehler") >= 0);
});

QUnit.test("ATM vector tiles are the default data source", function (assert) {
	assert.equal(atmMap.getDataSource(), atmMap.SOURCE_VECTOR_TILES);
	assert.strictEqual(atmMap.setDataSource(atmMap.SOURCE_VECTOR_TILES), undefined);
});

QUnit.test("Cash withdrawal shops use the green supermarket icon", function (assert) {
	assert.strictEqual(vectorTiles.getCashWithdrawalStyle().icon, utils.cashWithdrawal);
	assert.ok(utils.cashWithdrawal.options.iconUrl.indexOf("supermarket") > -1);
});

QUnit.test("Minimum zoom for ATMs is 13", function (assert) {
	assert.equal(atmMap.MIN_ZOOM, 13);
});

QUnit.test("Unknown data sources are rejected", function (assert) {
	assert.throws(function () {
		atmMap.setDataSource("unknown");
	}, /Unknown ATM data source/);
});

QUnit.test("Vector tile points use the existing ATM status icons", function (assert) {
	assert.strictEqual(
		vectorTiles.getVectorTileStyle({ amenity: "atm" }, 15).icon,
		utils.atm
	);
	assert.strictEqual(
		vectorTiles.getVectorTileStyle({ amenity: "bank", atm: "yes" }, 15).icon,
		utils.yesAtm
	);
	assert.strictEqual(
		vectorTiles.getVectorTileStyle({ amenity: "bank", atm: "no" }, 15).icon,
		utils.noAtm
	);
	assert.strictEqual(
		vectorTiles.getVectorTileStyle({ amenity: "bank" }, 15).icon,
		utils.unknownAtm
	);
});

QUnit.test("Vector tile styling filters unknown features and disabled categories", function (assert) {
	assert.deepEqual(
		vectorTiles.getVectorTileStyle({ amenity: "bench" }, 15),
		[]
	);

	let previousValue = layerBuilder.enabledCategories[0];
	layerBuilder.enabledCategories[0] = false;
	assert.deepEqual(
		vectorTiles.getVectorTileStyle({
			amenity: "bank",
			atm: "yes",
			operator: "Volksbank"
		}, 15),
		[]
	);
	if (typeof previousValue === "undefined") {
		delete layerBuilder.enabledCategories[0];
	}
	else {
		layerBuilder.enabledCategories[0] = previousValue;
	}
});
