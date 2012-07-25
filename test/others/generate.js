var rewire = require('rewire'),
    _ = require('../../lib/helper/underscore-min.js'),
    should = require('should'),
    Generate = rewire('../../lib/helper/generate'),
    generate,
    config = require('../../test/api/configApiV1'),
    getDynamicValue, resources;

describe('Generate', function() {
    beforeEach(function() {
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
            scenario.params.length.should.equal(0);
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
        describe('getFieldsFromResource', function() {
            describe('get fields from default too', function() {
                var getFieldsFromResource = Generate.__get__("getFieldsFromResource");

                it('should set fields', function(done) {
                    var fields = getFieldsFromResource(config, resources[0]);
                });         
            });
        });

        describe('orderFields', function() {
            var orderFields = Generate.__get__("orderFields");
            it('should order fields', function(done) {
                var fields = orderFields(fields);
                done();
            });         
        });

        describe('intoScenario', function() {
            beforeEach(function(){
                resources = config.resources;
            });

            it('should put new variation into scenario with others variations', function(done) {
                var insertVariation, variation, nextVariation, field, scenario = {},
                    getVariation = Generate.__get__("getVariation"),    
                    intoScenario = Generate.__get__("intoScenario");
                field = resources[0].params[0];
                nextVariation = getVariation(field, 'positive');
                insertVariation = intoScenario.bind(this, field);
                _(2).times(function () {
                    variation = nextVariation(scenario);
                    scenario = insertVariation(scenario, variation);
                });

                scenario.params.length.should.equal(2);
                done(); 
            });
        });

        describe('getVariation', function() {
            var getVariation;
            beforeEach(function(){
                getVariation = Generate.__get__("getVariation");
                resources = config.resources;
            });

            it('should get variation', function(done) {
                var variation, nextVariation;
                nextVariation = getVariation(resources[0].params[0], 'positive');
                variation = nextVariation();
                variation.statusHttp.should.equal('200');
                done();
            });

            it('should get first variation again when already used all variations', function(done) {
                var saveVariation, variation, nextVariation;
                nextVariation = getVariation(resources[0].params[0], 'positive');
                saveVariation = nextVariation();
                nextVariation();
                nextVariation();
                variation = nextVariation();

                variation.value.should.equal(saveVariation.value);
                done();
            });
        });

        describe('generateScenario', function() {
            var generateScenario = Generate.__get__("generateScenario");
            it('should generate positive scenarios', function(done) {
                var scenarios = generateScenario(config, resources[0], 
                     'positive');
                scenarios.length.should.equal(3);

                done();
            });
            it('should generate negative scenario', function(done) {
                var scenarios = generateScenario(config, resources[0], 
                     'negative');
                scenarios.length.should.equal(1);

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
