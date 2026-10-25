"use strict"
/**
 * @author Marcus Bleil
 *
 */

export const utils = {};

	// Shared Leaflet icons give both data sources the same look.
	let buildAtmIcon = function (iconPic) {
		return L.icon({
			iconUrl: iconPic,
			iconSize: [32, 37],
			iconAnchor: [15, 37],
			popupAnchor: [-3, -37],
			labelAnchor: [10, -18],
		});
	};

	utils.yesAtm = buildAtmIcon('bank_euro_atm_yes.png');
	utils.atm = buildAtmIcon('atm_euro_yes.png');
	utils.unknownAtm = buildAtmIcon('bank_euro_atm_unknow.png');
	utils.noAtm = buildAtmIcon('bank_icon_atm_no.png');
	// green supermarket icon: Nicolas Mollet, CC BY-SA 3.0, https://mapicons.mapsmarker.com
	utils.cashWithdrawal = buildAtmIcon('supermarket_cash_withdrawal.svg');

	/**
	 * Builds a bound string for passed LatLngBounds (https://leafletjs.com/reference.html#latlngbounds).
	 * @param {*} bounds
	 * @returns lowerLat + "," + lowerLng + "," + upperLat + "," + upperLng
	 */
	utils.latLongToString = function (bounds) {

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

	utils.escapeHtml = function (text) {
		return String(text)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	};

	const DAY_NAMES = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

	let formatTime = function (date, dayStart, dayEnd) {
		if (date.getTime() >= dayEnd.getTime()) {
			return "24:00";
		}
		return date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
	};

	/**
	 * Builds an HTML table with the opening hours of the current week (Monday to Sunday).
	 * @param {string} openingHours value of the OSM tag opening_hours
	 * @param {Date} [now] reference date, defaults to the current date
	 * @returns the HTML table or null if the value cannot be parsed (or opening_hours.js is not loaded)
	 */
	utils.openingHoursToTable = function (openingHours, now) {
		if (typeof opening_hours === "undefined") {
			return null;
		}

		try {
			let oh = new opening_hours(openingHours, { address: { country_code: "de" } });

			now = now || new Date();
			let monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
			let today = (now.getDay() + 6) % 7;
			let rows = "";

			for (let i = 0; i < 7; i++) {
				let dayStart = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
				let dayEnd = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i + 1);
				let times = [];

				oh.getOpenIntervals(dayStart, dayEnd).forEach(function (interval) {
					let from = interval[0];
					let to = interval[1];
					times.push(formatTime(from, dayStart, dayEnd) + " - " + formatTime(to, dayStart, dayEnd));
				});

				rows += '<tr' + (i === today ? ' class="today"' : '') + '><th>' + DAY_NAMES[i] + '</th><td>';
				rows += times.length ? times.join("<br>") + " Uhr" : "geschlossen";
				rows += '</td></tr>';
			}

			return '<table class="opening_hours_table">' + rows + '</table>';
		}
		catch (e) {
			return null;
		}
	};

	utils.createDescriptionFromeTags = function (node) {
		// OSM tag values are inserted into popup HTML, so they are escaped first.
		let escape = utils.escapeHtml;

		let description = '<p class="bank_name">???</p>';

		// atm usually not in bank
		if (node.tags["atm:operator"]) {

			description = '<p class="bank_name">';
			description += escape(node.tags["atm:operator"]);

			if (node.tags.name) {
				description += '<br><span class="bank_subname">(';
				description += escape(node.tags.name) + ')</span></p>';
			}
			else {
				description += '</p>';
			}
		}
		// usually a bank or an single atm
		else if (node.tags.name) {
			description = '<p class="bank_name">';
			description += escape(node.tags.name) + '</p>';
		}
		// "operator" often used instead of "name"
		else if (node.tags.operator) {
			description = '<p class="bank_name">';
			description += escape(node.tags.operator) + '</p>';
		}
		else if (node.tags.network) {
			description = '<p class="bank_name">';
			description += escape(node.tags.network) + '</p>';
		}

		if (node.tags.opening_hours) {
			let table = utils.openingHoursToTable(node.tags.opening_hours);
			if (table) {
				description += table;
			}
			else {
				description += '<p class="opening_hour">';
				description += escape(node.tags.opening_hours) + '</p>';
			}
		}
		else {
			description += '<p class="opening_hour">';
			description += 'keine Öffnungszeiten angegeben</p>';
		}

		return description;
	};

	utils.addLegendTo = function (map) {

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
			table += '<tr>';
			table += '<td>';
			table += 'Supermarkt mit<br />Bargeldauszahlung:';
			table += '</td>';
			table += '<td>';
			table += '<img src="supermarket_cash_withdrawal.svg" width="32" height="37" />';
			table += '</td>';
			table += '</tr>';
			table += '</table>';
			table += '<p class="icon_credit">Supermarkt-Icon: Nicolas Mollet, <a href="https://mapicons.mapsmarker.com">Map Icons Collection</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a></p>';
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
