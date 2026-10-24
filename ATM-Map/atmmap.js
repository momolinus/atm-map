"use strict"
/**
 * @author Marcus Bleil
 */

// eslint settings
/*global L, $, UTILS, LAYER_BUILDER */

// constructs the module ATMMAP
let ATMMAP = {};
ATMMAP.SOURCE_OVERPASS = "overpass";
ATMMAP.SOURCE_VECTOR_TILES = "vector-tiles";

(function () {
	// dependencies, see atmmaputils.js
	let utils = UTILS;
	// see atmmap_layerbuilder.js
	let layerBuilder = LAYER_BUILDER;
	let dataSource = ATMMAP.SOURCE_OVERPASS;
	let dataSourceGeneration = 0;
	let overpassRequests = [];
	let vectorTileLayer = null;
	let vectorTileErrorShown = false;
	let vectorTileUrl = "https://sbtiles.obstbaumkarte.de/table.public.alle_geldautomaten.geom/{z}/{x}/{y}.pbf";
	let vectorTileLayerName = "table.public.alle_geldautomaten.geom";

	ATMMAP.initMap = function () {

		map = buildMap();

		let osmGeocoder = buildOsmGeocoderAndAddToMap(map);

		L.control.locate({ strings: { title: "Gehe zum meinem Standort!" } }).addTo(map);

		L.control.sidebar('sidebar', { position: 'right' }).addTo(map);

		layerBuilder.buildLayers(map);
		layerBuilder.onCategoriesChanged(function () {
			if (vectorTileLayer) {
				vectorTileLayer.redraw();
			}
		});

		addSearchToSidebar(osmGeocoder);
		addDataSourceControl();

		loadPois();
	};

	ATMMAP.getDataSource = function () {
		return dataSource;
	};

	ATMMAP.setDataSource = function (source) {
		if (source !== ATMMAP.SOURCE_OVERPASS && source !== ATMMAP.SOURCE_VECTOR_TILES) {
			throw new Error("Unknown ATM data source: " + source);
		}
		if (source === dataSource) {
			return;
		}
		if (!map) {
			throw new Error("The map must be initialized before changing the data source.");
		}

		dataSource = source;
		dataSourceGeneration++;
		abortOverpassRequests();
		layerBuilder.clearLayers();
		nodeIds = {};
		wayNodeIds = {};
		ATMMAP.query_bound = null;

		if (vectorTileLayer) {
			map.removeLayer(vectorTileLayer);
			vectorTileLayer = null;
		}

		if (dataSource === ATMMAP.SOURCE_OVERPASS) {
			loadPois();
		}
		else {
			vectorTileErrorShown = false;
			vectorTileLayer = createVectorTileLayer();
			vectorTileLayer.addTo(map);
		}
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

	let buildMap = function () {
		let osm_layer = new L.TileLayer(
			'https://tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png',
			{
				attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
			}
		);
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

	let addDataSourceControl = function () {
		document.querySelectorAll('input[name="data-source"]').forEach(function (input) {
			input.addEventListener("change", function () {
				if (input.checked) {
					ATMMAP.setDataSource(input.value);
				}
			});
		});
	};

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
			
			console.debug("query_necessary: " + query_necessary);
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
			if (node.id in nodeIds) return;

			nodeIds[node.id] = true;

			addAtmNodeToMap(node);
		});
	}

	let getVectorTileIcon = function (properties) {
		if (properties.amenity === "atm") {
			return utils.atm;
		}
		if (properties.amenity === "bank") {
			if (properties.atm === "yes") {
				return utils.yesAtm;
			}
			if (properties.atm === "no") {
				return utils.noAtm;
			}
			return utils.unknownAtm;
		}
		if (properties.atm === "yes") {
			return utils.atm;
		}
		return null;
	};

	let getVectorTileStyle = function (properties, zoom) {
		let categoryIndices = layerBuilder.getCategoryIndexes({ properties: properties });
		let icon = getVectorTileIcon(properties);
		let categoryEnabled = categoryIndices.some(function (categoryIndex) {
			return layerBuilder.isCategoryEnabled(categoryIndex);
		});

		if (!icon || !categoryEnabled) {
			return [];
		}
		return { icon: icon };
	};
	ATMMAP.getVectorTileStyle = getVectorTileStyle;

	let createVectorTileLayer = function () {
		let vectorTileLayerStyles = {};
		vectorTileLayerStyles[vectorTileLayerName] = getVectorTileStyle;
		let tileLayer = L.vectorGrid.protobuf(vectorTileUrl, {
			attribution: 'ATM-Daten &copy; OpenStreetMap-Mitwirkende, via <a href="https://sbtiles.obstbaumkarte.de/">obstbaumkarte.de</a>',
			interactive: true,
			vectorTileLayerStyles: vectorTileLayerStyles
		});

		tileLayer.on("click", function (event) {
			if (!event.layer || !event.layer.properties) {
				console.error("Clicked vector tile feature has no properties.", event);
				return;
			}
			map.openPopup(
				utils.createDescriptionFromeTags({ tags: event.layer.properties }),
				event.latlng
			);
		});
		tileLayer.on("tileerror", function (event) {
			console.error("ATM vector tile could not be loaded.", event);
			if (!vectorTileErrorShown) {
				vectorTileErrorShown = true;
				alert("Die ATM-Vektorkacheln konnten nicht geladen werden. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es später erneut.");
			}
		});

		return tileLayer;
	};

	let abortOverpassRequests = function () {
		if (overpassRequests.length > 0) {
			let requests = overpassRequests;
			overpassRequests = [];
			requests.forEach(function (request) {
				request.abort();
			});
			map.spin(false);
		}
	};

	ATMMAP.query_bound = null;
	ATMMAP.updateQueryBound = function newFunction(mapBounds) {
		if (ATMMAP.query_bound === null) {
			ATMMAP.query_bound = L.latLngBounds(mapBounds.getNorthWest(), mapBounds.getSouthEast());
		}
		else {
			ATMMAP.query_bound.extend(mapBounds);
		}
	}

	let callOverpassApi = function (overpassCall) {
		map.spin(true, { color: '#0026FF', radius: 20, width: 7, length: 20 });

		//TODO es scheint, dass es möglich ist, während einer 
		// laufenden Anfrage eine neue Anfrage zu starten.
		// das sollte vermieden werden, um Konflikte oder unnötige Last auf der Overpass API zu verhindern.
	

		let requestSourceGeneration = dataSourceGeneration;
		let request = $.getJSON(overpassCall);
		overpassRequests.push(request);
		request.done(function (data) {
			if (dataSource !== ATMMAP.SOURCE_OVERPASS || requestSourceGeneration !== dataSourceGeneration) {
				return;
			}
			saveAllNodes(data);
			storeAtmNodesToMap(data);
		}).fail(function (jqXHR, textStatus, errorThrown) {
			if (textStatus === "abort" || dataSource !== ATMMAP.SOURCE_OVERPASS ||
				requestSourceGeneration !== dataSourceGeneration) {
				return;
			}
			console.error(textStatus);
			console.error(errorThrown);
			console.error(jqXHR);

			let message;
			if (textStatus === "timeout") {
				message = "Die Anfrage an die Overpass API hat zu lange gedauert. Bitte versuchen Sie es später erneut.";
			}
			else if (textStatus === "parsererror") {
				message = "Die Antwort der Overpass API konnte nicht gelesen werden. Bitte versuchen Sie es später erneut.";
			}
			else if (textStatus === "abort") {
				message = "Die Anfrage an die Overpass API wurde abgebrochen.";
			}
			else if (jqXHR.status === 400) {
				message = "Die Overpass API hat die Anfrage abgelehnt. Möglicherweise ist die Abfrage ungültig.";
			}
			else if (jqXHR.status === 403) {
				message = "Die Overpass API hat den Zugriff verweigert.";
			}
			else if (jqXHR.status === 404) {
				message = "Der Overpass API-Endpunkt wurde nicht gefunden.";
			}
			else if (jqXHR.status === 408 || jqXHR.status === 504) {
				message = "Die Overpass API hat die Anfrage wegen einer Zeitüberschreitung abgebrochen. Bitte versuchen Sie es später erneut.";
			}
			else if (jqXHR.status === 429) {
				message = "Zu viele Anfragen an die Overpass API. Bitte warten Sie kurz und versuchen Sie es erneut.";
			}
			else if (jqXHR.status >= 500) {
				message = "Die Overpass API ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.";
			}
			else if (jqXHR.status === 0) {
				message = "Die Overpass API ist nicht erreichbar. Prüfen Sie Ihre Internetverbindung und ob der Browser die Anfrage blockiert (CORS).";
			}
			else {
				message = "Beim Abrufen der Daten von der Overpass API ist ein unerwarteter Fehler aufgetreten (" + textStatus + ").";
			}

			alert(message);
		}).always(function () {
			overpassRequests = overpassRequests.filter(function (activeRequest) {
				return activeRequest !== request;
			});
			if (overpassRequests.length === 0) {
				map.spin(false);
			}
		});
	}

	/**
	 * The method is currently (June 2025) called twice: when the card is
	 * generated (buildMap()) and when the card is moved in any way (moveEnd()).
	 * The method empties the ATM layers, retrieves the ATMs of the current
	 * display area and fills the layers again with these current ATMs.
	 */
	let loadPois = function () {

		if (dataSource === ATMMAP.SOURCE_OVERPASS && map.getZoom() >= 14) {
			let mapBounds = map.getBounds();
			let query_necessary = ATMMAP.test_query_necessary(mapBounds, ATMMAP.query_bound);

			if (query_necessary) {

				ATMMAP.updateQueryBound(mapBounds);

				// note: g in /{{bbox}}/g means replace all occurrences of {{bbox}} not just first occurrence
				let overpassCall = ovpCall.replace(/{{bbox}}/g, utils.latLongToString(mapBounds));

				callOverpassApi(overpassCall);
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
