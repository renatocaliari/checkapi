test:
	@./node_modules/mocha/bin/mocha ./test/client/*.js -R spec -t 10s --require should
	@./node_modules/mocha/bin/mocha ./test/helper/*.js -R spec -t 10s --require should

.PHONY: test
