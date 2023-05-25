QUnit.test("Test Query-Optimizer", function (assert) {
    let query_necessary;


    /* 
    North: 5, South: 0, West: 5, East: 10
    order: NW, NE, SE, SW, closing
    */
    let first_query = turf.polygon([[[5, 5], [5, 10],
    [0, 10], [0, 5], [5, 5]]], { name: 'first_query' });
    let smaller_query = turf.polygon([[[4, 6], [4, 9],
    [1, 9], [1, 6], [4, 6]]], { name: 'first_query' });

    query_necessary = ATMMAP.test_query_necessary(null, smaller_query);
    assert.ok(query_necessary);
});