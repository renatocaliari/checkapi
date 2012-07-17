var scenarioVows = require('../../lib/helper/scenarioVows'),
    vows = require('vows'),
    assert = require('assert'),
    config = require('../../test/api/configApiExample');

vows.describe('API').addBatch(
    {
        'A call to resource': {
            '/places/{placeId}/reviews/new': {
                '[positive]': scenarioVows.testCase('/places/{placeId}/reviews/new', 'positive',
                    function(error, data, response, scenario) {
                        var dataJson = JSON.parse(data),
                        message = dataJson.message;

                        assert.include(data, 'REVIEW OK');
                    }
                ),
                 '[negative]': scenarioVows.testCase('/places/{placeId}/reviews/new', 'negative',
                    function(error, data, response, scenario) {
                        var dataJson = JSON.parse(data),
                        message = dataJson.message;

                        assert.include(data, 'REVIEW FAIL');
                    }
                )
            }  
        }
}).export(module);
