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
 * @author Marcus Bleil, www.marcusbleil.de
 */
let LAYER_BUILDER = {};

(function () {

	let operatorLayers;

	// JavaScript pattern: array literal
	let operatorCategories = [
		"Genossenschaftsbanken<br /><span class=\"details\">Bankcard-Servicenetz, Volksbanken, usw.</span>",
		"Sparkassen",
		"CashPool<br /><span class=\"details\">Santander, Sparda, usw.</span>",
		"Cash Group<br /><span class=\"details\">Deutsche Bank, Postbank, usw.</span>",
		"weitere Banken<br /><span class=\"details\">Banken, die sich nicht zuordnen lassen</span>"];

	let namedGroup = {};

	LAYER_BUILDER.buildLayers = function (map) {
		let group;

		operatorLayers = L.control.layers(null, null, {
			collapsed: false
		}).addTo(map);

		for (let i = 0; i < operatorCategories.length; i++) {
			group = L.layerGroup();
			group.addTo(map);
			operatorLayers.addOverlay(group, operatorCategories[i]);

			namedGroup[i] = group;
		}

		/**
		 * see:
		 * https://stackoverflow.com/questions/41475855/adding-leaflet-layer-control-to-sidebar
		 */
		let htmlObject = operatorLayers.getContainer();
		let a = document.getElementById("bank_layer_control")
		a.appendChild(htmlObject);
	};

	LAYER_BUILDER.addToNamedGroups = function (node, marker) {
		let name, matched;

		matched = false;
		name = createNameFromeTags(node);

		if (LAYER_BUILDER.matchingCooperativeBank(name)) {
			namedGroup[0].addLayer(marker);
			matched = true;
		}

		if (LAYER_BUILDER.matchingSavingsBank(name)) {
			namedGroup[1].addLayer(marker);
			matched = true;
		}

		if (LAYER_BUILDER.matchingCashPool(name)) {
			namedGroup[2].addLayer(marker);
			matched = true;
		}

		if (LAYER_BUILDER.matchingCashGroup(name)) {
			namedGroup[3].addLayer(marker);
			matched = true;
		}

		if (!matched) {
			namedGroup[4].addLayer(marker);
		}
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

	let createNameFromeTags = function (node) {

		let name = 'xxxxxxxxxxxxxxxxxxxx';

		// atm usually not in bank
		if (node.tags["atm:operator"]) {
			name = node.tags["atm:operator"];
		}
		// usually a bank or an single atm
		else if (node.tags.name) {
			name = node.tags.name;
		}
		// "operator" often used instead of "name"
		else if (node.tags.operator) {
			name = node.tags.operator;
		}

		return name;
	};

})();