scenariosVows.config(''); // Set the config file that contains the data to generate the scenarios

vows.describe('API').addBatch(
{
	'Call resource of': {	 
	   'new review': scenarioVows.testCase('/places/{placeId}/reviews/new');
	}
}
