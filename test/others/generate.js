var rewire = require('rewire'),
    _ = require('../../lib/helper/underscore-min.js'),
    should = require('should'),
    Generate = rewire('../../lib/helper/generate'),
    generate,
    config = require('../../test/api/configApiV1'),
    getDynamicValue, resources = {};

describe('Generate', function() {
    beforeEach(function() {
        generate = new Generate(config);
        Generate.__set__("configHelper", {
            randomText: function (arg) {
                return arg;
            }
        });
        resources = {};
        _.extend(resources, config.resources);
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
                var randomValue = generate.random(resources[1], 'rating'),
                    rating = parseInt(randomValue, 10);
                rating.should.be.above(0);
                rating.should.be.below(6);

                done();
            });
        });
    });


    describe('setValueParamsToUrl', function() {
        it('should match url and return replaced with random value', function(done) {
            var url = generate.setValueParamsToUrl(resources[1]);
            url.should.not.include('{placeId}');

            done();
        });
    });

    describe('getResource', function() {
        it('should get config-resource of correct url', function(done) {
            var configUrl;
            configUrl = generate.getResource('/places/{placeId}/reviews/new');
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
                    var fields = getFieldsFromResource(resources[0]);
                    done();
                });
            });
        });

        describe('orderFields', function() {
            var orderFields = Generate.__get__("orderFields");
            it('should order fields', function(done) {
                var fields = orderFields(resources[0]);
                done();
            });
        });

        describe('setupVariation', function() {
            var setupVariation, field;
            beforeEach(function(){
                setupVariation = Generate.__get__("setupVariation");
                field = resources[0].params[0];
            });

            it('should get variation for scenario 400', function(done) {
                var variation, nextVariation;
                nextVariation = setupVariation();
                variation = nextVariation(field, "400");
                 variation.statusHttp.should.equal('400');

                done();
            });

            it('should get variation for scenario 200', function(done) {
                var variation, nextVariation;
                nextVariation = setupVariation();
                variation = nextVariation(field);
                 variation.statusHttp.should.equal('200');

                done();
            });

            it('should get first variation again when already used all variations', function(done) {
                var saveVariation, variation, nextVariation;

                nextVariation = setupVariation();
                saveVariation = nextVariation(field);
                nextVariation(field);
                nextVariation(field);
                nextVariation(field);
                variation = nextVariation(field);
                variation.value.should.equal(saveVariation.value);

                done();
            });

        });

        describe('generateScenario', function() {
            var generateScenario = Generate.__get__("generateScenario");

            it('should generate scenarios', function(done) {
                var scenarios = generateScenario(resources[0]);
                scenarios.length.should.equal(10);

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

        describe('scenariosToResource', function() {
            it('should return scenarios', function(done) {
                var scenarios =
                    generate.scenariosToResource(resources[0]);

                scenarios.length.should.equal(10);

                done();
            });
        });
    });
});
