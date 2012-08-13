var scenarioVows = require('../../lib/helper/scenarioVows'),
    vows = require('vows'),
    assert = require('assert'),
    config = require('../../test/api/configApiExample');

vows.describe('API').addBatch({
        'A call to resource': {
            '/places/{placeId}/photos/new': scenarioVows.testCase('/places/{placeId}/photos/new'),
            '/search/places/byaddress': scenarioVows.testCase('/search/places/byaddress')
        }
}).export(module);
