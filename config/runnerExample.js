scenariosVows.config('path/to/file'); // Set the config file that contains the data to scenarios generation

vows.describe('API').addBatch({
    'Call resource of': {	 
	'new review': scenarioVows.testCase('/places/{placeId}/reviews/new');
    }
}
