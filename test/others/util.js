var should = require('should')
    util = require('../../lib/helper/util');

describe('Util', function() {
    describe('convertMultipleObjectsToOneObject', function() {
        describe('send one object', function() {
            it('should return one object', function(done) {
                var collection, obj;

                collection = [
                    { name: 'property1', value: 'value1'}
                ];

                obj = util.convertMultipleObjectsToOneObject(collection);

                obj.property1.should.equal('value1');

                done();
            });
        });
        describe('send multiple objects', function() {
            it('should return one object', function(done) {
                var collection, obj;

                collection = [
                    { name: 'property1', value: 'value1'},
                    { name: 'property2', value: 'value2'}
                ];

                obj = util.convertMultipleObjectsToOneObject(collection);

                obj.property1.should.equal('value1');
                obj.property2.should.equal('value2');

                done();
            });
        });
    });

    describe('Copy object', function() {
        describe('clone', function() {
            it('should clone object', function(done) {
                var value = util.clone();

                done();
            });
        });
        describe('deepCopy', function() {
            it('should clone object', function(done) {
                var obj, cloneObj;

                obj = {
                    prop1: 'value1',
                    prop2: 'value2',
                    prop3: {
                        prop31: 'value31'
                    }
                };
                cloneObj = util.deepCopy(obj);

                cloneObj.should.be.a('object');
                cloneObj.prop1.should.equal('value1');
                cloneObj.prop2.should.equal('value2');
                cloneObj.prop3.prop31.should.equal('value31');

                done();
            });
        });
    });

    describe('isObject', function() {
        it('should string return false', function(done) {
            util.isObject('abc').should.equal(false);
            done();
        });
        it('should array return false', function(done) {
            util.isObject([1, 2, 3]).should.equal(false);
            done();
        });
        it('should object return true', function(done) {
            util.isObject({prop: 'value'}).should.equal(true);
            done();
        });
    });

    describe('isJson', function() {
        it('should string return false', function(done) {
            util.isJson('abc').should.equal(false);
            done();
        });
        it('should array return false', function(done) {
            util.isJson([1, 2, 3]).should.equal(false);
            done();
        });
        it('should object return false', function(done) {
            util.isJson({prop: 'value'}).should.equal(false);
            done();
        });
        it('should json return true', function(done) {
            util.isJson('{"prop": "value"}').should.equal(true);
            done();
        });
    });

    describe('match', function() {
        it('should not be ok', function(done) {
            var url = 'http://www.example.com/test',
                matched = util.match('example.com.test', url);

            matched.should.be.not.ok;

            done();
        });
        it('should be ok', function(done) {
            var url = 'http://www.example.com/test',
                matched = util.match('http://www.example.com/test', url);

            matched.should.be.ok;

            done();
        });

    });
    
    describe('replaceProperty', function() {
        it('should replace property', function(done) {
            var obj = {
                test1: 'abc',
                test2: 'def'
            };

            util.replaceProperty(obj, 'test2', 'ok');
            obj.test1.should.equal('abc');
            obj.test2.should.equal('ok');

            done();
        });
        it('should replace property', function(done) {
            var obj = {
                test1: 'abc',
                test2: {
                    test3: 'def',
                    test4: 'ghi'
                }
            };

            util.replaceProperty(obj, 'test4', 'ok');
            obj.test1.should.equal('abc');
            obj.test2.test3.should.equal('def');
            obj.test2.test4.should.equal('ok');

            done();
        });
    });

    describe('size', function() {
        describe('Array', function() {
            it('should return length', function(done) {
                var array = ['one', 'two', 'three'],
                    size = util.size(array);
                size.should.equal(3);
                done();
            });
            it('should return length', function(done) {
                var array = ['one'],
                    size = util.size(array);
                size.should.equal(1);
                done();
            });
        });
        describe('Object', function() {
            it('should return length', function(done) {
                var object = {
                        one: 1,
                        two: 2,
                        three: 3
                    },
                    size = util.size(object);

                size.should.equal(3);
                done();
            });
        });
    });
    describe('validate', function() {
        describe('Send any values', function() {
            it('should return false', function(done) {
                var rules = [
                    {
                        values: ['content', 'abc'],
                        compareTo: ['content', 'rating']
                    }];
                util.validate(rules).should.equal(false);

                done();
            });
        });
        describe('Send values allowed in array', function() {
            it('should return true', function(done) {
                var rules = [
                    {
                        values: ['content', 'rating'],
                        compareTo: ['content', 'rating', 'place']
                    }];
                util.validate(rules).should.equal(true);

                done();
            });
        });
        describe('Send values allowed in object', function() {
            it('should return false', function(done) {
                var rules = [
                    {
                        values: ['happyPath', 'boundaryCase'],
                        compareTo: {
                            happyPath: ['abc','def'],
                            another: []
                        }
                    }];
                util.validate(rules).should.equal(false);

                done();
            });
            it('should return true', function(done) {
                var rules = [
                    {
                        values: ['happyPath', 'boundaryCase'],
                        compareTo: {
                            happyPath: ['abc','def'],
                            boundaryCase: []
                        }
                    }];
                util.validate(rules).should.equal(true);

                done();
            });
        });
    });
});
