// constructs the module ATMMAP
var ATMMAP = {};

(function() {

	// dependencies
	utils = UTILS;

	/* private attributes */

	// contains the node id of the OSM objects
	var nodeIds = {};
	var wayNodeIds = {};
	var namedGroup = {};
	var operatorLayers;
	var operatorCategories = [ "Volksbanken", "Sparkassen", "Cashgroup",
			"andere Banken" ];
	var cashGroup = [ /Commerzbank/i, /Deutsche Bank/i, /Postbank/i,
			/Dresdner Bank/, /Comdirekt/i, /Norisbank/i, /Berliner Bank/i ];

	var map = null;

	// building the api call for atms (automated teller machine)
	// the overpass api URL
	var ovpCall = 'http://overpass-api.de/api/interpreter?';

	// setting the output format to json
	ovpCall += 'data=[out:json];';

	// nodes and ways with "amenity"="bank"
	ovpCall += '(node["amenity"="bank"]({{bbox}});';
	ovpCall += 'way["amenity"="bank"]({{bbox}});';
	// other objects with "atm"="yes"
	ovpCall += '((node["atm"="yes"]({{bbox}});';
	ovpCall += 'way["atm"="yes"]({{bbox}}););';
	ovpCall += '-';
	ovpCall += '(node["amenity"="bank"]({{bbox}});';
	ovpCall += 'way["amenity"="bank"]({{bbox}}););';
	ovpCall += ');';
	// closes the atm set statement
	ovpCall += ');';
	// output statement
	ovpCall += 'out body;';
	// all nodes needed for ways only with lat/lng sorted by place
	ovpCall += '>;';
	ovpCall += 'out skel qt;';

	/** **************** */
	/** private methods */
	/** **************** */

	var loadPois = function() {
		var overpassCall;

		if (map.getZoom() < 13) {
			return;
		}

		// note: g in /{{bbox}}/g means replace all occurrences of
		// BOUNDINGBOX not just first occurrence
		overpassCall = ovpCall.replace(/{{bbox}}/g, utils.latLongToString(map
				.getBounds()));

		console.log("calling overpass-api: " + overpassCall);

		// using JQuery executing overpass api
		$.getJSON(overpassCall, function(data) {

			// first store all node from any ways
			$.each(data.elements, function(index, node) {

				// all nodes of type "node", some tagged nodes are necessary for
				// building ways, not all nodes here are stored are necessary
				// for storing
				if (node.type == "node") {
					wayNodeIds[node.id] = node;
				}
			});

			// overpass returns a list with elements, which contains the nodes
			$.each(data.elements, function(index, node) {

				if ("tags" in node) {

					if (node.id in nodeIds)
						return;

					nodeIds[node.id] = true;

					// bank (or anything else) with atm
					if (node.tags.atm == "yes") {
						addBankWithAtmToMap(node);
					}
					// an atm
					else if (node.tags.amenity == "atm") {
						addSingleAtmToMap(node);
					}
					// bank without atm (or anything else without atm, but this
					// case should be very rare)
					else if (node.tags.atm == "no") {
						addBankWithNoAtmToMap(node);
					}

					// bank with unknown atm state
					// note: it is important to check for node.tags.amenity ==
					// bank
					// because the if-constructs above omits nodes which has
					// tags but are not banks
					// this nodes will be store in next else case, because they
					// arre needed to build
					// ways
					else if (node.tags.amenity == "bank") {
						addBankWithUnknownAtmToMap(node);
					}
				}
			});
		});
	};

	var addBankWithNoAtmToMap = function(bank) {
		var name, marker;

		name = utils.createNameFromeTags(bank);
		marker = createMarker(bank, name, utils.noAtm);

		addToNamedGroup(name, marker);
	};

	var addBankWithUnknownAtmToMap = function(bank) {
		var name, marker;

		name = utils.createNameFromeTags(bank);
		marker = createMarker(bank, name, utils.unknownAtm);

		addToNamedGroup(name, marker);
	};

	var addBankWithAtmToMap = function(bank) {
		var name, marker;

		name = utils.createNameFromeTags(bank);
		marker = createMarker(bank, name, utils.yesAtm);

		addToNamedGroup(name, marker);
	};

	var createMarker = function(bank, name, atmIcon) {

		if (bank.type == "node") {
			var marker = L.marker([ bank.lat, bank.lon ], {
				icon : atmIcon
			});

			marker.bindPopup(name);

			return marker;

		} else if (bank.type == "way") {
			var areaNodes = new Array();
			var bankArea;
			var marker = null;
			var bounds;
			var center;

			$.each(bank.nodes, function(index, nodeId) {

				if (wayNodeIds[nodeId] == undefined) {
					console.log("wayNodeIds for " + nodeId);
				}

				areaNodes.push(L.latLng(wayNodeIds[nodeId].lat,
						wayNodeIds[nodeId].lon));
			});

			bankArea = L.polygon(areaNodes, {
				clickable : false
			});
			bounds = bankArea.getBounds();
			center = bounds.getCenter();

			marker = L.marker([ center.lat, center.lng ], {
				icon : atmIcon
			});

			marker.bindPopup(name);

			return L.layerGroup([ bankArea, marker ]);
		}
	};

	var addSingleAtmToMap = function(atm) {
		var name, marker;

		name = utils.createNameFromeTags(atm);
		marker = L.marker([ atm.lat, atm.lon ], {
			icon : utils.atm
		}).bindPopup(name);

		addToNamedGroup(name, marker);
	};

	var addToNamedGroup = function(name, marker) {
		var group, agregatedName;

		agregatedName = agregateName(name);

		try {
			group = namedGroup[agregatedName];
			group.addLayer(marker);
		} catch (e) {

		}
	};

	var buildLayers = function() {
		var group;

		operatorLayers = L.control.layers(null, null, {
			collapsed : false
		}).addTo(map);

		for (var i = 0; i < operatorCategories.length; i++) {
			group = L.layerGroup();
			group.addTo(map);
			namedGroup[operatorCategories[i]] = group;
			operatorLayers.addOverlay(group, operatorCategories[i]);
		}
	};

	var agregateName = function(name) {
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

	var moveEnd = function() {
		loadPois();
	};

	// public interface
	ATMMAP.initMap = function() {
		var attr_osm, attr_overpass, attr_icons, osm;

		attr_osm = 'Map data &copy; <a href="http://openstreetmap.org/">OpenStreetMap</a> contributors';
		attr_overpass = '<br>POIs via <a href="http://www.overpass-api.de/">Overpass API</a>';
		attr_icons = 'Icons by <a href="http://mapicons.nicolasmollet.com/">Nicolas Mollet</a> <a href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY SA 3.0</a>';

		osm = new L.TileLayer(
				'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution : [ attr_osm, attr_overpass, attr_icons ]
							.join(' | ')
				});

		// Sparkasse, Rheinhausen: 49.2787364, 8.4731802
		// Berlin: 52.516, 13.379

		map = L.map('map', {
			center : new L.LatLng(52.516, 13.379),
			zoom : 15,
			layers : osm
		});

		map.addControl(new L.Control.Permalink({
			text : 'Permalink'
		}));

		L.control.locate().addTo(map);

		buildLayers();

		utils.addLegendTo(map);

		loadPois();

		map.on('moveend', moveEnd);
	};

})();
