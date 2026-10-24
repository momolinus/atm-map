"use strict"
/**
 * @author Marcus Bleil
 *
 * Core of the ATM map: map, sidebar and switching between the data sources
 * (see atmmap_vectortiles.js and atmmap_overpass.js).
 */

// eslint settings
/*global L, UTILS, LAYER_BUILDER */

// constructs the module ATMMAP
let ATMMAP = {};
ATMMAP.SOURCE_OVERPASS = "overpass";
ATMMAP.SOURCE_VECTOR_TILES = "vector-tiles";
// from this zoom level on ATMs are shown, for Overpass and for vector tiles
ATMMAP.MIN_ZOOM = 14;

(function () {
	// see atmmap_layerbuilder.js
	let layerBuilder = LAYER_BUILDER;
	let dataSource = ATMMAP.SOURCE_VECTOR_TILES;
	let map = null;

	let sourceModules = function () {
		let modules = {};
		modules[ATMMAP.SOURCE_OVERPASS] = ATMMAP.overpass;
		modules[ATMMAP.SOURCE_VECTOR_TILES] = ATMMAP.vectorTiles;
		return modules;
	};

	ATMMAP.initMap = function () {

		map = buildMap();

		let osmGeocoder = buildOsmGeocoderAndAddToMap(map);

		L.control.locate({ strings: { title: "Gehe zum meinem Standort!" } }).addTo(map);

		L.control.sidebar('sidebar', { position: 'right' }).addTo(map);

		layerBuilder.buildLayers(map);

		ATMMAP.overpass.init(map);
		ATMMAP.vectorTiles.init(map);

		addSearchToSidebar(osmGeocoder);
		addDataSourceControl();

		sourceModules()[dataSource].activate();
	};

	ATMMAP.getDataSource = function () {
		return dataSource;
	};

	ATMMAP.setDataSource = function (source) {
		let modules = sourceModules();
		if (!(source in modules)) {
			throw new Error("Unknown ATM data source: " + source);
		}
		if (source === dataSource) {
			return;
		}
		if (!map) {
			throw new Error("The map must be initialized before changing the data source.");
		}

		modules[dataSource].deactivate();
		layerBuilder.clearLayers();
		dataSource = source;
		modules[dataSource].activate();
	};

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
		map.on('moveend', function () {
			if (dataSource === ATMMAP.SOURCE_OVERPASS) {
				ATMMAP.overpass.loadPois();
			}
		});
		map.on('zoomend', ATMMAP.vectorTiles.syncZoom);

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
})();
