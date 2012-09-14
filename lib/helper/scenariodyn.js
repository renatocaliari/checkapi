var Client = require('../client/client'),
    rest = require('restler'),
    OAuth = require('oauth').OAuth,
    Logger = require('bunyan'),
    Generate = require('./generate'),
    assert = require('assert'),
    util = require('./util'),
    Generate = require('./generate'),
    args = process.argv,
    config = require(args[0]),
    api;

scenariosVows.config(args[1]);

var log = new Logger({
    name: 'API',
    src: true,
    streams: [
        {
            path: 'apiDebug.log',
            level: 'debug'
        },
        {
            path: 'apiError.log',
            level: 'error'
        }
    ]
});

api = new Client({
    restler: rest,
    OAuth: OAuth,
    Logger: log
}, config);


var config = require(configPathFileName),
runner = require(runnerPathFileName),
inspect = util.inspect;

testCases = createTestCases(config);
runTestCases(testCases);

function contextFunction(data, response, error, scenario) {
    if (!response && error) {
	throw new Error(inspect(error));
    } else {
	if (error && (config.api.showScenarioOnError === "true")) {
            assert.equal(response.statusCode, scenario.statusHttp, 
			 'got status ' + response.statusCode + '.\n\tDetail: ' + inspect(error) +
			 '.\n\tScenario: ' + inspect(scenario));
	} else {
            assert.equal(response.statusCode, scenario.statusHttp, 
			 'got status ' + response.statusCode);
	}
    }
}

function setContext(context, scenario) {
    for (index = 0; index <= util.size(scenarios); index++) {
        scenario = scenarios[index];
        if (!scenario) {
	    break;
        }
        alias = "[" + (index + 1) + "]";
        context[alias] = {};
        context[alias]['topic'] = scenarios[index];
        context[alias]['...'] = {};
        context[alias]['...']['topic'] =  function (scenario) {
	    api.send(scenario, this.callback);
        };
        context[alias]['...']['should return status '.concat(scenario.statusHttp)] = contextFunction;
    }

    return context;
}

function runTestCases(testCases) {
    _.each(testCases, function(testCase) {
	var scenario,
        index,
        generate = new Generate(config),
        context = {},
        scenarios;
	
	scenarios = generate.scenariosToUrl(resource);
	context['topic'] = scenarios;

	if (!scenarios) {
            throw new Error('There is no scenario to generate');
	}

        setContext(testCase.name, context, scenario);
    });
}
