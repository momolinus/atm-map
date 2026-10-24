"use strict"
/**
 * *** Geldautomaten-Verbünde **********************************************
 *
 * Genossenschaften: https://de.wikipedia.org/wiki/Bankcard-Servicenetz
 *
 * Webseite: www.cashpool.de Partner: (1)
 * http://www.cashpool.de/Presentation/CashPool/Home/Pressemitteilung im
 * einzelnen, Stand 15.10.2016:
 *
 * TARGOBANK, Santander Consumer Bank, NATIONAL-BANK, Sparda Banken, Wüstenrot
 * Bank AG, MERKUR BANK KGaA, Südwestbank, BBBank
 *
 * http://www.cashgroup.de (2)
 *
 * https://de.wikipedia.org/wiki/Bankcard-Servicenetz (3)
 *
 * https://de.wikipedia.org/wiki/Sparkasse (4)
 *
 * unbekannt (5)
 *
 */

// eslint settings
/*global L*/

/**
 * @author Marcus Bleil
 */
let LAYER_BUILDER = {};
LAYER_BUILDER.namedGroup = [];
LAYER_BUILDER.operatorLayers = null;
LAYER_BUILDER.enabledCategories = [];

(function () {

	let operatorCategories = [
		"Genossenschaftsbanken<br /><span class=\"details\">Bankcard-Servicenetz, Volksbanken, usw.</span>",
		"Sparkassen",
		"CashPool<br /><span class=\"details\">Santander, Sparda, usw.</span>",
		"Cash Group<br /><span class=\"details\">Deutsche Bank, Postbank, usw.</span>",
		"weitere Banken<br /><span class=\"details\">Banken, die sich nicht zuordnen lassen</span>"];
	let categoriesChangedHandler = null;

	LAYER_BUILDER.buildLayers = function (map) {
		let group;

		LAYER_BUILDER.operatorLayers = L.control.layers(null, null, {
			collapsed: false
		}).addTo(map);

		for (let i = 0; i < operatorCategories.length; i++) {
			group = L.layerGroup();
			group.addTo(map);
			LAYER_BUILDER.operatorLayers.addOverlay(group, operatorCategories[i]);

			LAYER_BUILDER.namedGroup[i] = group;
			LAYER_BUILDER.enabledCategories[i] = true;
		}

		map.on("overlayadd", function (event) {
			updateCategoryState(event.layer, true);
		});
		map.on("overlayremove", function (event) {
			updateCategoryState(event.layer, false);
		});

		/**
		 * see:
		 * https://stackoverflow.com/questions/41475855/adding-leaflet-layer-control-to-sidebar
		 */
		let htmlObject = LAYER_BUILDER.operatorLayers.getContainer();
		let a = document.getElementById("bank_layer_control")
		a.appendChild(htmlObject);
	};

	LAYER_BUILDER.clearLayers = function () {
		LAYER_BUILDER.namedGroup.forEach(function (group) {
			group.clearLayers();
		});
	};

	LAYER_BUILDER.onCategoriesChanged = function (handler) {
		categoriesChangedHandler = handler;
	};

	LAYER_BUILDER.isCategoryEnabled = function (categoryIndex) {
		return typeof LAYER_BUILDER.enabledCategories[categoryIndex] === "undefined" ||
			LAYER_BUILDER.enabledCategories[categoryIndex] === true;
	};

	LAYER_BUILDER.getCategoryIndex = function (node) {
		return LAYER_BUILDER.getCategoryIndexes(node)[0];
	};

	LAYER_BUILDER.getCategoryIndexes = function (node) {
		let name = createNameFromTags(node);
		let categories = [];

		if (LAYER_BUILDER.matchingCooperativeBank(name)) {
			categories.push(0);
		}
		if (LAYER_BUILDER.matchingSavingsBank(name)) {
			categories.push(1);
		}
		if (LAYER_BUILDER.matchingCashPool(name)) {
			categories.push(2);
		}
		if (LAYER_BUILDER.matchingCashGroup(name)) {
			categories.push(3);
		}
		if (categories.length === 0) {
			categories.push(4);
		}
		return categories;
	};

	LAYER_BUILDER.addToNamedGroups = function (node, marker) {
		LAYER_BUILDER.getCategoryIndexes(node).forEach(function (categoryIndex) {
			LAYER_BUILDER.namedGroup[categoryIndex].addLayer(marker);
		});
	};

	LAYER_BUILDER.matchingCooperativeBank = function (name) {

		if (name.search(/Volksbank/i) > -1) {
			return true;
		}

		if (name.search(/Raiffeisenbank/i) > -1) {
			return true;
		}

		if (name.search(/ eG/i) > -1) {
			return true;
		}

		if (name.search(/PSD /i) > -1) {
			return true;
		}

		if (name.search(/Brandenburger Bank/i) > -1) {
			return true;
		}

		return false;
	};

	LAYER_BUILDER.matchingSavingsBank = function (name) {

		if (name.search(/Sparkasse/i) > -1) {
			return true;
		}

		return false;
	};

	LAYER_BUILDER.matchingCashPool = function (name) {

		if (name.search(/Sparda-Bank/i) > -1) {
			return true;
		}

		if (name.search(/Santander/i) > -1) {
			return true;
		}

		if (name.search(/Targo/i) > -1) {
			return true;
		}

		return false;
	};

	LAYER_BUILDER.matchingCashGroup = function (name) {

		if (name.search(/Commerzbank/i) > -1) {
			return true;
		}

		if (name.search(/Deutsche Bank/i) > -1) {
			return true;
		}

		if (name.search(/Comdirekt/i) > -1) {
			return true;
		}

		if (name.search(/Postbank/i) > -1) {
			return true;
		}

		if (name.search(/Post/i) > -1) {
			return true;
		}

		if (name.search(/Dresdner Bank/i) > -1) {
			return true;
		}

		if (name.search(/Norisbank/i) > -1) {
			return true;
		}

		if (name.search(/Berliner Bank/i) > -1) {
			return true;
		}

		return false;
	};

	let createNameFromTags = function (node) {

		let name = 'xxxxxxxxxxxxxxxxxxxx';
		let tags = node.tags || node.properties || {};

		// atm usually not in bank
		if (tags["atm:operator"]) {
			name = tags["atm:operator"];
		}
		// usually a bank or an single atm
		else if (tags.name) {
			name = tags.name;
		}
		// "operator" often used instead of "name"
		else if (tags.operator) {
			name = tags.operator;
		}
		else if (tags.network) {
			name = tags.network;
		}

		return name;
	};

	let updateCategoryState = function (layer, enabled) {
		let categoryIndex = LAYER_BUILDER.namedGroup.indexOf(layer);
		if (categoryIndex === -1) {
			return;
		}

		LAYER_BUILDER.enabledCategories[categoryIndex] = enabled;
		if (categoriesChangedHandler) {
			categoriesChangedHandler();
		}
	};

})();