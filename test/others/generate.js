var rewire = require('rewire'),
    _ = require('../../lib/helper/underscore-min.js'),
    should = require('should'),
    Generate = rewire('../../lib/helper/generate'),
    generate,
    config = require('../../test/api/configApiV1'),
    getDynamicValue, resources;

describe('Generate', function() {
    before(function() {
        generate = new Generate(config);
        Generate.__set__("configHelper", {
            randomText: function (arg) {
                return arg;
            }
        });

        resources = config.resources;
    });

    describe('getDynamicValue', function() {
        it('should get the function, execute it and return the result', function(done) {
            var getDynamicValue = Generate.__get__("getDynamicValue"),
                value = getDynamicValue('$randomText(20)');
            value.should.equal('20');

            done();
        });
    });


    describe('buildScenario', function() {
        it('should get the function, execute it and return the result', function(done) {
            var buildScenario = Generate.__get__("buildScenario"),
                scenario = buildScenario(200, 'picture', 'something.jpg', 'test');
            
            scenario.statusHttp.should.equal(200);
            scenario.params[0].name.should.equal('picture');
            scenario.params[0].value.should.equal('something.jpg');
            scenario.message.should.equal('test');

            done();
        });
    });

    describe('insertDetailsFrom', function() {
        describe('Valid', function() {
            it('should have properties from resource', function(done) {
                var scenario;

                scenario = [{}];

                generate.insertDetailsFrom(resources[0]).To(scenario);

                scenario[0].should.have.property('methodHttp');
                scenario[0].should.have.property('auth');
                scenario[0].should.have.property('url');

                done();
            });
        });
    });

    describe('Random Values', function() {
        describe('random: placeId', function() {
            it('should return a random placeId', function(done) {
                var randomValue = generate.random(resources[0], 'rating'),
                    rating = parseInt(randomValue, 10);
                
                rating.should.be.above(0);
                rating.should.be.below(6);

                done();
            });
        });
        describe('randomLatLng', function() {
            it('should return lat and lng', function(done) {
                var randomValue = generate.randomLatLng;

                randomValue.should.have.property('lat');
                randomValue.lat.should.be.a('number');
                randomValue.should.have.property('lng');
                randomValue.lng.should.be.a('number');

                done();
            });
        });
    });


    describe('paramsToUrl', function() {
        it('should match url and return replaced with random value', function(done) {
            var url = generate.paramsToUrl(
                    'http://www.example.com/{placeId}/do/{placeId}',
                    resources[0]);
            url.should.not.include('{placeId}');

            done();
        });
    });

    describe('configToResource', function() {
        it('should get config of correct url', function(done) {
            var configUrl;
            configUrl = generate.configToResource('/places/{placeId}/reviews/new');
            
            configUrl.auth.should.equal('oauth');
            configUrl.methodHttp.should.equal('put');

            done();
        });
    });


    describe('Scenarios', function() { 
        describe('setFieldsToResource', function() {
            describe('get fields from default too', function() {
                var setFieldsToResource = Generate.__get__("setFieldsToResource");

                it('should set fields', function(done) {
                    var fields = setFieldsToResource(config, resources[0]);

                    done();
                });         
            });
        });
        describe('generateScenario', function() {
            var generateScenario = Generate.__get__("generateScenario");
            it('should generate positive scenarios', function(done) {
                var scenarios = generateScenario(config, resources[0], 
                     'positive');
                scenarios.length.should.equal(5);

                done();
            });
            it('should generate negative scenario', function(done) {
                var scenarios = generateScenario(config, resources[0], 
                     'negative');

                scenarios.length.should.equal(6);

                done();
            });
        });

        describe('scenariosToUrl', function() {
            it('should return scenarios', function(done) {
                var scenarios = generate.scenariosToUrl('/places/{placeId}/reviews/new');
                scenarios.length.should.be.above(0);

                done();
            });
        });

        describe('scenariosToResource: Positive', function() {
            it('should return scenarios of happy paths', function(done) {
                var scenarios =
                    generate.scenariosToResource(resources[0], ['positive']);

                scenarios.length.should.equal(5);

                done();
            });
        });

        describe('scenariosToFields: Negative', function() {
            it('should return scenarios of boundary cases with no repeated combinations',
                function(done) {
                    var index,
                        total,
                        scenarios = generate.scenariosToResource(
                            resources[0],
                            ['negative']
                        ),
                        values = [];

                    total = scenarios.length;
                    for (index = total; index--;) {
                        values.push(JSON.stringify(scenarios[index].values));
                    }

                    scenarios.length.should.equal(6);
                    
                    done();
                }
            );
        });

        describe('scenariosToFields: ALL Cases', function() {
            it('should return scenarios with all cases (positive and negative)',
                function(done) {
                    var scenarios = generate.scenariosToResource(resources[0]);

                    scenarios.length.should.equal(11);

                    done();
                }
            );
        });
    });
});
