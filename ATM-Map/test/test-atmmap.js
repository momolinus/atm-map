// eslint settings
/*global QUnit, ATMMAP, turf*/

QUnit.test("Test Query-Optimizer", function (assert) {
    let query_necessary;


    /* 
    North: 5, South: 0, West: 5, East: 10
    order: NW, NE, SE, SW, closing
    */
    let first_query = turf.polygon([[[5, 5], [5, 10],
    [0, 10], [0, 5], [5, 5]]], { name: 'first_query' });
    let smaller_query = turf.polygon([[[4, 6], [4, 9],
    [1, 9], [1, 6], [4, 6]]], { name: 'smaller_query' });

    query_necessary = ATMMAP.test_query_necessary(first_query);
    assert.ok(query_necessary);
    query_necessary = ATMMAP.test_query_necessary(smaller_query);
    assert.notOk(query_necessary)
});