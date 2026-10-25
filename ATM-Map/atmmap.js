/**
 * @author Marcus Bleil
 *
 * Core of the ATM map: map, sidebar and switching between the data sources
 * (see atmmap_vectortiles.js and atmmap_overpass.js).
 */

// eslint settings
/*global L */

import { layerBuilder } from "./atmmap_layerbuilder.js";
import { vectorTiles } from "./atmmap_vectortiles.js";
import { overpass } from "./atmmap_overpass.js";
import { SOURCE_OVERPASS, SOURCE_VECTOR_TILES, MIN_ZOOM } from "./atmmap_config.js";

export const atmMap = {};
// Expose the public configuration through the main map module as well.
atmMap.SOURCE_OVERPASS = SOURCE_OVERPASS;
atmMap.SOURCE_VECTOR_TILES = SOURCE_VECTOR_TILES;
atmMap.MIN_ZOOM = MIN_ZOOM;

let dataSource = SOURCE_VECTOR_TILES;
let map = null;

const sourceModules = {
	[SOURCE_OVERPASS]: overpass,
	[SOURCE_VECTOR_TILES]: vectorTiles
};

// Initialize the shared controls and both providers before activating the selected source.
atmMap.initMap = function () {

	map = buildMap();

	let osmGeocoder = buildOsmGeocoderAndAddToMap(map);

	L.control.locate({ strings: { title: "Gehe zum meinem Standort!" } }).addTo(map);

	L.control.sidebar('sidebar', { position: 'right' }).addTo(map);

	layerBuilder.buildLayers(map);

	overpass.init(map);
	vectorTiles.init(map);

	addSearchToSidebar(osmGeocoder);
	addDataSourceControl();

	sourceModules[dataSource].activate();
};

atmMap.getDataSource = function () {
	return dataSource;
};

atmMap.setDataSource = function (source) {
	if (!(source in sourceModules)) {
		throw new Error("Unknown ATM data source: " + source);
	}
	if (source === dataSource) {
		return;
	}
	if (!map) {
		throw new Error("The map must be initialized before changing the data source.");
	}

	// Deactivate first so the previous provider can remove its layers and cancel pending requests.
	sourceModules[dataSource].deactivate();
	layerBuilder.clearLayers();
	dataSource = source;
	sourceModules[dataSource].activate();
};

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
		// Overpass returns data for the visible map area; vector tiles reload themselves.
		if (dataSource === SOURCE_OVERPASS) {
			overpass.loadPois();
		}
	});
	// The vector tile provider adds or removes its layers when the minimum zoom level is crossed.
	map.on('zoomend', vectorTiles.syncZoom);

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
				atmMap.setDataSource(input.value);
			}
		});
	});
};
