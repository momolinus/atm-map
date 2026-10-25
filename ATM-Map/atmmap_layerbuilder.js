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
export const layerBuilder = {};
// Die Reihenfolge muss zu den unten zurückgegebenen Kategorie-Indizes passen.
layerBuilder.namedGroup = [];
layerBuilder.operatorLayers = null;
layerBuilder.enabledCategories = [];

	let operatorCategories = [
		"Genossenschaftsbanken<br /><span class=\"details\">Bankcard-Servicenetz, Volksbanken, usw.</span>",
		"Sparkassen",
		"CashPool<br /><span class=\"details\">Santander, Sparda, usw.</span>",
		"Cash Group<br /><span class=\"details\">Deutsche Bank, Postbank, usw.</span>",
		"weitere Banken<br /><span class=\"details\">Banken, die sich nicht zuordnen lassen</span>"];
	let categoriesChangedHandler = null;

	layerBuilder.buildLayers = function (map) {
		let group;

		layerBuilder.operatorLayers = L.control.layers(null, null, {
			collapsed: false
		}).addTo(map);

		for (let i = 0; i < operatorCategories.length; i++) {
			group = L.layerGroup();
			group.addTo(map);
			layerBuilder.operatorLayers.addOverlay(group, operatorCategories[i]);

			layerBuilder.namedGroup[i] = group;
			layerBuilder.enabledCategories[i] = true;
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
		let htmlObject = layerBuilder.operatorLayers.getContainer();
		let a = document.getElementById("bank_layer_control")
		a.appendChild(htmlObject);
	};

	layerBuilder.clearLayers = function () {
		layerBuilder.namedGroup.forEach(function (group) {
			group.clearLayers();
		});
	};

	layerBuilder.onCategoriesChanged = function (handler) {
		categoriesChangedHandler = handler;
	};

	layerBuilder.isCategoryEnabled = function (categoryIndex) {
		return typeof layerBuilder.enabledCategories[categoryIndex] === "undefined" ||
			layerBuilder.enabledCategories[categoryIndex] === true;
	};

	layerBuilder.getCategoryIndex = function (node) {
		return layerBuilder.getCategoryIndexes(node)[0];
	};

	layerBuilder.getCategoryIndexes = function (node) {
		let name = createNameFromTags(node);
		let categories = [];

		// Eine Bank kann mehreren Verbünden angehören; deshalb werden alle Treffer gesammelt.
		if (layerBuilder.matchingCooperativeBank(name)) {
			categories.push(0);
		}
		if (layerBuilder.matchingSavingsBank(name)) {
			categories.push(1);
		}
		if (layerBuilder.matchingCashPool(name)) {
			categories.push(2);
		}
		if (layerBuilder.matchingCashGroup(name)) {
			categories.push(3);
		}
		if (categories.length === 0) {
			// Nicht zugeordnete Banken erscheinen in der Sammelkategorie.
			categories.push(4);
		}
		return categories;
	};

	layerBuilder.addToNamedGroups = function (node, marker) {
		layerBuilder.getCategoryIndexes(node).forEach(function (categoryIndex) {
			layerBuilder.namedGroup[categoryIndex].addLayer(marker);
		});
	};

	layerBuilder.matchingCooperativeBank = function (name) {

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

	layerBuilder.matchingSavingsBank = function (name) {

		if (name.search(/Sparkasse/i) > -1) {
			return true;
		}

		return false;
	};

	layerBuilder.matchingCashPool = function (name) {

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

	layerBuilder.matchingCashGroup = function (name) {

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
		let categoryIndex = layerBuilder.namedGroup.indexOf(layer);
		if (categoryIndex === -1) {
			return;
		}

		layerBuilder.enabledCategories[categoryIndex] = enabled;
		// Vektorkachel-Stile werden bei Bedarf berechnet; der Anbieter muss daher neu zeichnen.
		if (categoriesChangedHandler) {
			categoriesChangedHandler();
		}
	};
