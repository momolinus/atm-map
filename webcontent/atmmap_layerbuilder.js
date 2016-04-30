/**
 *
 */

var LAYER_BUILDER = {};

(function() {

	var operatorLayers;
	var operatorCategories = [ "Volksbanken", "Sparkassen", "Cashgroup",
			"andere Banken" ]; // JavaScript pattern: array literal
	var cashGroup = [ /Commerzbank/i, /Deutsche Bank/i, /Postbank/i, /Post/i,
			/Dresdner Bank/, /Comdirekt/i, /Norisbank/i, /Berliner Bank/i ];

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

			namedGroup[operatorCategories[i]] = group;
		}
	};

	LAYER_BUILDER.namedGroup = function (name){
		return namedGroup[name];
	}

	LAYER_BUILDER.agregateName = function(name) {
		if (name.search(/Volksbank/i) > -1) {
			return operatorCategories[0];
		} else if (name.search(/Sparkasse/i) > -1) {
			return operatorCategories[1];
		} else {
			for (var i = 0; i < cashGroup.length; i++) {
				if (name.search(cashGroup[i]) > -1) {
					return operatorCategories[2];
				}
			}
		}
		return operatorCategories[3];
	};

})();