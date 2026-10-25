"use strict"
/**
 * ATM data from the Overpass API: query, markers for banks and ATMs.
 */

// eslint settings
/*global L, $ */

import { utils } from "./atmmaputils.js";
import { layerBuilder } from "./atmmap_layerbuilder.js";
import { MIN_ZOOM } from "./atmmap_config.js";

export const overpass = {};

	let map = null;
	let active = false;
	// Incremented on deactivation so responses of older requests are ignored.
	let generation = 0;
	let requests = [];
	// contains the node id of the OSM objects
	let nodeIds = {};
	let wayNodeIds = {};

	let buildQuery = function () {
		let query = 'https://overpass-api.de/api/interpreter?data=';
		// setting the output format to json and timeout of 60 s
		query += '[out:json][timeout:60];';
		// nodes and ways with "amenity"="bank"
		query += '(';
		query += 'node["amenity"="bank"]({{bbox}});';
		query += 'way["amenity"="bank"]({{bbox}});';
		query += 'node["amenity"="atm"]({{bbox}});';
		// other objects with "atm"="yes"
		query += '(';
		query += '(';
		query += 'node["atm"="yes"]({{bbox}});';
		query += 'way["atm"="yes"]({{bbox}});';
		query += ');';
		// - means difference
		query += '-';
		// but no banks
		query += '(';
		query += 'node["amenity"="bank"]({{bbox}});';
		query += 'way["amenity"="bank"]({{bbox}});';
		query += 'node["amenity"="atm"]({{bbox}});';
		query += ');';
		query += ');';
		// closes the atm set statement
		query += ');';
		// output statement
		query += 'out body;';
		// all nodes needed for ways only with lat/lng (skel) sorted by place (qt)
		query += '>;';
		query += 'out skel qt;';
		return query;
	};
	let queryTemplate = buildQuery();

	/**
	 * Connects the module to the map, must be called once.
	 */
	overpass.init = function (mapToUse) {
		map = mapToUse;
	};

	overpass.activate = function () {
		active = true;
		overpass.loadPois();
	};

	overpass.deactivate = function () {
		active = false;
		generation++;
		abortRequests();
		nodeIds = {};
		wayNodeIds = {};
		queryBound = null;
	};

	overpass.test_query_necessary = function (next_polygon, previous_polygon = null) {
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

			console.debug("query_necessary: " + query_necessary);
		}
		return query_necessary;
	}

	// Covers the areas already requested; map areas fully contained in it need no new request.
	let queryBound = null;
	let updateQueryBound = function (mapBounds) {
		if (queryBound === null) {
			queryBound = L.latLngBounds(mapBounds.getNorthWest(), mapBounds.getSouthEast());
		}
		else {
			queryBound.extend(mapBounds);
		}
	}

	/**
	 * Called when the map is created and whenever it is moved. Retrieves the ATMs
	 * of the current display area, if this area was not loaded before.
	 */
	overpass.loadPois = function () {
		if (!active || map.getZoom() < MIN_ZOOM) {
			return;
		}
		let mapBounds = map.getBounds();
		if (!overpass.test_query_necessary(mapBounds, queryBound)) {
			return;
		}
		updateQueryBound(mapBounds);

		// note: g in /{{bbox}}/g means replace all occurrences of {{bbox}} not just first occurrence
		callOverpassApi(queryTemplate.replace(/{{bbox}}/g, utils.latLongToString(mapBounds)));
	};

	let abortRequests = function () {
		if (requests.length > 0) {
			let pending = requests;
			requests = [];
			pending.forEach(function (request) {
				request.abort();
			});
			map.spin(false);
		}
	};

	overpass.describeError = function (jqXHR, textStatus) {
		if (textStatus === "timeout") {
			return "Die Anfrage an die Overpass API hat zu lange gedauert. Bitte versuchen Sie es später erneut.";
		}
		if (textStatus === "parsererror") {
			return "Die Antwort der Overpass API konnte nicht gelesen werden. Bitte versuchen Sie es später erneut.";
		}
		if (textStatus === "abort") {
			return "Die Anfrage an die Overpass API wurde abgebrochen.";
		}
		switch (true) {
			case jqXHR.status === 400:
				return "Die Overpass API hat die Anfrage abgelehnt. Möglicherweise ist die Abfrage ungültig.";
			case jqXHR.status === 403:
				return "Die Overpass API hat den Zugriff verweigert.";
			case jqXHR.status === 404:
				return "Der Overpass API-Endpunkt wurde nicht gefunden.";
			case jqXHR.status === 408 || jqXHR.status === 504:
				return "Die Overpass API hat die Anfrage wegen einer Zeitüberschreitung abgebrochen. Bitte versuchen Sie es später erneut.";
			case jqXHR.status === 429:
				return "Zu viele Anfragen an die Overpass API. Bitte warten Sie kurz und versuchen Sie es erneut.";
			case jqXHR.status >= 500:
				return "Die Overpass API ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.";
			case jqXHR.status === 0:
				return "Die Overpass API ist nicht erreichbar. Prüfen Sie Ihre Internetverbindung und ob der Browser die Anfrage blockiert (CORS).";
			default:
				return "Beim Abrufen der Daten von der Overpass API ist ein unerwarteter Fehler aufgetreten (" + textStatus + ").";
		}
	};

	let callOverpassApi = function (overpassCall) {
		map.spin(true, { color: '#0026FF', radius: 20, width: 7, length: 20 });

		//TODO it seems to be possible to start a new request while another one is running.
		// This should be avoided to prevent conflicts or unnecessary load on the Overpass API.

		let requestGeneration = generation;
		let isOutdated = function () {
			return !active || requestGeneration !== generation;
		};
		// The generation prevents late responses from refilling layers after the data source was switched.
		let request = $.getJSON(overpassCall);
		requests.push(request);
		request.done(function (data) {
			if (!isOutdated()) {
				saveAllNodes(data);
				storeAtmNodesToMap(data);
			}
		}).fail(function (jqXHR, textStatus, errorThrown) {
			if (textStatus === "abort" || isOutdated()) {
				return;
			}
			console.error(textStatus);
			console.error(errorThrown);
			console.error(jqXHR);
			alert(overpass.describeError(jqXHR, textStatus));
		}).always(function () {
			requests = requests.filter(function (activeRequest) {
				return activeRequest !== request;
			});
			if (requests.length === 0) {
				map.spin(false);
			}
		});
	};

	let saveAllNodes = function (data) {
		$.each(data.elements, function (index, node) {
			// Overpass also returns the nodes of ways, so bank buildings can be drawn as outlines.
			if (node.type == "node") {
				wayNodeIds[node.id] = node;
			}
		});
	}

	let storeAtmNodesToMap = function (data) {

		// overpass returns a list with elements, which contains the nodes
		$.each(data.elements, function (index, node) {

			// Guardian condition: if node has no "tags" property no further processing is necessary.
			if (!("tags" in node)) return;
			// Guardian condition: If the node has already been processed before, a new processing is not necessary
			if (node.id in nodeIds) return;

			nodeIds[node.id] = true;

			addAtmNodeToMap(node);
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

		// The clickable marker is placed in the center of the building outline.
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
