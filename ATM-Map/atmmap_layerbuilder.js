/**
 * *** Geldautomaten-Verbünde ************************************************** **
 * Cashpool ****************************************************************
 * 
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

var LAYER_BUILDER = {};

(function() {

	var operatorLayers;

	// JavaScript pattern: array literal
	var operatorCategories = [ 
	      "Genossenschaftsbanken<br /><span class=\"details\">Bankcard-Servicenetz, Volksbanken, usw.</span>", 
	      "Sparkassen",
	      "CashPool<br /><span class=\"details\">Santander, Sparda, usw.</span>", 
	      "Cash Group<br /><span class=\"details\">Deutsche Bank, Postbank, usw.</span>", 
	      "weitere Banken<br /><span class=\"details\">Banken, die sich nicht zuordnen lassen</span>" ];

	var namedGroup = {};

	LAYER_BUILDER.buildLayers = function(map) {
		var group;

		operatorLayers = L.control.layers(null, null, {
			collapsed : false
		}).addTo(map);

		for (var i = 0; i < operatorCategories.length; i++) {
			group = L.layerGroup();
			group.addTo(map);
			operatorLayers.addOverlay(group, operatorCategories[i]);

			namedGroup[i] = group;
		}
	};

	LAYER_BUILDER.addToNamedGroups = function(node, marker) {
		var group, name, matched;

		matched = false;
		name = createNameFromeTags(node);

		if (matchingCooperativeBank(name)) {
			namedGroup[0].addLayer(marker);
			matched = true;
		}

		if (matchingSavingsBank(name)) {
			namedGroup[1].addLayer(marker);
			matched = true;
		}

		if (matchingCashPool(name)) {
			namedGroup[2].addLayer(marker);
			matched = true;
		}

		if (matchingCashGroup(name)) {
			namedGroup[3].addLayer(marker);
			matched = true;
		}

		if (!matched) {
			namedGroup[4].addLayer(marker);
		}
	};

	var matchingCooperativeBank = function(name) {

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

		return false;
	};

	var matchingSavingsBank = function(name) {

		if (name.search(/Sparkasse/i) > -1) {
			return true;
		}

		return false;
	};

	var matchingCashPool = function(name) {

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

	var matchingCashGroup = function(name) {

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

	var createNameFromeTags = function(node) {

		var name = 'xxxxxxxxxxxxxxxxxxxx';

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