var vows = require('vows'),
    assert = require('assert'),
    scenariodyn = require('scenariodyn');

testCase = scenariodyn.config("/config/configApiV1")

vows.describe('API').addBatch(
{
    'A call to resource': {
        '/places/{placeId}/reviews/new': testCase('/places/{placeId}/reviews/new')
    }
}).export(module);
