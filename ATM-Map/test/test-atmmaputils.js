// eslint settings
/*global QUnit*/

import { UTILS } from "../atmmaputils.js";

QUnit.test("Test of UTILS.latLongToString", function (assert) {
    let corner1 = L.latLng(50, 13);
    let corner2 = L.latLng(50.7, 13.5);
    let bounds = L.latLngBounds(corner1, corner2);

    let boundsAsString = UTILS.latLongToString(bounds);

    assert.equal(boundsAsString, "50,13,50.7,13.5");

    let boundsSwap = L.latLngBounds(corner2, corner1);
    let boundsAsStringSwap = UTILS.latLongToString(boundsSwap);

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
QUnit.test("Popup text escapes HTML from OSM tags", function (assert) {
	let html = UTILS.createDescriptionFromeTags({
		tags: { name: '<img src=x onerror=alert(1)>', opening_hours: 'Mo "9" & Di' }
	});
	assert.equal(html.indexOf("<img"), -1);
	assert.ok(html.indexOf("&lt;img src=x onerror=alert(1)&gt;") >= 0);
	assert.ok(html.indexOf("Mo &quot;9&quot; &amp; Di") >= 0);
});
