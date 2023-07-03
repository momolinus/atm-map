// eslint settings
/*global QUnit, ATMMAP, L*/

QUnit.test("Test Query-Optimizer", function (assert) {
    let query_necessary;

    let first_query = L.bounds(L.point(5, 5), L.point(10, 10));
    let smaller_query = L.bounds(L.point(6, 6), L.point(9, 9));

    query_necessary = ATMMAP.test_query_necessary(first_query);
    assert.ok(query_necessary);

    query_necessary = ATMMAP.test_query_necessary(smaller_query, first_query);
    assert.notOk(query_necessary)
});

QUnit.test("test of ATMMAP.updateQueryBound with smaller areas", function (assert) {
    let bound1 = L.bounds(L.point(5, 4), L.point(7, 8));
    ATMMAP.updateQueryBound(bound1);
    assert.equal(ATMMAP.query_bound.getTopLeft().x, 5);
    assert.equal(ATMMAP.query_bound.getTopLeft().y, 4);
    assert.equal(ATMMAP.query_bound.getBottomRight().x, 7);
    assert.equal(ATMMAP.query_bound.getBottomRight().y, 8);

    let bound2 = L.bounds(L.point(6, 5), L.point(6, 7));
    ATMMAP.updateQueryBound(bound2);
    assert.equal(ATMMAP.query_bound.getTopLeft().x, 5);
    assert.equal(ATMMAP.query_bound.getTopLeft().y, 4);
    assert.equal(ATMMAP.query_bound.getBottomRight().x, 7);
    assert.equal(ATMMAP.query_bound.getBottomRight().y, 8);

    let bound3 = L.bounds(L.point(7, 5.5), L.point(6, 6));
    ATMMAP.updateQueryBound(bound3);
    assert.equal(ATMMAP.query_bound.getTopLeft().x, 5);
    assert.equal(ATMMAP.query_bound.getTopLeft().y, 4);
    assert.equal(ATMMAP.query_bound.getBottomRight().x, 7);
    assert.equal(ATMMAP.query_bound.getBottomRight().y, 8);
});

QUnit.test("test of ATMMAP.test_query_necessary", function (assert) {
    let query_necessary;

    let first_query = L.bounds(L.point(5, 5), L.point(10, 10));
    let query = L.bounds(L.point(5, 5), L.point(10, 10));
    let smaller_query = L.bounds(L.point(6, 6), L.point(9, 11));

    query_necessary = ATMMAP.test_query_necessary(first_query);
    assert.ok(query_necessary);

    query_necessary = ATMMAP.test_query_necessary(smaller_query, first_query);
    assert.ok(query_necessary);
    query.extend(smaller_query);

    query_necessary = ATMMAP.test_query_necessary(smaller_query, query);
    assert.notOk(query_necessary);
    query_necessary = ATMMAP.test_query_necessary(first_query, query);
    assert.notOk(query_necessary);
});