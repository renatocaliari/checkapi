var util = require('./util'),
    _ = require('./underscore-min.js'),
    configHelper = require('./config');

function getDynamicValue(value) {
    var idx, fn, args;
    if (/^\$/.test(value)) {
        idx = value.indexOf('(');
        fn = value.slice(1, idx);
        args = value.slice(idx + 1, value.indexOf(')'));
        try {
            return configHelper[fn](args);
        } catch(error) {
            throw new Error('Function ' + fn + ' set in config was not found.');
        }
    } else {
        return value;
    }
}

function buildScenario(statusHttp) {
    return {
        statusHttp: statusHttp,
        params: []
    };
}

function getFieldsFromResource(config, resource) {
    var index, params, newField;

    resource = util.deepCopy(resource);
    params = resource.params;
    for (index = params.length; index--;) {
        if (!params[index].scenario) {
            params[index] = _.filter(config.paramsDefault, function(paramDefault) {
                if (paramDefault.name === params[index].name) {
                    return paramDefault;
                }
            })[0];
        }
    }

    return params;
}

function orderFields(fields) {
    fields = util.deepCopy(fields);
    var sortedFields = _.sortBy(fields, function(prop) {
        if (prop.scenario && prop.scenario) {
            return -prop.scenario.length;
        }
    });

    return sortedFields;
}

function setupVariation(forceClearCache){
    var cacheField = {};
    var cacheFieldShifted = {};

    function next(field){
        var variation, 
            fieldName = field.name,
            scenario;

        //cacheFieldShifted[fieldName] = cacheFieldShifted[fieldName] || util.deepCopy(field);
        cacheField[fieldName] = cacheField[fieldName] || util.deepCopy(field);

        scenario =  cacheField[fieldName].scenario;
        if (!scenario || _.isEmpty(scenario)) {
    
            scenario = util.deepCopy(field.scenario);
                if (!scenario) {
                return undefined;
            };
        }

        variation =  scenario.shift();
        return variation;
    };

    return next;
};

function generateScenario(config, resource) {
    var fields1, fields2, nextVariation = undefined, scenarios = [], 
        variation, otherVariation, scenario, params; 

        fields1 = orderFields(getFieldsFromResource(config, resource)); 
        fields2 = util.deepCopy(fields1);
        nextVariation = setupVariation();

        _.map(fields1, function(field1) {
            _.each(field1.scenario, function(variation) {
                scenario = buildScenario(variation.statusHttp);
                params = _.toArray(_.map(fields2,
                    function(field) {
                        otherVariation = nextVariation(field);
                        return {name: field.name, value: getDynamicValue(otherVariation.value)};
                    }
                ));
                scenario.params.push(params);
                scenarios.push(util.deepCopy(scenario));
            });
        });

        return scenarios;
}

module.exports = (function(config) {
    function getParamsInUrl(resource) {
        var group, paramsInUrl = [], patternCurlyBracket = /{(.*?)}/gi;

        while ((group = patternCurlyBracket.exec(resource.url)) !== null) {
            paramsInUrl.push(group[1]);
        }
        return paramsInUrl;
    }

    function getParamsUrlInResource(resource, paramsInUrl) {
        var params = util.deepCopy(resource.params);
        var indexParam;
        for (indexParam = paramsInUrl.length; indexParam--;) {
            params.push({name: paramsInUrl[indexParam]});
        }
        return params;
    };

    function setValueParamsToUrl(resource) {
        var resource = util.deepCopy(resource),
            urlSet = resource.url,
            indexParam,
            paramsInUrl = getParamsInUrl(resource),
            groups,
            randomContext,
            group;

        resource.params = getParamsUrlInResource(resource, paramsInUrl);
        for (indexParam = paramsInUrl.length; indexParam--;) {
            randomContext = random(resource, paramsInUrl[indexParam]);
            if (randomContext) {
                urlSet = urlSet.replace("{" + paramsInUrl[indexParam] + "}", randomContext);
            }
        }
        return urlSet;
    }

    function insertDetailsFrom(resource) {
        function To(scenarios) {
            var index, prop, scenario;
            for (index = util.size(scenarios); index--;) {
                scenario = scenarios[index];
                for (prop in resource) {
                    if (resource.hasOwnProperty(prop)) {
                        if (prop !== 'params') {
                            scenario[prop] = resource[prop];
                        }
                    }
                }
            }

            return scenarios;
        }
        return {
            To: To
        };
    }

    function scenariosToUrl(url, forceParams) {
        var scenarios, key,
            configResource = configToResource(url);

        if (configResource)
        {
            scenarios = scenariosToResource(configResource);
            insertDetailsFrom(configResource).To(scenarios);
            if (util.isObject(forceParams)) {
                for (key in forceParams) {
                    util.replaceProperty(scenarios, key, forceParams[key]);
                }
            } else if (forceParams){
                throw new TypeError('params should be an object');
            }
        } else {
            throw new Error('Resource to ' + url + ' not found in config');
        }

        return scenarios;
    }

    /***************************************************************
    Example of call:
    ****************************************************************
        scenarios(['content', 'rating'], ['positive']);
    ****************************************************************
    Example of result:
    ****************************************************************
        scenarios:
        [{
            values: [ 'rating': '1', 'content': 'abc' ],
            statusHttp: 200
        }];
    ****************************************************************/
    function scenariosToResource(resource) {
        var scenarios = scenarios.concat(generateScenario(config, resource));
        return scenarios;
    }

    function configToResource(url) {
        var indexResource,
            resource,
            urls;

        for (indexResource = config.resources.length; indexResource--;) {
            resource = util.deepCopy(config.resources[indexResource]);
            if (util.match(resource.url, url)) {
                setValueParamsToUrl(resource);
                return resource;
            }
        }

        return undefined;
    }

    function getRandomIn(arrObject) {
        var fn,
            lenght = util.size(arrObject),
            randomIndex = Math.floor((Math.random() * lenght)),
            value = arrObject[randomIndex].value;

        // TODO: get only values from scenarios with expected result 200 (positive scenarios)

        return getDynamicValue(value) || value;
    }

    function random(resource, field) {
        var params = getFieldsFromResource(config, resource),
            configField =  _.filter(params, function(prop) {
                if (prop.name === field) {
                    return prop;
                }
            });
        if (configField && !_.isEmpty(configField)) {
            return getRandomIn(configField[0].scenario);
        } else {
            return null;
        }
    }

    return {
        insertDetailsFrom: insertDetailsFrom,
        setValueParamsToUrl: setValueParamsToUrl,
        configToResource: configToResource,
        scenariosToUrl: scenariosToUrl,
        scenariosToResource: scenariosToResource,
        random: random
    };
});
