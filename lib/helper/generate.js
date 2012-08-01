var util = require('./util'),
    _ = require('./underscore-min.js'),
    configHelper = require('./config'),
    that = this,
    config;

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

function getFieldsFromResource(resource) {
    var index, params, newField;

    resource = util.deepCopy(resource);
    params = resource.params;
    for (index = params.length; index--;) {
        if (!params[index].scenario) {
            params[index] = _.filter(that.config.paramsDefault, function(paramDefault) {
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
    var lastScenario = {};

    function next(field, status){
        var variation, 
            fieldName = field.name;

        status = status || "200";

        variation = _.find(field.scenario, function(scenario){
            return (scenario.statusHttp === status) 
                && (!lastScenario[fieldName]
                || (scenario.value !== lastScenario[fieldName].value));
        });

        variation = variation || lastScenario[fieldName];

        lastScenario[fieldName] = variation;
        return variation;
    };

    return next;
};

function getScenarioWithStatus(status, scenarios) {
    return _.filter(scenarios, function(scenario) {
        return scenario.statusHttp === status;
    });
}

function getUniqueScenario(scenarios) {
    return _.uniq(scenarios, false, function(item, key, scenarios){
        return item.params[0].name && item.params[0].value;
    })
}

function generateScenario(resource) {
    var fields1, fields2, nextVariation = undefined, scenarios = [], 
        variation, otherVariation, scenario, params; 

        fields1 = orderFields(getFieldsFromResource(resource)); 
        
        nextVariation = setupVariation();
        _.map(fields1, function(field1) {
            fields2 = _.filter(util.deepCopy(fields1), function(field) {
                return field.name !== field1.name;
            });

            _.each(field1.scenario, function(variation) {
                scenario = buildScenario(variation.statusHttp);
                otherVariation = nextVariation(field1, variation.statusHttp);
                scenario.params.push({name: field1.name, value: getDynamicValue(otherVariation.value)});
                _.map(fields2,
                    function(field) {
                        otherVariation = nextVariation(field, "200");
                        scenario.params.push({name: field.name, value: getDynamicValue(otherVariation.value)});
                    }
                );
                //scenario.params.push(params);
                scenarios.push(util.deepCopy(scenario));
            });
        });
        scenarios = getUniqueScenario(scenarios);
        return scenarios;
}

module.exports = (function(config) {
    that.config = util.deepCopy(config);
    function getParamsInUrl(resource) {
        var group, paramsInUrl = [], patternCurlyBracket = /{(.*?)}/gi;

        while ((group = patternCurlyBracket.exec(resource.url)) !== null) {
            paramsInUrl.push(group[1]);
        }
        return paramsInUrl;
    }

    function setParamsUrlInResource(resource, paramsInUrl) {
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

        resource.params = setParamsUrlInResource(resource, paramsInUrl);
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
            resource = getResource(url);

        if (resource)
        {
            scenarios = generateScenario(resource);
            insertDetailsFrom(resource).To(scenarios);
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

    function getResource(url) {
        var resource, resourceToUrl = _.filter(config.resources, function(resource) {
            return (util.match(resource.url, url));
        });
        resource = util.deepCopy(resourceToUrl[0]);
        resource.url = setValueParamsToUrl(resource)
        return resource;
    }

    function getRandomIn(scenarios) {
        var fn,
            valuesStatus200 = getScenarioWithStatus("200", scenarios),
            lenght = util.size(valuesStatus200),
            randomIndex = Math.floor((Math.random() * lenght)),
            value = valuesStatus200[randomIndex].value;
        return getDynamicValue(value) || value;
    }

    function random(resource, field) {
        var params = getFieldsFromResource(resource),
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
        getResource: getResource,
        scenariosToUrl: scenariosToUrl,
        random: random
    };
});
