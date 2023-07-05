"use strict"
/**
 * @author Marcus Bleil, www.marcusbleil.de
 */

// eslint settings
/*global L, $, UTILS, LAYER_BUILDER */

// constructs the module ATMMAP
let ATMMAP = {};

(function () {
	// dependencies, see atmmaputils.js
	let utils = UTILS;
	// see atmmap_layerbuilder.js
	let layerBuilder = LAYER_BUILDER;

	let cooperativBanks = null;
	let otherBanks = null;

	ATMMAP.initMap = function () {

		map = buildMap();

		buildAtmWmsLayers();

		let osmGeocoder = buildOsmGeocoderAndAddToMap(map);

		L.control.locate({ strings: { title: "Gehe zum meinem Standort!" } }).addTo(map);

		L.control.sidebar('sidebar', { position: 'right' }).addTo(map);

		layerBuilder.buildLayers(map);

		addSearchToSidebar(osmGeocoder);

		loadPois();
	};

	/* ****************** */
	/* private attributes */
	/* ****************** */

	// contains the node id of the OSM objects
	// JavaScript pattern: object literal
	let nodeIds = {};
	let wayNodeIds = {};
	let map = null;

	// building the api call for atms (automated teller machine)
	// the overpass api URL
	let ovpCall = 'https://overpass-api.de/api/interpreter?data=';
	// setting the output format to json and timeout of 60 s
	ovpCall += '[out:json][timeout:60];';
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

	/** *************** */
	/** private methods */
	/** *************** */

	let buildAtmWmsLayers = function () {
		cooperativBanks = L.tileLayer('https://mymapnik.rudzick.it/MeinMapnikWMS/tiles/geldautomaten_genossenschaftsbanken_hq/webmercator_hq/{z}/{x}/{y}.png?origin=nw', {
			maxZoom: 19,
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		});

		otherBanks = L.tileLayer('https://mymapnik.rudzick.it/MeinMapnikWMS/tiles/geldautomaten_weiterebanken_hq/webmercator_hq/{z}/{x}/{y}.png?origin=nw', {
			maxZoom: 19,
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
		});
	}

	let buildMap = function () {
		let osm_layer = new L.TileLayer('https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png');

		let map = L.map('map', {
			center: new L.LatLng(52.516, 13.379),
			zoom: 15,
			layers: osm_layer
		});
		map.on('moveend', moveEnd);

		return map;
	}

	let buildOsmGeocoderAndAddToMap = function (map) {
		let geocoder = new L.Control.OSMGeocoder({
			position: 'topright',
			text: 'Suchen'
		});
		geocoder.addTo(map);
		return geocoder;
	}

	let addSearchToSidebar = function (osmGeocoder) {
		// see: https://stackoverflow.com/questions/41475855/adding-leaflet-layer-control-to-sidebar
		let htmlObject = osmGeocoder.getContainer();
		let searchdiv = document.getElementById("search_control");
		searchdiv.appendChild(htmlObject);
	}

	ATMMAP.test_query_necessary = function (next_polygon, previous_polygon = null) {
		let query_necessary;

		if (previous_polygon === null) {
			query_necessary = true;
		}
		else {
			if (previous_polygon.contains(next_polygon)) {
				query_necessary = false;
				}
			else {
				query_necessary = true;
			}
			console.debug("query nec: " + query_necessary);
			console.debug("next_p:" + JSON.stringify(next_polygon));
			console.debug("prev_p:" + JSON.stringify(previous_polygon));
		}
		return query_necessary;
	}

	let saveAllNodes = function (data) {
		$.each(data.elements, function (index, node) {
			// all nodes of type "node", some tagged nodes are necessary for
			// building ways, not all nodes here are stored are necessary for storing
			if (node.type == "node") {
				wayNodeIds[node.id] = node;
			}
		});
	}

	let addAtmNodeToMap = function (node) {
		// bank (or anything else) with atm
		if (node.tags.atm == "yes") {
			addNodeWithAtmToMap(node);
		}
		// a single atm
		else if (node.tags.amenity == "atm") {
			addSingleAtmToMap(node);
		}
		// banks without atm or unknow state
		else if (node.tags.amenity == "bank") {
			if (node.tags.atm == "no") {
				addBankWithNoAtmToMap(node);
			}
			else {
				addBankWithUnknownAtmToMap(node);
			}
		}
	}

	let storeAtmNodesToMap = function (data) {

		// overpass returns a list with elements, which contains the nodes
		$.each(data.elements, function (index, node) {

			// Guardian condition: if node has no "tags" property no further processing is necessary.
			if (!("tags" in node)) return;
			// Guardian condition: If the node has already been processed before, a new processing is not necessary
			if (node.is in nodeIds) return;

			nodeIds[node.id] = true;

			addAtmNodeToMap(node);
		});
	}

	ATMMAP.query_bound = null;
	ATMMAP.updateQueryBound = function newFunction(mapBounds) {
		if (ATMMAP.query_bound === null) {
			ATMMAP.query_bound = L.bounds(mapBounds.getTopLeft(), mapBounds.getBottomRight());
		}
		else {
			ATMMAP.query_bound.extend(mapBounds);
		}
	}

	let callOverpassApi = function (overpassCall) {
		map.spin(true, { color: '#0026FF', radius: 20, width: 7, length: 20 });

		// using JQuery executing overpass api
		$.getJSON(overpassCall, function (data) {
			saveAllNodes(data);
			storeAtmNodesToMap(data);
		}).always(function () {
			map.spin(false);
		}).fail(function (jqXHR, textStatus, errorThrown) {
			console.error(textStatus);
			console.error(errorThrown);
			console.error(jqXHR);
		});
	}

	let loadPois = function () {

		if (map.getZoom() < 15) {
			setupSmallZoom();
		}
		else {
			setupLargeZoom();

			let mapBounds = utils.latLngBoundsToBounds(map.getBounds());
			mapBounds = mapBounds.pad(2);
			let query_necessary = ATMMAP.test_query_necessary(mapBounds, ATMMAP.query_bound);

			if (query_necessary) {

				ATMMAP.updateQueryBound(mapBounds);

				// note: g in /{{bbox}}/g means replace all occurrences of {{bbox}} not just first occurrence
				//FIXME das ist her falsch, wenn oben der Suchbereich verdoppelt wird
				let overpassCall = ovpCall.replace(/{{bbox}}/g, utils.latLongToString(map.getBounds()));

				callOverpassApi(overpassCall);
			}
		}
	}

	let setupLargeZoom = function () {
		otherBanks.remove();
		cooperativBanks.remove();
	}

	let setupSmallZoom = function () {
		otherBanks.addTo(map);
		cooperativBanks.addTo(map);

		for (let l of layerBuilder.namedGroup) {
			l.clearLayers();
		}
		ATMMAP.query_bound = null;
		nodeIds = {};
	}

	let addBankWithNoAtmToMap = function (bank) {
		let name, marker;

		name = utils.createDescriptionFromeTags(bank);
		marker = createMarker(bank, name, utils.noAtm);

		addToNamedGroups(bank, marker);
	};

	let addBankWithUnknownAtmToMap = function (bank) {
		let name, marker;

		name = utils.createDescriptionFromeTags(bank);
		marker = createMarker(bank, name, utils.unknownAtm);

		addToNamedGroups(bank, marker);
	};

	let addNodeWithAtmToMap = function (node) {
		let name, marker;

		name = utils.createDescriptionFromeTags(node);

		if (node.tags.amenity == "bank") {
			marker = createMarker(node, name, utils.yesAtm);
		}
		else {
			marker = createMarker(node, name, utils.atm);
		}

		addToNamedGroups(node, marker);
	};

	let createMarkerForNode = function (node, name, atmIcon) {
		let marker = L.marker([node.lat, node.lon], {
			icon: atmIcon
		});

		marker.bindPopup(name);

		return marker;
	}

	let createMarkerForWay = function (node, wayNodeIds, atmIcon, name) {
		let areaNodes = new Array();
		let bankArea;
		let marker = null;
		let bounds;
		let center;

		$.each(node.nodes, function (index, nodeId) {
			areaNodes.push(L.latLng(wayNodeIds[nodeId].lat, wayNodeIds[nodeId].lon));
		});

		bankArea = L.polygon(areaNodes, { clickable: false });
		bounds = bankArea.getBounds();
		center = bounds.getCenter();

		marker = L.marker([center.lat, center.lng], { icon: atmIcon });

		marker.bindPopup(name);

		return L.layerGroup([bankArea, marker]);
	}

	let createMarker = function (node, name, atmIcon) {

		if (node.type == "node") {
			return createMarkerForNode(node, name, atmIcon);
		}
		else if (node.type == "way") {
			return createMarkerForWay(node, wayNodeIds, atmIcon, name);
		}
	};

	let addSingleAtmToMap = function (atm) {
		let name, marker;

		name = utils.createDescriptionFromeTags(atm);
		marker = L.marker([atm.lat, atm.lon], { icon: utils.atm }).bindPopup(name);

		addToNamedGroups(atm, marker);
	};

	let addToNamedGroups = function (node, marker) {
		try {
			layerBuilder.addToNamedGroups(node, marker);
		} catch (e) {
			console.debug(e);
		}
	};

	let moveEnd = function () {
		loadPois();
	};

})();