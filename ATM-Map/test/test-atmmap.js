// eslint settings
/*global QUnit, ATMMAP, L*/

QUnit.test("Test Query-Optimizer", function (assert) {
    let query_necessary;


    /* 
    North: 5, South: 0, West: 5, East: 10
    order: NW, NE, SE, SW, closing
    */
    let first_query = L.bounds(L.point(5, 5), L.point(10, 10))
    let smaller_query = L.bounds(L.point(6, 6), L.point(9, 9))

    query_necessary = ATMMAP.test_query_necessary(first_query);
    assert.ok(query_necessary);

    query_necessary = ATMMAP.test_query_necessary(smaller_query, first_query);
    assert.notOk(query_necessary)
});