"use strict"
/**
 * @author Marcus Bleil
 * 
 */

// eslint settings
/*global L, $*/

let UTILS = {};

(function () {

	let buildAtmIcon = function (iconPic) {
		return L.icon({
			iconUrl: iconPic,
			iconSize: [32, 37],
			iconAnchor: [15, 37],
			popupAnchor: [-3, -37],
			labelAnchor: [10, -18],
		});
	};

	UTILS.yesAtm = buildAtmIcon('bank_euro_atm_yes.png');
	UTILS.atm = buildAtmIcon('atm_euro_yes.png');
	UTILS.unknownAtm = buildAtmIcon('bank_euro_atm_unknow.png');
	UTILS.noAtm = buildAtmIcon('bank_icon_atm_no.png');

	/**
	 * Builds a bound string for passed LatLngBounds (https://leafletjs.com/reference.html#latlngbounds).
	 * @param {*} bounds 
	 * @returns lowerLat + "," + lowerLng + "," + upperLat + "," + upperLng
	 */
	UTILS.latLongToString = function (bounds) {

		/* The coordinate order is (lower lat, lower lon, upper lat, upper lon) */
		let result;
		let lowerLat, lowerLng, upperLat, upperLng;

		lowerLat = bounds.getSouthWest().lat;
		lowerLng = bounds.getSouthWest().lng;
		upperLat = bounds.getNorthEast().lat;
		upperLng = bounds.getNorthEast().lng;

		result = lowerLat + "," + lowerLng + "," + upperLat + "," + upperLng;

		return result;
	};

	UTILS.createDescriptionFromeTags = function (node) {

		let description = '<p class="bank_name">???</p>';

		// atm usually not in bank
		if (node.tags["atm:operator"]) {

			description = '<p class="bank_name">';
			description += node.tags["atm:operator"];

			if (node.tags.name) {
				description += '<br><span class="bank_subname">(';
				description += node.tags.name + ')</span></p>';
			}
			else {
				description += '</p>';
			}
		}
		// usually a bank or an single atm
		else if (node.tags.name) {
			description = '<p class="bank_name">';
			description += node.tags.name + '</p>';
		}
		// "operator" often used instead of "name"
		else if (node.tags.operator) {
			description = '<p class="bank_name">';
			description += node.tags.operator + '</p>';
		}
		else if (node.tags.network) {
			description = '<p class="bank_name">';
			description += node.tags.network + '</p>';
		}

		if (node.tags.opening_hours) {
			description += '<p class="opening_hour">';
			description += node.tags.opening_hours + '</p>';
		}
		else {
			description += '<p class="opening_hour">';
			description += 'keine Öffnungszeiten angegeben</p>';
		}

		return description;
	};

	UTILS.addLegendTo = function (map) {

		let legend = L.control({
			position: 'topright',
			collapsed: true
		});

		legend.onAdd = function (map) {

			let div = L.DomUtil.create('div', 'legend');
			let table = '';

			table += '<p id="legend_but" style="cursor: pointer">Legende (+/-):</p>';
			table += '<div id="legend_table">';
			table += '<table>';
			table += '<tr>';
			table += '<td>';
			table += 'Geldautomat:';
			table += '</td>';
			table += '<td>';
			table += '<img src="atm_euro_yes.png" />';
			table += '</td>';
			table += '</tr>';

			table += '<tr>';
			table += '<td>';
			table += 'Bank mit Geldautomat:';
			table += '</td>';
			table += '<td>';
			table += '<img src="bank_euro_atm_yes.png" />';
			table += '</td>';
			table += '</tr>';

			table += '<tr>';
			table += '<td>';
			table += 'Bank mit unbekannten<br />Geldautomaten-Status:';
			table += '</td>';
			table += '<td>';
			table += '<img src="bank_euro_atm_unknow.png" />';
			table += '</td>';
			table += '</tr>';

			table += '<tr>';
			table += '<td>';
			table += 'Bank ohne Geldautomat:';
			table += '</td>';
			table += '<td>';
			table += '<img src="bank_icon_atm_no.png" />';
			table += '</td>';
			table += '</tr>';
			table += '</table>';
			table += '<p><a href="https://github.com/momolinus/atm-map">';
			table += 'Sourcecode der Karte</a>, Version 2.0.0 RC4 (16.12.17)</p>';
			table += '<p style="text-align: center;"><a href="impressum.html">Impressum</a></p>';
			table += '</div>';

			div.innerHTML += table;

			return div;
		};

		legend.addTo(map);

		$('#legend_but').on('click', function () {
			$('#legend_table').toggle();
		});

		$('#legend_table').toggle();
	};
})();
