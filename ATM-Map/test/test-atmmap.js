QUnit.test("Test Query-Optimizer", function (assert) {
    let query_necessary;

    query_necessary = ATMMAP.test_query_necessary();
    assert.ok(query_necessary);
});