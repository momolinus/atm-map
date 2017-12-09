// constructs the module ATMMAP
var ATMMAP = {};

var spinner = new Spinner().spin();
//target.appendChild(spinner.el);

(function() {

	// dependencies
	utils = UTILS;
	layerBuilder = LAYER_BUILDER;

	/* private attributes */

	// contains the node id of the OSM objects
	// JavaScript pattern: object literal
	var nodeIds = {};
	var wayNodeIds = {};

	var map = null;

	// building the api call for atms (automated teller machine)
	// the overpass api URL
	var ovpCall = 'https://lz4.overpass-api.de/api/interpreter?data=';

	// setting the output format to json
	ovpCall += '[out:json];';

	// nodes and ways with "amenity"="bank"
	ovpCall += '(';
	ovpCall += 'node["amenity"="bank"]({{bbox}});';
	ovpCall += 'way["amenity"="bank"]({{bbox}});';
	ovpCall += 'node["amenity"="atm"]({{bbox}});';

	// other objects with "atm"="yes"
	ovpCall += '(';
	ovpCall += '(';
	ovpCall += 'node["atm"="yes"]({{bbox}});';
	ovpCall += 'way["atm"="yes"]({{bbox}});';
	ovpCall += ');';
	// - means difference
	ovpCall += '-';
	// but no banks
	ovpCall += '(';
	ovpCall += 'node["amenity"="bank"]({{bbox}});';
	ovpCall += 'way["amenity"="bank"]({{bbox}});';
	ovpCall += 'node["amenity"="atm"]({{bbox}});';
	ovpCall += ');';
	ovpCall += ');';

	// closes the atm set statement
	ovpCall += ');';

	// output statement
	ovpCall += 'out body;';

	// all nodes needed for ways only with lat/lng (skel) sorted by place (qt)
	ovpCall += '>;';
	ovpCall += 'out skel qt;';

	// public interface
	ATMMAP.initMap = function() {
		var attr_osm, attr_overpass, attr_icons, osm;

		attr_osm = 'Map data &copy; <a href="http://openstreetmap.org/">OpenStreetMap</a> contributors';
		attr_overpass = '<br>POIs via <a href="http://www.overpass-api.de/">Overpass API</a>';
		attr_icons = 'Icons by <a href="http://mapicons.nicolasmollet.com/">Nicolas Mollet</a> <a href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY SA 3.0</a>';

		osm = new L.TileLayer(
				'https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png', {
					attribution : [ attr_osm, attr_overpass, attr_icons ]
							.join(' | ')
				});

		map = L.map('map', {
			center : new L.LatLng(52.516, 13.379),
			zoom : 15,
			layers : osm
		});

		map.addControl(new L.Control.Permalink({
			text : 'Permalink',
			position : 'bottomright'
		}));
		
		var lc = L.control.locate({
				strings: {
					title: "Gehe zum meinem Standort!"
        		}
        }).addTo(map);
		
        var osmGeocoder = new L.Control.OSMGeocoder({
        		position: 'topright',
        		text: 'Suchen'
        });
        map.addControl(osmGeocoder);
        
		layerBuilder.buildLayers(map);

		utils.addLegendTo(map);

		loadPois();

		map.on('moveend', moveEnd);
	};

	/** *************** */
	/** private methods */
	/** *************** */

	var loadPois = function() {
		var overpassCall;

		if (map.getZoom() < 13) {
			return;
		}

		// note: g in /{{bbox}}/g means replace all occurrences of
		// {{bbox}} not just first occurrence
		overpassCall = ovpCall.replace(/{{bbox}}/g, utils.latLongToString(map
				.getBounds()));

		console.log("calling overpass-api: " + overpassCall);

		map.spin(true, {
			color : '#0026FF',
			radius : 20,
			width : 7,
			length : 20
		});
		
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

					if (!(node.id in nodeIds)) {

						nodeIds[node.id] = true;

						// bank (or anything else) with atm
						if (node.tags.atm == "yes") {
							addNodeWithAtmToMap(node);
						}

						// an atm
						else if (node.tags.amenity == "atm") {
							addSingleAtmToMap(node);
						}

						// banks without atm or unknow state
						else if (node.tags.amenity == "bank") {

							if (node.tags.atm == "no") {
								addBankWithNoAtmToMap(node);
							} else {
								addBankWithUnknownAtmToMap(node);
							}
						}
					}
				}
				map.spin(false);
			});
		});
	};

	var addBankWithNoAtmToMap = function(bank) {
		var name, marker;

		name = utils.createDescriptionFromeTags(bank);
		marker = createMarker(bank, name, utils.noAtm);

		addToNamedGroups(bank, marker);
	};

	var addBankWithUnknownAtmToMap = function(bank) {
		var name, marker;

		name = utils.createDescriptionFromeTags(bank);
		marker = createMarker(bank, name, utils.unknownAtm);

		addToNamedGroups(bank, marker);
	};

	var addNodeWithAtmToMap = function(node) {
		var name, marker;

		name = utils.createDescriptionFromeTags(node);

		if (node.tags.amenity == "bank") {
			marker = createMarker(node, name, utils.yesAtm);
		} else {
			marker = createMarker(node, name, utils.atm);
		}

		addToNamedGroups(node, marker);
	};

	var createMarker = function(node, name, atmIcon) {

		if (node.type == "node") {
			var marker = L.marker([ node.lat, node.lon ], {
				icon : atmIcon
			});

			marker.bindPopup(name);

			return marker;

		} else if (node.type == "way") {
			var areaNodes = new Array();
			var bankArea;
			var marker = null;
			var bounds;
			var center;

			$.each(node.nodes, function(index, nodeId) {

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

		name = utils.createDescriptionFromeTags(atm);
		marker = L.marker([ atm.lat, atm.lon ], {
			icon : utils.atm
		}).bindPopup(name);

		addToNamedGroups(atm, marker);
	};

	var addToNamedGroups = function(node, marker) {
		try {
			layerBuilder.addToNamedGroups(node, marker);
		} catch (e) {
			console.debug(e);
		}
	};

	var moveEnd = function() {
		loadPois();
	};

})();
