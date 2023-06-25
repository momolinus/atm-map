"use strict"
/**
 * @author Marcus Bleil, www.marcusbleil.de
 */

// eslint settings
/*global L, $, UTILS, LAYER_BUILDER, turf*/

// constructs the module ATMMAP
let ATMMAP = {};

(function () {
	// dependencies, see atmmaputils.js
	let utils = UTILS;
	// see atmmap_layerbuilder.js
	let layerBuilder = LAYER_BUILDER;

	// public interface, used in index.html
	ATMMAP.initMap = function () {
		//TODO map ist ein "Attribut" der Klasse und darf hier nicht mit let definiert werden
		// lässt sich das noch deutlicher machen
		map = buildMap();

		let osmGeocoder = buildOsmGeocoderAndAddToMap(map);
		addLocateControlToMap(map);
		addSidebarToMap(map);

		//TODO Projekt später als Variante der ATM-MAP weiter entwickeln
		// addPropagationButtonToMap(map);

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
	let ovpCall = 'http://overpass-api.de/api/interpreter?data=';
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

	function buildMap() {
		let osm_layer = new L.TileLayer('https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png');

		let map = L.map('map', {
			center: new L.LatLng(52.516, 13.379),
			zoom: 15,
			layers: osm_layer
		});
		map.on('moveend', moveEnd);

		return map;
	}

	function addPropagationButtonToMap(map) {

		L.Control.Button = L.Control.extend({
			options: {
				position: 'topleft'
			},
			onAdd: function (map) {
				var container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
				var button = L.DomUtil.create('a', 'leaflet-control-button atm-reload-button', container);
				L.DomEvent.disableClickPropagation(button);
				L.DomEvent.on(button, 'click', function () {
					loadPois();
				});

				container.title = "die Geldautomaten anzeigen";

				return container;
			},
			onRemove: function (map) { },
		});

		let control = new L.Control.Button();
		control.addTo(map);
	}

	function setParent(el, newParent) {
		newParent.appendChild(el);
	}

	function addSidebarToMap(map) {
		L.control.sidebar('sidebar',
			{ position: 'right' }
		).addTo(map);
	}

	function addLocateControlToMap(map) {
		L.control.locate({
			strings:
				{ title: "Gehe zum meinem Standort!" }
		}).addTo(map);
	}

	function buildOsmGeocoderAndAddToMap(map) {
		let geocoder = new L.Control.OSMGeocoder({
			position: 'topright',
			text: 'Suchen'
		});
		geocoder.addTo(map);
		return geocoder;
	}

	function addSearchToSidebar(osmGeocoder) {
		// see: https://stackoverflow.com/questions/41475855/adding-leaflet-layer-control-to-sidebar
		let htmlObject = osmGeocoder.getContainer();
		let searchdiv = document.getElementById("search_control");
		setParent(htmlObject, searchdiv);
	}

	let query_polygon = null;

	ATMMAP.test_query_necessary = function (next_polygon) {
		let query_necessary;
		if (query_polygon === null) {
			query_polygon = next_polygon;
			query_polygon = turf.transformScale(query_polygon, 2);
			query_necessary = true;
		}
		else {
			if (turf.booleanContains(query_polygon, next_polygon)) {
				query_necessary = false;
			}
			else {
				query_polygon = turf.union(query_polygon, next_polygon);
				query_necessary = true;
			}
		}

		return query_necessary;
	}

	function saveAllNodes(data) {
		$.each(data.elements, function (index, node) {
			// all nodes of type "node", some tagged nodes are necessary for
			// building ways, not all nodes here are stored are necessary for storing
			if (node.type == "node") {
				wayNodeIds[node.id] = node;
			}
		});
	}

	function addAtmNodeToMap(node) {
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
				addBankWithUnknownAtmToMap(node);
			}
		}
	}

	function storeAtmNodesToMap(data) {

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

	let loadPois = function () {

		if (map.getZoom() < 13) return;

		// note: g in /{{bbox}}/g means replace all occurrences of {{bbox}} not just first occurrence
		let overpassCall = ovpCall.replace(/{{bbox}}/g, utils.latLongToString(map.getBounds()));

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
	};

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
		} else {
			marker = createMarker(node, name, utils.atm);
		}

		addToNamedGroups(node, marker);
	};

	let createMarker = function (node, name, atmIcon) {

		if (node.type == "node") {
			let marker = L.marker([node.lat, node.lon], {
				icon: atmIcon
			});

			marker.bindPopup(name);

			return marker;

		} else if (node.type == "way") {
			let areaNodes = new Array();
			let bankArea;
			let marker = null;
			let bounds;
			let center;

			$.each(node.nodes, function (index, nodeId) {

				if (wayNodeIds[nodeId] == undefined) {
					console.log("wayNodeIds for " + nodeId);
				}

				areaNodes.push(L.latLng(wayNodeIds[nodeId].lat,
					wayNodeIds[nodeId].lon));
			});

			bankArea = L.polygon(areaNodes, {
				clickable: false
			});
			bounds = bankArea.getBounds();
			center = bounds.getCenter();

			marker = L.marker([center.lat, center.lng], {
				icon: atmIcon
			});

			marker.bindPopup(name);

			return L.layerGroup([bankArea, marker]);
		}
	};

	let addSingleAtmToMap = function (atm) {
		let name, marker;

		name = utils.createDescriptionFromeTags(atm);
		marker = L.marker([atm.lat, atm.lon], {
			icon: utils.atm
		}).bindPopup(name);

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
