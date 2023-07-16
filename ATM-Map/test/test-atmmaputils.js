// eslint settings
/*global QUnit*/

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