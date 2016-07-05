"use strict";

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _chai = require('chai');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _pactNode = require('@pact-foundation/pact-node');

var _pactNode2 = _interopRequireDefault(_pactNode);

var _pact = require('pact');

var _pact2 = _interopRequireDefault(_pact);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('Pact random mock port', function () {

  var MOCK_PORT = Math.floor(Math.random() * 999) + 9000;
  var PROVIDER_URL = 'http://localhost:' + MOCK_PORT;
  // const PROVIDER_URL = `http://localhost:9700`
  var mockServer = _pactNode2.default.createServer({
    port: MOCK_PORT,
    log: _path2.default.resolve(process.cwd(), 'logs', 'mockserver-integration.log'),
    dir: _path2.default.resolve(process.cwd(), 'pacts'),
    spec: 2
  });

  var servers = _pactNode2.default.listServers();
  console.log(JSON.stringify(servers));

  _pactNode2.default.logLevel('debug');

  var EXPECTED_BODY = [{
    id: 1,
    name: 'Project 1',
    due: '2016-02-11T09:46:56.023Z',
    tasks: [{ id: 1, name: 'Do the laundry', 'done': true }, { id: 2, name: 'Do the dishes', 'done': false }, { id: 3, name: 'Do the backyard', 'done': false }, { id: 4, name: 'Do nothing', 'done': false }]
  }];

  var provider,
      counter = 1;

  after(function () {
    _pactNode2.default.removeAllServers();
  });

  beforeEach(function (done) {
    mockServer.start().then(function afterStart() {
      console.log("function after start");
      provider = (0, _pact2.default)({ consumer: 'Consumer ' + counter, provider: 'Provider ' + counter, port: MOCK_PORT });
      done();
    });
  });

  afterEach(function (done) {
    mockServer.delete().then(function () {
      counter++;
      done();
    });
  });

  context('with a single request', function () {

    // add interactions, as many as needed
    beforeEach(function (done) {
      provider.addInteraction({
        state: 'i have a list of projects',
        uponReceiving: 'a request for projects',
        withRequest: {
          method: 'get',
          path: '/projects',
          headers: { 'Accept': 'application/json' }
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: EXPECTED_BODY
        }
      }).then(function () {
        return done();
      });
    });

    // once test is run, write pact and remove interactions
    afterEach(function (done) {
      provider.finalize().then(function () {
        return done();
      });
    });

    // execute your assertions
    it('successfully verifies', function (done) {
      var verificationPromise = _superagent2.default.get(PROVIDER_URL + '/projects').set({ 'Accept': 'application/json' }).then(provider.verify);

      (0, _chai.expect)(verificationPromise).to.eventually.eql(JSON.stringify(EXPECTED_BODY)).notify(done);
    });
  });

  context('with two requests', function () {

    beforeEach(function (done) {
      var interaction1 = provider.addInteraction({
        state: 'i have a list of projects',
        uponReceiving: 'a request for projects',
        withRequest: {
          method: 'get',
          path: '/projects',
          headers: { 'Accept': 'application/json' }
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: EXPECTED_BODY
        }
      });

      var interaction2 = provider.addInteraction({
        state: 'i have a list of projects',
        uponReceiving: 'a request for a project that does not exist',
        withRequest: {
          method: 'get',
          path: '/projects/2',
          headers: { 'Accept': 'application/json' }
        },
        willRespondWith: {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      });

      _bluebird2.default.all([interaction1, interaction2]).then(function () {
        return done();
      });
    });

    // once test is run, write pact and remove interactions
    afterEach(function (done) {
      provider.finalize().then(function () {
        return done();
      });
    });

    it('successfully verifies', function (done) {
      var promiseResults = [];

      var verificationPromise = _superagent2.default.get(PROVIDER_URL + '/projects').set({ 'Accept': 'application/json' }).then(function (response) {
        promiseResults.push(response);
        return _superagent2.default.get(PROVIDER_URL + '/projects/2').set({ 'Accept': 'application/json' });
      }).then(function () {}, function (err) {
        promiseResults.push(err.response);
      }).then(function () {
        return provider.verify(promiseResults);
      });

      (0, _chai.expect)(verificationPromise).to.eventually.eql([JSON.stringify(EXPECTED_BODY), '']).notify(done);
    });
  });

  context('with an unexpected interaction', function () {
    // add interactions, as many as needed
    beforeEach(function (done) {
      provider.addInteraction({
        state: 'i have a list of projects',
        uponReceiving: 'a request for projects',
        withRequest: {
          method: 'get',
          path: '/projects',
          headers: { 'Accept': 'application/json' }
        },
        willRespondWith: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: EXPECTED_BODY
        }
      }).then(function () {
        return done();
      });
    });

    // once test is run, write pact and remove interactions
    afterEach(function (done) {
      provider.finalize().then(function () {
        return done();
      });
    });

    it('fails verification', function (done) {
      var promiseResults = [];

      var verificationPromise = _superagent2.default.get(PROVIDER_URL + '/projects').set({ 'Accept': 'application/json' }).then(function (response) {
        promiseResults.push(response);
        return _superagent2.default.delete(PROVIDER_URL + '/projects/2');
      }).then(function () {}, function (err) {
        promiseResults.push(err.response);
      }).then(function () {
        return provider.verify(promiseResults);
      });

      (0, _chai.expect)(verificationPromise).to.be.rejectedWith('No interaction found for DELETE /projects/2').notify(done);
    });
  });
});

//import { default as Pact } from 'pact'
//# sourceMappingURL=index.js.map