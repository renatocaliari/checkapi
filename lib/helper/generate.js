var util = require('./util'),
    _ = require('./underscore-min.js'),
    configHelper = require('./config');

var allTypesScenarios = ['positive', 'negative'];

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

function buildScenario(statusHttp, fieldName, fieldValue, message) {
    return {
        statusHttp: statusHttp,
        params: [{name: fieldName, value: fieldValue}],
        message: message
    };
}

function getFieldsFromResource(config, resource, field) {
    var index, params, newField;

    params = util.deepCopy(resource.params);
    if (field) {
        newField = _.filter(config.paramsDefault, function(paramDefault) {
                if (paramDefault.name === field) {
                    return paramDefault;
                }
            });
        if (newField[0]) {
            params.push(newField[0]);
        }
    }
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

function orderFields(typeScenario, fields) {
    var sortedFields = _.sortBy(fields, function(prop) {
        if (prop.scenario && prop.scenario[typeScenario]) {
            return -prop.scenario[typeScenario].length;
        }
    });

    return sortedFields;
}

function getVariation(field, typeScenario){
    var cacheField = [];
    field = util.deepCopy(field);
    function next(forceClearCache){
        var scenario, variation, 
            fieldName = field.name;

        if (forceClearCache === true) {
            cacheField = [];
        }

        if (!cacheField[fieldName]) {
            cacheField[fieldName] = util.deepCopy(field.scenario);
        };
        if (!field.scenario || 
            !field.scenario[typeScenario] || 
            util.size(field.scenario[typeScenario]) === 0) {
            field.scenario = util.deepCopy(cacheField[fieldName]);
            if (!field.scenario[typeScenario]) {
                return undefined;
            };
        }
        scenario = field.scenario[typeScenario];
        variation =  scenario.shift();
        return variation;
    };

    return next;
};

function intoScenario(field, scenario, variation) {
    if (!scenario || util.size(scenario.params) === 0) {
        scenario = buildScenario(variation.statusHttp, field.name, variation.value, variation.message);
    } else {
        scenario.params.push({name: field.name, value: getDynamicValue(variation.value)});
    };
    return scenario;
};

function generateScenario(config, resource, typeScenario) {
    var fields, nextVariation, scenario = {}, 
        contexts = [], variation, variations = {};
        fields = orderFields(typeScenario, getFieldsFromResource(config, resource)); 
        scenario = _.reduce(fields, function(variations, field) {
            nextVariation = getVariation(field, typeScenario);
            if (typeScenario === "negative") {
                typeScenario = "positive";
            };
            variation = nextVariation(scenario);
            if (!variations || util.size(variations.params) === 0) {
                variations = buildScenario(variation.statusHttp, field.name, variation.value, variation.message);
            } else {
                variations.params.push({name: field.name, value: getDynamicValue(variation.value)});
            };          

            return variations;
        }, {});
        return scenario;
}

module.exports = (function(config) {
    function paramsToUrl(url, resource) {
        var urlSet = url,
            indexGroup,
            groups,
            randomContext,
            patternCurlyBracket = /{(.*?)}/gi,
            group;

        while ((group = patternCurlyBracket.exec(url)) !== null) {
            randomContext = random(resource, group[1]);
            if (randomContext) {
                urlSet = urlSet.replace(group[0], randomContext);
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

    function scenariosToUrl(url, typesScenario, forceParams) {
        var scenarios, key,
            configResource = configToResource(url);

        if (configResource)
        {
            scenarios = scenariosToResource(configResource, typesScenario);
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
    function scenariosToResource(resource, typesScenarios) {
        var indexTypesScenarios,
            scenarios = [],
            isValid = false;

        if (!typesScenarios) {
            typesScenarios = allTypesScenarios.slice(0);
        }

        isValid = util.validate([
            { values: typesScenarios, compareTo: allTypesScenarios }
        ]);
        if (isValid) {
            for (indexTypesScenarios = typesScenarios.length; indexTypesScenarios--;) {
                scenarios = scenarios.concat(generateScenario(config, resource, typesScenarios[indexTypesScenarios]));
            }
        }
        return scenarios;
    }

    function configToResource(url) {
        var indexResource,
            resource,
            urls;

        for (indexResource = config.resources.length; indexResource--;) {
            resource = util.deepCopy(config.resources[indexResource]);
            if (util.match(resource.url, url)) {
                resource.url = paramsToUrl(url, resource);
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

        return getDynamicValue(value) || value;
    }

    function random(resource, field) {
        var params = getFieldsFromResource(config, resource, field),
            configField =  _.filter(params, function(prop) {
                            if (prop.name === field) {
                                return prop;
                            }
                        });
        if (configField) {
            return getRandomIn(configField[0].scenario.positive);
        } else {
            return null;
        }
    }

    return {
        insertDetailsFrom: insertDetailsFrom,
        paramsToUrl: paramsToUrl,
        configToResource: configToResource,
        scenariosToUrl: scenariosToUrl,
        scenariosToResource: scenariosToResource,
        random: random
    };
});
