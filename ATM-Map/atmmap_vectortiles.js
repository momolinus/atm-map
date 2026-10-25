"use strict"
/**
 * ATM data from the vector tiles of obstbaumkarte.de: ATMs, banks and shops with cash withdrawal.
 */

// eslint settings
/*global L */

import { utils } from "./atmmaputils.js";
import { layerBuilder } from "./atmmap_layerbuilder.js";
import { MIN_ZOOM } from "./atmmap_config.js";

export const vectorTiles = {};

	// Separate layers allow shops with cash withdrawal to be shown or hidden independently.
	let atmUrl = "https://sbtiles.obstbaumkarte.de/table.public.alle_geldautomaten.geom/{z}/{x}/{y}.pbf";
	let atmLayerName = "table.public.alle_geldautomaten.geom";
	let cashWithdrawalUrl = "https://sbtiles.obstbaumkarte.de/table.public.alle_cash_withdrawal.geom/{z}/{x}/{y}.pbf";
	let cashWithdrawalLayerName = "table.public.alle_cash_withdrawal.geom";

	let map = null;
	let active = false;
	let atmLayer = null;
	let cashWithdrawalLayer = null;
	let cashWithdrawalEnabled = true;
	let errorShown = false;

	/**
	 * Connects the module to the map and to the controls, must be called once.
	 */
	vectorTiles.init = function (mapToUse) {
		map = mapToUse;
		// Recompute the ATM styling when a bank category changes.
		layerBuilder.onCategoriesChanged(function () {
			if (atmLayer) {
				atmLayer.redraw();
			}
		});
		initCashWithdrawalToggle();
	};

	vectorTiles.activate = function () {
		active = true;
		errorShown = false;
		addLayers();
	};

	vectorTiles.deactivate = function () {
		active = false;
		removeLayers();
	};

	/**
	 * Layers exist only from MIN_ZOOM on, so they are added or removed when the zoom level crosses the limit.
	 */
	vectorTiles.syncZoom = function () {
		if (!active) {
			return;
		}
		let zoomedIn = map.getZoom() >= MIN_ZOOM;
		if (zoomedIn !== (atmLayer !== null)) {
			removeLayers();
			addLayers();
		}
	};

	let getIcon = function (properties) {
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

	// radius > 10 keeps Leaflet 1.9 from reading the missing latlng of tile points on click
	let ICON_CLICK_RADIUS = 16;

	let getAtmStyle = function (properties) {
		let categoryIndices = layerBuilder.getCategoryIndexes({ properties: properties });
		let icon = getIcon(properties);
		let categoryEnabled = categoryIndices.some(function (categoryIndex) {
			return layerBuilder.isCategoryEnabled(categoryIndex);
		});

		// Without a style, unsupported features and features hidden by the user are not drawn.
		if (!icon || !categoryEnabled) {
			return [];
		}
		return { icon: icon, radius: ICON_CLICK_RADIUS };
	};
	vectorTiles.getVectorTileStyle = getAtmStyle;

	vectorTiles.getCashWithdrawalStyle = function () {
		return { icon: utils.cashWithdrawal, radius: ICON_CLICK_RADIUS };
	};

	let addLayers = function () {
		if (map.getZoom() >= MIN_ZOOM) {
			atmLayer = createAtmLayer();
			atmLayer.addTo(map);
			if (cashWithdrawalEnabled) {
				addCashWithdrawalLayer();
			}
		}
		updateCashWithdrawalToggle();
	};

	let removeLayers = function () {
		[atmLayer, cashWithdrawalLayer].forEach(function (layer) {
			if (layer) {
				map.removeLayer(layer);
			}
		});
		atmLayer = null;
		cashWithdrawalLayer = null;
		updateCashWithdrawalToggle();
	};

	let addCashWithdrawalLayer = function () {
		cashWithdrawalLayer = createCashWithdrawalLayer();
		cashWithdrawalLayer.addTo(map);
	};

	let initCashWithdrawalToggle = function () {
		let toggle = document.getElementById("cash_withdrawal_toggle");
		toggle.addEventListener("change", function () {
			cashWithdrawalEnabled = toggle.checked;
			// Remember the selection while this provider is not active.
			if (!active) {
				return;
			}
			if (cashWithdrawalLayer) {
				map.removeLayer(cashWithdrawalLayer);
				cashWithdrawalLayer = null;
			}
			if (cashWithdrawalEnabled && atmLayer) {
				addCashWithdrawalLayer();
			}
		});
	};

	let updateCashWithdrawalToggle = function () {
		let toggle = document.getElementById("cash_withdrawal_toggle");
		if (toggle) {
			toggle.disabled = !active;
		}
	};

	let showPopup = function (event, extraHtml) {
		if (!event.layer || !event.layer.properties) {
			console.error("Clicked vector tile feature has no properties.", event);
			return;
		}
		let content = utils.createDescriptionFromeTags({ tags: event.layer.properties }) +
			extraHtml;
		L.popup().setLatLng(event.latlng).setContent(content).openOn(map);
	};

	// The popup note of the cash withdrawal layer mentions a purchase requirement, if there is one.
	let createCashWithdrawalLayer = function () {
		let styles = {};
		styles[cashWithdrawalLayerName] = vectorTiles.getCashWithdrawalStyle;
		let tileLayer = L.vectorGrid.protobuf(cashWithdrawalUrl, {
			interactive: true,
			vectorTileLayerStyles: styles
		});

		tileLayer.on("click", function (event) {
			let properties = event.layer && event.layer.properties;
			let note = '<p class="cash_withdrawal_note">Bargeldauszahlung an der Kasse';
			if (properties && properties["cash_withdrawal:purchase_required"] === "yes") {
				note += ' (nur mit Einkauf)';
			}
			showPopup(event, note + '</p>');
		});

		return tileLayer;
	};

	let createAtmLayer = function () {
		let styles = {};
		styles[atmLayerName] = getAtmStyle;
		let tileLayer = L.vectorGrid.protobuf(atmUrl, {
			attribution: 'ATM-Daten &copy; OpenStreetMap-Mitwirkende, via <a href="https://obstbaumkarte.de/">obstbaumkarte.de</a>',
			interactive: true,
			vectorTileLayerStyles: styles
		});

		tileLayer.on("click", function (event) {
			showPopup(event, "");
		});
		tileLayer.on("tileerror", function (event) {
			console.error("ATM vector tile could not be loaded.", event);
			if (!errorShown) {
				errorShown = true;
				alert("Die ATM-Vektorkacheln konnten nicht geladen werden. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es später erneut.");
			}
		});

		return tileLayer;
	};
