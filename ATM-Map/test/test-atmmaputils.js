import { utils } from "../atmmaputils.js";

QUnit.test("Test of utils.latLongToString", function (assert) {
	let corner1 = L.latLng(50, 13);
	let corner2 = L.latLng(50.7, 13.5);
	let bounds = L.latLngBounds(corner1, corner2);

	let boundsAsString = utils.latLongToString(bounds);

	assert.equal(boundsAsString, "50,13,50.7,13.5");

	let boundsSwap = L.latLngBounds(corner2, corner1);
	let boundsAsStringSwap = utils.latLongToString(boundsSwap);

	assert.equal(boundsAsStringSwap, "50,13,50.7,13.5");
});

QUnit.test("Inspection of LatLngBounds", function(assert) {
	/*
	 *   |---------------13.5/50.7
	 *   |                   |
	 *   |                   |
	 *   13/50---------------|
	 */

	let corner1 = L.latLng(50, 13);
	let corner2 = L.latLng(50.7, 13.5);
	let bounds = L.latLngBounds(corner1, corner2);

	assert.equal(bounds.getWest(), 13);
	assert.equal(bounds.getNorth(), 50.7);
})
QUnit.test("Opening hours are shown as a weekly table", function (assert) {
	// Wednesday 2026-10-21
	let html = utils.openingHoursToTable("Mo-Fr 08:00-18:00", new Date(2026, 9, 21, 12, 0));
	assert.ok(html.indexOf("<th>Montag</th><td>08:00 - 18:00 Uhr</td>") >= 0);
	assert.ok(html.indexOf('<tr class="today"><th>Mittwoch</th>') >= 0);
	assert.ok(html.indexOf("<th>Sonntag</th><td>geschlossen</td>") >= 0);
});
QUnit.test("Invalid opening hours fall back to the raw text", function (assert) {
	assert.equal(utils.openingHoursToTable("das ist kein Wert"), null);
	let html = utils.createDescriptionFromeTags({ tags: { name: "X", opening_hours: "das ist kein Wert" } });
	assert.ok(html.indexOf("das ist kein Wert") >= 0);
});
QUnit.test("Popup text escapes HTML from OSM tags", function (assert) {
	let html = utils.createDescriptionFromeTags({
		tags: { name: '<img src=x onerror=alert(1)>', opening_hours: 'Mo "9" & Di' }
	});
	assert.equal(html.indexOf("<img"), -1);
	assert.ok(html.indexOf("&lt;img src=x onerror=alert(1)&gt;") >= 0);
	assert.ok(html.indexOf("Mo &quot;9&quot; &amp; Di") >= 0);
});
