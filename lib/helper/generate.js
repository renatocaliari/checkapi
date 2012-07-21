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

function setFieldsToResource(config, resource, field) {
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

function generateScenario(config, resource, typeScenario) {
    var fields, orderedFields, indexField = 0, indexField2 = 0,
        contexts = [], otherContexts = [], scenarios = [],
        indexContext, values, scenario, fieldNames, fieldName;

        fields = setFieldsToResource(config, resource);

        if (typeScenario === "positive") {
            orderedFields = _.sortBy(fields, function(prop) {
                if (prop.scenario[typeScenario]) {
                    return -prop.scenario[typeScenario].length;
                }
            });

            contexts = fields[0];
            for (indexContext = contexts.scenario[typeScenario].length; indexContext--;) {
                fieldName = fields[0].name;
                context = contexts.scenario[typeScenario][indexContext];
                scenario = buildScenario(context.statusHttp, fieldName, context.value, context.message);
                for (indexField = 1; indexField < fields[0].length; indexField++) {
                    otherContexts = fields[indexField];
                    fieldName = fields[indexField].name;
                    context = otherContexts.scenario[typeScenario][indexContext] || otherContexts.scenario[typeScenario][0];
                    scenario.params.push({name: fieldName, value: getDynamicValue(context.value)});
                }
                scenarios.push(scenario);
            }
        } else { //negative scenarios
            for (indexField = 0; indexField < fields.length; indexField++) {
                contexts = fields[indexField];
                if (contexts && contexts.scenario[typeScenario]) {
                    for (indexContext = contexts.scenario[typeScenario].length; indexContext--;) {
                        fieldName = fields[indexField].name;
                        //add negative scenario
                        context = contexts.scenario[typeScenario][indexContext];
                        scenario = buildScenario(context.statusHttp, fieldName, context.value, context.message);
                        //iterate on all fields
                        for (indexField2 = 0; indexField2 < fields.length; indexField2++) {
                            otherContexts = fields[indexField2];
                            fieldName = fields[indexField2].name;
                            if (fieldName !== fields[indexField].name) {
                                //add positive scenario for the negative scenario
                                context = otherContexts.scenario.positive[indexContext] || otherContexts.scenario.positive[0];
                                scenario.params.push({name: fieldName, value: getDynamicValue(context.value)});
                            }
                        }
                        scenarios.push(scenario);
                    }
                }
            }
        }
        return scenarios;
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
        var params = setFieldsToResource(config, resource, field),
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
