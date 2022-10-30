"use strict"
/**
 * @author Marcus Bleil, www.marcusbleil.de
 * 
 */

//import { polygon as flatter_polygon } from "./node_modules/@flatten-js/core/index.js"

// constructs the module ATMMAP
let ATMMAP = {};

(function () {

	// dependencies
	let utils = UTILS;
	let layerBuilder = LAYER_BUILDER;

	// public interface
	ATMMAP.initMap = function () {
		let attr_osm, attr_overpass, attr_icons;
		attr_osm = 'Map data &copy; <a href="http://openstreetmap.org/">OpenStreetMap</a> contributors';
		attr_overpass = '<br>POIs via <a href="http://www.overpass-api.de/">Overpass API</a>';
		attr_icons = 'Icons by <a href="http://mapicons.nicolasmollet.com/">Nicolas Mollet</a> <a href="http://creativecommons.org/licenses/by-sa/3.0/">CC BY SA 3.0</a>';

		let osm_layer;
		osm_layer = new L.TileLayer(
			'https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png'
		);

		map = L.map('map', {
			center: new L.LatLng(52.516, 13.379),
			zoom: 15,
			layers: osm_layer
		});

		let osmGeocoder = new L.Control.OSMGeocoder({
			position: 'topright',
			text: 'Suchen'
		}).addTo(map);

		let lc = L.control.locate({
			strings: {
				title: "Gehe zum meinem Standort!"
			}
		}).addTo(map);

		let sidebar = L.control.sidebar('sidebar', { position: 'right' }).addTo(map);

		layerBuilder.buildLayers(map);

		/**
		 * see:
		 * https://stackoverflow.com/questions/41475855/adding-leaflet-layer-control-to-sidebar
		 */
		let htmlObject = osmGeocoder.getContainer();
		let searchdiv = document.getElementById("search_control")
		function setParent(el, newParent) {
			newParent.appendChild(el);
		}
		setParent(htmlObject, searchdiv);

		loadPois();

		map.on('moveend', moveEnd);
	};


	/* private attributes */

	// contains the node id of the OSM objects
	// JavaScript pattern: object literal
	let nodeIds = {};
	let wayNodeIds = {};

	let map = null;

	// building the api call for atms (automated teller machine)
	// the overpass api URL
	let ovpCall = 'https://lz4.overpass-api.de/api/interpreter?data=';

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

	let query_polygon = null;

	ATMMAP.test_query_necessary = function (query, next_query) {
		let query_necessary;
		// note: query_polygon is a class member, existing out of method call
		if (query === null) {
			query = next_query;
			query = turf.transformScale(query, 2);
			query_necessary = true;
		}
		else {
			console.log("#1: " + JSON.stringify(query));

			if (turf.booleanContains(query, next_polygon)) {
				query_necessary = false;
			}
			else {
				query = turf.union(query, next_polygon);
				query_necessary = true;
			}

			//console.log("#2: query_necessary set to " + query_necessary);
		}

		//console.log("#2: " + JSON.stringify(query_polygon));
		//console.log("query_necessary=" + query_necessary);

		return query_necessary;
	}

	let loadPois = function () {
		let overpassCall;

		if (map.getZoom() < 13) {
			return;
		}

		// https://alexbol99.github.io/flatten-js/index.html

		// könnte auch gehen: http://turfjs.org/getting-started

		// leaflet-Methoden: pad, contains, distanceTo
		// flatten-js-Methoden: addFace

		let new_area = map.getBounds();
		let new_polygon = turf.polygon(
			[
				[
					[new_area.getNorthWest().lat, new_area.getNorthWest().lng],
					[new_area.getNorthEast().lat, new_area.getNorthEast().lng],
					[new_area.getSouthEast().lat, new_area.getSouthEast().lng],
					[new_area.getSouthWest().lat, new_area.getSouthWest().lng],
					[new_area.getNorthWest().lat, new_area.getNorthWest().lng],
				]
			]
		);

		/**
		polygon = turf.polygon([[[-5, 52], [-4, 56], [-2, 51], [-7, 54], [-5, 52]]], { name: 'poly1' });
		polygon_child =  turf.polygon([[[-6, 52], [-4, 56], [-2, 51], [-7, 54], [-6, 52]]], { name: 'poly2' });
		JSON.stringify(polygon)
		JSON.stringify(polygon_child)
		turf.booleanContains(polygon, polygon_child)
		
		*/

		let query_necessary;
		// note: query_polygon is a class member, existing out of method call
		if (query_polygon === null) {
			query_polygon = new_polygon;
			query_polygon = turf.transformScale(query_polygon, 2);
			query_necessary = true;
		}
		else {
			console.log("#1: " + JSON.stringify(query_polygon));

			if (turf.booleanContains(query_polygon, new_polygon)) {
				query_necessary = false;
			}
			else {
				query_polygon = turf.union(query_polygon, new_polygon);
				query_necessary = true;
			}

			console.log("#2: query_necessary set to " + query_necessary);
		}

		console.log("#2: " + JSON.stringify(query_polygon));
		console.log("query_necessary=" + query_necessary);

		if (query_necessary) {

			// note: g in /{{bbox}}/g means replace all occurrences of
			// {{bbox}} not just first occurrence
			overpassCall = ovpCall.replace(/{{bbox}}/g, utils.latLongToString(map
				.getBounds()));

			map.spin(true, {
				color: '#0026FF',
				radius: 20,
				width: 7,
				length: 20
			});

			// using JQuery executing overpass api
			let ovpCallForAtms = $.getJSON(overpassCall, function (data) {

				// first store all node from any ways
				$.each(data.elements, function (index, node) {

					// all nodes of type "node", some tagged nodes are necessary for
					// building ways, not all nodes here are stored are necessary
					// for storing
					if (node.type == "node") {
						wayNodeIds[node.id] = node;
					}

				});

				// overpass returns a list with elements, which contains the nodes
				$.each(data.elements, function (index, node) {

					// Guardian condition: if node has no "tags" property
					// no further processing is necessary.
					if (!("tags" in node)) return;

					// Guardian condition: If the node has already been processed before,
					// a new processing is not necessary
					if (node.is in nodeIds) return;

					nodeIds[node.id] = true;

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
						} else {
							addBankWithUnknownAtmToMap(node);
						}
					}
				});
			}).always(function () {
				map.spin(false);
			});
		}
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
