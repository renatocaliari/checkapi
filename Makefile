test-others:
	@./node_modules/mocha/bin/mocha ./test/others/*.js -R spec -t 10s --require should
test-api:
	@./node_modules/vows/bin/vows ./test/api/*.js --spec

.PHONY: test-api