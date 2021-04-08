var should = require('should'),
    config = require('./configApi'),
    Client = require('../../lib/client/client'),
    OAuth = require('oauth').OAuth,
    rest = require('restler'), 
    api, 
    url, 
    mockRest,
    mockOAuth,
    mockLog,
    requestTokenUrl, 
    accessTokenUrl, 
    consumerKey, 
    consumerSecret,
    version, 
    encryption,
    tokenKey, 
    tokenSecret, 
    parameters;

describe('Client Api', function() {
    before(function() {
        mockLog = function() {
            function log(info, detail) {

            };

            return { 
                debug: log,
                error: log
            };
        }();
    });

    describe('call endpoint with no authentication', function() {
        before(function() {
            mockRest = {
                get: function(url, body) {
                    parameters = body;
                    return this;
                },
                on: function(status, callback) {
                    callback();
                }
            };
        });

        it('should send with no authentication', function(done) {
            var scenario = {
                url: '/search/places/bypoint',
                methodHttp: 'get',
                auth: '',
                values: {}
            };

            api = new Client({
                restler: mockRest,
                OAuth: OAuth,
                Logger: mockLog
            }, config);

            api.send(scenario,
                    function(data, response, error, scenario) {
                        scenario.should.be.a('object');
                        parameters.should.eql({data: {}});
                        done();
                    }
                );  
        });
    });

    describe('call endpoint with OAuth authentication', function() {
        
        before(function() {
            mockOAuth = function(param1, param2, param3, param4, 
                param5, callback, param6){
                    requestTokenUrl = param1;
                    accessTokenUrl = param2;
                    consumerKey = param3;
                    consumerSecret = param4;
                    version = param5;
                    encryption = param6;

                    return {
                        setClientOptions: function(object) {
                        },
                        put: function(param1, param2, param3, param4, none, callback) {
                            url = param1;
                            tokenKey = param2;
                            tokenSecret = param3;
                            parameters = param4;
                            callback(null, param4, null);
                        }
                    }
                };

            api = new Client({
                restler: rest,
                OAuth: mockOAuth,
                Logger: mockLog
            }, config);
        });

        it('should send all information needed to OAuth', function(done) {
            var paramsToSend = [
                    {name: 'rating', value: '3'},
                    {name: 'content', value: ''},
                    {name: 'type', value: 'json'}
            ], paramsToCheck = {
                    'rating': '3',
                    'content': '',
                    'type': 'json'
            },
            scenario = {
                url: '/places/{placeId}/reviews/new',
                methodHttp: 'put',
                auth: 'oauth',
                params: paramsToSend
            }; 

            api.send(scenario,
                    function(data, response, error, scenario) { 
                        scenario.should.be.a('object');
                        requestTokenUrl.should.equal(config.auth.requestTokenUrl);
                        accessTokenUrl.should.equal(config.auth.accessTokenUrl);
                        consumerKey.should.equal(config.auth.consumerKey);
                        consumerSecret.should.equal(config.auth.consumerSecret);
                        tokenKey.should.equal(config.auth.tokenKey);
                        tokenSecret.should.equal(config.auth.tokenSecret);
                        parameters.should.eql(paramsToCheck);
                    });
            done();
        });
    });

    describe('call endpoint with Basic authentication', function() {
        before(function() {
            mockRest = {
                get: function(url, body) {
                    parameters = body;
                    return this;
                },
                on: function(status, callback) {
                    callback(200, {raw: ""});
                }
            };
        });

        it('should send username and password', function(done) {
            var scenario = {
                url: '/search/places/bypoint',
                methodHttp: 'get',
                auth: 'basic',
                values: {}
            };
            api = new Client({
                restler: mockRest,
                OAuth: OAuth,
                Logger: mockLog
            }, config);

            api.send(scenario,
                function(data, response, error, scenario) {
                    scenario.should.be.a('object');

                    parameters.should.have.property('username');
                    parameters.should.have.property('password');

                    parameters.username.should.equal(config.auth.consumerKey);
                    parameters.password.should.equal(config.auth.consumerSecret);

                    done();
                }
            );  
        });
    })
});
