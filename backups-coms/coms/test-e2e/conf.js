'use strict';

const _ = require('lodash');
const seleniumWebdriverRemote = require('selenium-webdriver/remote');

// Allow ES6 modules
// Code in this file can't use 'import' because it has already been parsed
// but any subsequently included files can
require('babel-register')({
	plugins: [
		require('babel-plugin-transform-es2015-modules-commonjs'),
	],
    retainLines: true,
});

const common = require('./common');
const matchers = require('./matchers');

const baseUrl = 'http://' + (process.env.SERVER_HOSTNAME || 'localhost') + ':8000/';
const seleniumLocal = 'http://localhost:4444/wd/hub';
const seleniumChrome = `http://${(process.env.SELENIUM__STANDALONE_CHROME_PORT||'').replace('tcp://', '')}/wd/hub`;
const seleniumFirefox = `http://${(process.env.SELENIUM__STANDALONE_FIREFOX_PORT||'').replace('tcp://', '')}/wd/hub`;

// switch chrome/firefox to test alternate browsers (currently doesn't test both)
const seleniumUrl = process.env.CI ? seleniumChrome : seleniumLocal;

// TODO: Write tests for the following functionalities
// All order screen: Filtering and sorting
// Display totals window
// Invoice printing
// Reassign orders
// Replace SKU
// Manage Specifications
// Scheduling
// Schedule Availability
// Reports
// All permission-based feature and information

// Timeouts: see http://www.protractortest.org/#/timeouts
// For page load [and waiting for angular to be present if not ignoreSynchronization]
const TIMEOUT_PAGELOAD = 15;
// Waiting for pending script activity (ie angular to finish processing something, including $timeout and $http)
const TIMEOUT_PENDING = 20;
// How long can any one test case take to run; will present with the error
// "Timeout - Async callback was not invoked within timeout specified by jasmine.DEFAULT_TIMEOUT_INTERVAL"
// The only thing that should take this long is resetting the DB, but that can take quite a while
const TIMEOUT_TESTCASE = 180;

exports.config = {
    baseUrl: baseUrl,
    seleniumAddress: seleniumUrl,
    capabilities: {
        browserName: 'chrome',
        chromeOptions: {
            args: ['--no-sandbox', '--test-type=browser'],
            prefs: {
                'download': {
                    'prompt_for_download': false,
                    'default_directory': '/tmp/',
                },
            },
        },
    },
    rootElement: '#ngApp',
    suites: {
        newage: '../nac/newage/protractor/**/*.spec.js',
        caravans: '../nac/caravans/protractor/**/*.spec.js',
        orders: '../nac/orders/protractor/**/*.spec.js',
        schedule: '../nac/schedule/protractor/**/*.spec.js',
    },
    onPrepare: function() {
        browser.addMockModule('NewAge', function() {
            const NewAge = angular.module('NewAge');

            // Replace DateProvider angular service to return a predefined date
            console.log('Mocking Date');
            NewAge.factory('DateProvider', () => ({now: () => new Date("2016-09-01T00:00:00Z")}));

            // Generate HTML instead of PDF because protractor can't deal with PDF, and it blows up CI Selenium
            NewAge.config(['$provide', function ($provide) {
                $provide.constant('TestSettings', {
                    'DISABLE_PDF': true,
                });
            }])
        });

        // arguments will be printed to console.log() at execution time
        // if the first argument is a function, then its return value will be passed to console.log() at execution time instead
        browser.asyncLog = (f, ...args) => {
            protractor.promise.controlFlow().execute(() => {
                console.log(_.isFunction(f) ? f() : f, ...args);
            });
        };

        // The initial setup can take a while; we do this before the actual tests
        // so that we don't get spec timeouts
        common.restoreDatabase('base', null, false)();

        beforeAll(function() {
            browser.ignoreSynchronization = true;
            jasmine.addMatchers(matchers);
        });

        // Needed to allow file uploads to work on CI where Selenium is not running locally
        browser.setFileDetector(new seleniumWebdriverRemote.FileDetector());
    },

    // Options to be passed to Jasmine-node.
    framework: 'jasmine',
    jasmineNodeOpts: {
        showColors: true, // Use colors in the command line report.
        defaultTimeoutInterval: TIMEOUT_TESTCASE*1000,
        realtimeFailure: true,
        stopSpecOnExpectationFailure: true,
        stopOnFailure: true,
    },
    getPageTimeout: TIMEOUT_PAGELOAD*1000,
    allScriptsTimeout: TIMEOUT_PENDING*1000,
    params: {
        userDetails: {
            'admin': {
                username: 'admin',
                password: 'admin',
                displayName: 'admin',
                company: 'Newage Caravans National',
                isStaff: true,
            },
            'useradmin': {
                username: 'useradmin',
                password: 'useradmin',
                displayName: 'User Manager',
                company: 'Newage Caravans National',
                isStaff: true,
            },
            'nationalsales': {
                username: 'nationalsales',
                password: 'nationalsales',
                displayName: 'National Sales',
                company: 'Newage Caravans National',
                isStaff: true,
            },
            'drafter': {
                username: 'drafter',
                password: 'drafter',
                displayName: 'Drafter',
                company: 'Newage Caravans National',
                isStaff: true,
            },
            'drafterprincipal': {
                username: 'drafterprincipal',
                password: 'drafterprincipal',
                displayName: 'Principal Drafter',
                company: 'Newage Caravans National',
                isStaff: true,
            },
            'dealerprincipal': {
                username: 'dealerprincipal',
                password: 'dealerprincipal',
                displayName: 'Dealer Principal',
                company: 'Newage Caravans National',
                isStaff: false,
            },
            'standmanager': {
                username: 'standmanager',
                password: 'standmanager',
                displayName: 'Stand Manager',
                company: 'Newage Caravans National',
                isStaff: false,
            },
            'schedulemanager': {
                username: 'schedulemanager',
                password: 'schedulemanager',
                displayName: 'Schedule Manager',
                company: 'Newage Caravans National',
                isStaff: false,
            },
            'dealerrep': {
                username: 'dealerrep',
                password: 'dealerrep',
                displayName: 'Dealer Sales Rep',
                company: 'Newage Caravans National',
                isStaff: false,
            },
            'dealer2rep': {
                username: 'dealer2rep',
                password: 'dealer2rep',
                displayName: 'Dealer 2 Sales Rep',
                company: 'Newage Caravans National',
                isStaff: false,
            },
            'transport': {
                username: 'transport',
                password: 'transport',
                displayName: 'Transport User',
                company: 'Newage Caravans National',
                isStaff: false,
            },
            'vin': {
                username: 'vin',
                password: 'vin',
                displayName: 'VIN User',
                company: 'Newage Caravans National',
                isStaff: false,
            },
        }
    },
    // specs: [
    //     'spec.js',
    // ],
};
