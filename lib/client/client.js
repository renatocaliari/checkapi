var util = require('../helper/util.js'),
    inspect = require('util').inspect,
    Client = function(dependencies, config) {
    var rest, // restler
        OAuth, // oauth,
        log, // bunyan,
        logDetail,
        data;

        if (!config) {
            throw new Error("Config is missing.");
        }

        if (!dependencies) {
            throw new Error("Dependencies are missing.");
        }

        rest = dependencies.restler;
        OAuth = dependencies.OAuth;
        log = dependencies.Logger;

    return {
        send: function(scenario, callback) {
            var oa, methodHttp, methodAuth, body,
                url = config.api.pathBase + scenario.url;

            methodHttp = scenario.methodHttp;
            methodAuth = scenario.auth;

            if (scenario.params) {
                data = util.convertMultipleObjectsToOneObject(
                    scenario.params);
            } else {
                data = {};
            }

            if (config.api.debug === "true") {
                console.log('');
                console.log('::Debug::Client::url:', url);
                console.log('::Debug::Client::methodHttp:', methodHttp);
                console.log('::Debug::Client::methodAuth:', methodAuth);
                console.log('::Debug::Client::data:', data);
            }

            switch (methodAuth) {
            case 'oauth':
                oa = new OAuth(config.auth.requestTokenUrl,
                               config.auth.accessTokenUrl,
                               config.auth.consumerKey,
                               config.auth.consumerSecret,
                               '1.0',
                               null,
                               'HMAC-SHA1');

                oa.setClientOptions({'requestTokenHttpMethod': 'GET',
                                    'accessTokenHttpMethod': 'GET'});

                oa[methodHttp](url, config.auth.tokenKey, config.auth.tokenSecret, data, null,
                    function(error, data, response) {
                          logDetail = {
                                url: url,
                                methodHttp: methodHttp,
                                methodAuth: methodAuth,
                                requestTokenUrl: config.auth.requestTokenUrl,
                                accessTokenUrl: config.auth.accessTokenUrl,
                                consumerKey: config.auth.consumerKey,
                                consumerSecret: config.auth.consumerSecret,
                                tokenKey: config.auth.tokenKey,
                                tokenSecret: config.auth.tokenSecret,
                                error: error,
                                body: inspect(data),
                                statusCode: response.statuscode
                          };
                          if (error) {
                             log.error('detail', logDetail);
                             return callback(data, response, error, scenario);
                          }
                          log.debug('detail', logDetail);
                          return callback(data, response, error, scenario);
                     });
                break;
            case 'basic':
                body = {};
                body.data = inspect(data);
                body.username = config.auth.consumerKey;
                body.password = config.auth.consumerSecret;
                rest[methodHttp](url, body)
                    .on('complete', function(result, response) {
                        logDetail = {
                            url: url,
                            methodHttp: methodHttp,
                            methodAuth: methodAuth,
                            consumerKey: config.auth.consumerKey,
                            consumerSecret: config.auth.consumerSecret,
                            body: inspect(data),
                            response: response.raw.toString(),
                            statusCode: response.statusCode
                        };
                        if (result instanceof Error) {
                            log.error('detail', logDetail);
                            return callback(result, response, result, scenario);
                        } else {
                            log.debug('detail', logDetail);
                            return callback(result, response, null, scenario);
                        }
                    });
                break;
            default:
                body = {data: body};
                rest[methodHttp](url, body)
                    .on('complete', function(result, response) {
                        if (result instanceof Error) {
                            log.error('detail', logDetail);
                            return callback(result, response, result, scenario);
                        } else {
                            log.debug('detail', logDetail);
                            return callback(result, response, null, scenario);
                        }
                    });
            }
        }
    };
};

module.exports = Client;
