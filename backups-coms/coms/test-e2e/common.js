import * as child_process from 'child_process';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as glob from 'glob';
import memoize from 'cache-memoize';
import minimatch from 'minimatch';
import * as url from 'url';
import * as path from 'path';

const DJANGO_ROOT_DIR = fs.realpathSync(__dirname + '/../nac');
const MANAGE_PY = DJANGO_ROOT_DIR + '/manage.py';

module.exports.DJANGO_ROOT_DIR = DJANGO_ROOT_DIR;
module.exports.MANAGEPY = MANAGE_PY;


//---------------------------------------------------------------------------
/**
 * Sets the `ignoreSynchronisation` flag immediately and also
 * as part of the control flow
 * see https://github.com/angular/protractor/issues/2275
 */
var setIgnoreSynchronisation = function(ignoreSynchronization) {
    // We need to do this immediately for browser.get()
    // console.log("ignoreSynchronisation(immediate): " + ignoreSynchronization);
    browser.ignoreSynchronization = ignoreSynchronization;

    // and again for other deferred execution
    return protractor.promise.controlFlow().execute(() => {
        browser.ignoreSynchronization = ignoreSynchronization;
        // console.log("ignoreSynchronisation(deferred): " + ignoreSynchronization);
    });
};

module.exports.setIgnoreSynchronisation = setIgnoreSynchronisation;


//---------------------------------------------------------------------------
/**
 * Wait for a certain URL to show
 * Needed because on non-angular pages protractor won't wait for pending http requests to finish
 * so browser.getCurrentUrl() will return the URL of the current page, not the loading page
 */
var waitForUrlPath = (expectedUrl, pageLoadTimeout=undefined) => {
    return browser.wait(() => {
        return browser.getCurrentUrl()
            .then((actualUrl) => {
                return isUrlPathMatch(actualUrl, expectedUrl)
            });
    }, pageLoadTimeout, `Gave up waiting for url path to be ${expectedUrl}`);
};

/**
 * Wait for a certain URL to show
 * Needed because on non-angular pages protractor won't wait for pending http requests to finish
 * so browser.getCurrentUrl() will return the URL of the current page, not the loading page
 */
var waitForUrlPathQuery = (expectedUrl, pageLoadTimeout=undefined) => {
    return browser.wait(() => {
        return browser.getCurrentUrl()
            .then((actualUrl) => {
                return isUrlPathQueryMatch(actualUrl, expectedUrl)
            });
    }, pageLoadTimeout, `Gave up waiting for url path & query to be ${expectedUrl}`);
};

/**
 * Wait for a certain URL to show
 * Needed because on non-angular pages protractor won't wait for pending http requests to finish
 * so browser.getCurrentUrl() will return the URL of the current page, not the loading page
 */
var waitForUrlHash = (expectedUrl, pageLoadTimeout=undefined) => {
    return browser.wait(() => {
        return browser.getCurrentUrl()
            .then((actualUrl) => {
                return isUrlHashMatch(actualUrl, expectedUrl)
            });
    }, pageLoadTimeout, `Gave up waiting for url hash to be ${expectedUrl}`);
};


/**
 * Check if a URL path matches
 * If URL is a regex, then will .match() else checks for full string match
 *
 * @param expected
 * @param actual
 * @returns {boolean}
 */
var isUrlPathMatch = (actual, expected) => {
    actual = url.parse(actual).pathname;
    return (typeof(expected) == 'string')
        ? actual == expected
        : !!actual.match(expected);
};

/**
 * Check if a URL path & query string match
 * If URL is a regex, then will .match() else checks for full string match
 *
 * @param expected
 * @param actual
 * @returns {boolean}
 */
var isUrlPathQueryMatch = (actual, expected) => {
    var parts = url.parse(actual);
    actual = parts.pathname + (parts.search || '');
    return (typeof(expected) == 'string')
        ? actual == expected
        : !!actual.match(expected);
};

/**
 * Check if a URL path, query, hash string match
 * If URL is a regex, then will .match() else checks for full string match
 *
 * @param expected
 * @param actual
 * @returns {boolean}
 */
var isUrlHashMatch = (actual, expected) => {
    var parts = url.parse(actual);
    actual = (parts.hash.slice(1) || ''); //Remove the starting #
    return (typeof(expected) == 'string')
        ? actual == expected
        : !!actual.match(expected);
};

module.exports.waitForUrlPath = waitForUrlPath;
module.exports.waitForUrlPathQuery = waitForUrlPathQuery;
module.exports.waitForUrlHash = waitForUrlHash;
module.exports.isUrlPathMatch = isUrlPathMatch;
module.exports.isUrlPathQueryMatch = isUrlPathQueryMatch;
module.exports.isUrlHashMatch = isUrlHashMatch;


//---------------------------------------------------------------------------

var waitForJQuery = (jQueryWaitTimeout=undefined) => {
    // wait for jquery's document.ready() to have fired
    // This is useful for non-angular pages where you want to know that
    // jquery events have been bound. If document.ready() triggers non-angular
    // jquery XHR or timeouts this will not detect know about them.
    // (Hint: look at jquery.ajax.active)
    return browser.wait(() => {
        return browser.executeScript('return !!window.jQueryReady;');
    }, jQueryWaitTimeout, `Gave up waiting for jQuery`);
};

module.exports.waitForJQuery = waitForJQuery;


//---------------------------------------------------------------------------
class Page {
    constructor() {
        // Does this page use angular?
        this.isAngular = true;

        // Global menu link text
        this.menuLinkText = null;

        // URL path to load
        this.urlPath = '';
        this.urlHash = null;

        // expected URL redirect location
        this.urlPathRedirect = null;
        this.urlHashRedirect = null;


        // substring expected in the title
        this.title = null;

        // substring expected in the h1 title
        this.h1Title = null;
    }

    /**
     * Initialise page without loading the page (assumes page has already loaded)
     * Wait for jquery/angular to be initialised
     * Validate that page appears as expected
     */
    init() {
        /*
        // Move the DjDT toolbar down the screen so it doesn't obscure the global
        // alert close button.
        browser.manage().addCookie("djdttop", '400');
        */
        this.initNoValidate();
        this.validate();
    }

    /**
     * Initialise settings for this page (assumes page has already loaded)
     * Skip validating that page loaded correctly
     */
    initNoValidate() {
        setIgnoreSynchronisation(!this.isAngular);
    }

    /**
     * Load this page
     * Wait for jquery/angular to be initialised
     * Validate that page loaded correctly
     */
    load() {
        this.loadNoValidate();
        this.validate();
    }

    /**
     * Load this page
     * Skip validation that page loaded correctly
     */
    loadNoValidate() {
        this.initNoValidate();
        let url = this.urlPath + (this.urlHash ? '#' + this.urlHash : '');
        browser.get(url);
    }

    /**
     * Wait for jquery/angular to be initialised
     * Validate that page loaded as expected
     */
    validate() {
        let url = this.urlPathRedirect;
        if (url === null) url = this.urlPath;

        let hash = this.urlHashRedirect;
        if (hash === null) hash = this.urlHash;

        if (url) {
            if (this.isAngular) {
                expect(browser.getCurrentUrl()).toEqualUrlPathQuery(url);
                if (hash) expect(browser.getCurrentUrl()).toEqualUrlHash(hash);
            } else {
                waitForUrlPathQuery(url);
                if (hash) waitForUrlHash(hash);
                waitForJQuery();
            }
        }

        if (this.title) {
            expect(browser.getTitle()).toContain(this.title);
        }

        if (this.h1Title) {
            expect($('.gradient-header h1').getText()).toContain(this.h1Title);
        }
    }

    /**
     * Methods to check whether a modal is open or closed
     * @param cssSelector selector to be appended to 'div.modal' (eg '#order_selector')
     * @returns {
     *  waitForOpen: (function()),
     *  waitForClose: (function()),
     * }
     */
    modal(modalCssSelector) {
        const TIMEOUT = 1500;
        return {
            closeButton: element(by.css(`div.modal${modalCssSelector} .modal-header .close`)),

            waitForOpen() {
                browser.wait(
                    () => element(by.css(`div.modal${modalCssSelector}`)).isDisplayed(),
                    TIMEOUT,
                    'modal is visible');
                browser.wait(
                    () => element(by.css('div.modal-backdrop.fade')).isPresent(),
                    TIMEOUT,
                    'modal backdrop is present');
                expect(element(by.css(`div.modal${modalCssSelector}`)).isDisplayed()).toBeTruthy();
                expect(element(by.css('div.modal-backdrop.fade')).isPresent()).toBeTruthy();
            },

            waitForClose() {
                browser.wait(
                    () => element(by.css(`div.modal${modalCssSelector}`)).isDisplayed().then(x => !x),
                    TIMEOUT,
                    'modal is hidden');
                browser.wait(
                    () => element(by.css('div.modal-backdrop.fade')).isPresent().then(x => !x),
                    TIMEOUT,
                    'modal backdrop is not present');
                expect(element(by.css(`div.modal${modalCssSelector}`)).isDisplayed()).toBeFalsy();
                expect(element(by.css('div.modal-backdrop.fade')).isPresent()).toBeFalsy();
            },
       }
    }

    alertContainingText(text, level='info') {
        return element(by.cssContainingText(`div.alert.alert-${level} > div`, text));
    }
}

module.exports.Page = Page;


/**
 * Login as a given user
 * If the given user is already logged in, simply loads the homepage.
 * Otherwise, logout and log back in as given user.
 *
 * @param user username to login with
 * @returns {HomePage}
 */
module.exports.login = (user) => {
    const newage = require('../nac/newage/protractor/newage.pages');    // work around circular dep
    const loginPage = new newage.LoginPage();
    const loginElements = new newage.LoginElements();
    const homePage = new newage.HomePage();

    homePage.loadNoValidate();  // Try to load homepage
    return browser.getCurrentUrl().then(url => {
        if (url.indexOf('login') != -1) {  // If url contains 'login', it means no user was logged in, and we've been redirected to login page.
            loginPage.initNoValidate();
            loginPage.usernameInput.sendKeys(browser.params.userDetails[user].username);
            loginPage.passwordInput.sendKeys(browser.params.userDetails[user].password);
            loginPage.submit.submit();

            homePage.init();
            expect(loginElements.currentUserDetails.getText()).toEqual(browser.params.userDetails[user].displayName);
            homePage.hideSideBar();
            return homePage;

        } else {
            // We are on homepage, check if we are logged in with correct user
            expect(loginElements.currentUserDetails.isPresent()).toBeTruthy();
            loginElements.currentUsername().then(username => {
                if (username == user) {
                    return homePage;
                } else {
                    module.exports.logout();

                    loginPage.load();
                    loginPage.usernameInput.sendKeys(browser.params.userDetails[user].username);
                    loginPage.passwordInput.sendKeys(browser.params.userDetails[user].password);
                    loginPage.submit.submit();

                    homePage.init();
                    expect(loginElements.currentUserDetails.getText()).toEqual(browser.params.userDetails[user].displayName);
                    expect(loginElements.currentUsername()).toEqual(user);
                    homePage.hideSideBar();
                    return homePage;
                }
            });
        }
    });
};


/**
 * Logout
 */
module.exports.logout = () => {
    const newage = require('../nac/newage/protractor/newage.pages');    // work around circular dep
    const logoutPage = new newage.LogoutPage();
    logoutPage.load();
};


//---------------------------------------------------------------------------
/**
 * Return a hash representing the current django model state in order to determine
 * whether the migrations have changed and need updating
 * (is a hash of all the migration code).
 *
 * This is not 100% accurate because it tries to avoid excessive false positives by
 * only considering files in migration directories
 */
const getModelHash = memoize(() => {
    // Use sfood to calculate python module depdendencies
    const moduleRoots = glob.sync(DJANGO_ROOT_DIR + '/*/migrations');
    const args = [
        '--internal',
        '--ignore-unused',
    ].concat(moduleRoots);
    const sfoodResult = child_process.spawnSync('sfood', args, {cwd: DJANGO_ROOT_DIR, timeout: 10000, encoding: 'utf8'});

    if (sfoodResult.status === null) {
        throw 'Could not find "sfood". Is the snakefood pip package installed?: status=' + sfoodResult.status + '. Error: "' + sfoodResult.error + '"';
    } else if (sfoodResult.status != 0) {
        throw '"sfood" did not execute correctly: status=' + sfoodResult.status + '. Error: "' + sfoodResult.error + '"';
    }

    var dependencies = {};
    for (let line of sfoodResult.stdout.split('\n')) {
        line = line.trim();
        if (!line) continue;
        let data = line
            .replace(/\(/g, '[')
            .replace(/\)/g, ']')
            .replace(/'/g, '"')
            .replace('[None, None]', '["",""]');
        data = JSON.parse(data);
        let module = data[0][0] + '/' + data[0][1];
        dependencies[module] = dependencies[module] || new Set();
        let dependency = data[1][0] + '/' + data[1][1];
        if (dependency != '/') {
            dependencies[module].add(dependency);
        }
    }

    // recursively restrict to only files that migrations are dependent on
    var filteredModules = new Set();
    const processModule = (module) => {
        if (!minimatch(module, DJANGO_ROOT_DIR + '/*/migrations') && !minimatch(module, DJANGO_ROOT_DIR + '/*/migrations/**')) {
            return;
        }
        if (filteredModules.has(module)) return;
        filteredModules.add(module);
        for (let dependency of dependencies[module]) {
            processModule(dependency);
        }
    };
    for (let module in dependencies) {
        processModule(module);
    }

    // calculate the hash of python files
    var orderedModules = Array.from(filteredModules);
    orderedModules.sort();
    const hash = crypto.createHash('sha256');
    for (let module of orderedModules) {
        if (fs.statSync(module).isDirectory()) {
            // __init__.py files show up as the parent directory so use that if we're referring to a directory
            module += '/__init__.py';
        }
        hash.update(fs.readFileSync(module));
    }

    // now add the hash of fixture files
    const fixtureFiles = glob.sync(`${DJANGO_ROOT_DIR}/*/fixtures/*.json`);
    for (let fixtureFile of fixtureFiles) {
        hash.update(fs.readFileSync(fixtureFile));
    }

    return hash.digest('hex').slice(0, 12);
});

const getDumpFile = (dump_name) => {
    const hash = getModelHash();
    const dbDumpDir = fs.realpathSync(`${__dirname}/dbdumps`);
    return `${dbDumpDir}/${hash}-${dump_name}.sql`;
};

const RESETDB_SH = `${DJANGO_ROOT_DIR}/../bin/reset-db.sh`;

/**
 * Quickly restore database contents; can be used as a function wrapper
 *  it('test case', restoreDatabase('snapshotname', () => { ... }));
 * or as a function:
 *  it('test case', () => {
 *    restoreDatabase('snapshotname');
 *  });
 *
 * @param snapshotName the name 'base' is special;
 *   will try to guess whether resetdb.sh needs to be rerun and run if needed
 * @param func function to wrap (optional)
 * @param validate whether to validate that the load succeeded (default true)
 * @returns {Function}
 */
const restoreDatabase = (snapshotName, func, validate=true) => {
    return function (...funcargs) {
        const dumpFilePath = getDumpFile(snapshotName);

        browser.call(() => {

            // 'base' is treated differently
            if (snapshotName == 'base') {
                try {
                    fs.statSync(dumpFilePath).isFile();
                } catch (err) {

                    if (err.code != 'ENOENT') throw err;
                    console.log('Resetting Database (this may take some time)');
                    // browser.asyncLog('Resetting Database (this may take some time)');
                    let proc = child_process.spawnSync(RESETDB_SH, [], {encoding: 'utf8', stdio: 'inherit'});
                    if (proc.status != 0) {
                        // Is there any way of causing protactor to abort at this point?
                        console.log('-------------------------------------------------------');
                        console.log(`FATAL ERROR: ${RESETDB_SH} for ${snapshotName} failed; everything else is invalid `)
                        console.log('-------------------------------------------------------');
                    }
                    if (validate) expect(proc.status).toBe(0, `${RESETDB_SH} return value`);

                    saveDatabase(snapshotName);

                    console.log('Done');
                }
            }
        });

        const args = [
            'mysqlquickload',
            '--dump', dumpFilePath,
        ];
        if (validate) expect(browser.call(() => fs.existsSync(dumpFilePath))).toBeTruthy(`Snapshot ${snapshotName} exists`);

        if (validate) expect(browser.call(() => child_process.spawnSync(MANAGE_PY, args).status)).toEqual(0, 'mysqlquickload return value');

        if (func) return func(...funcargs);
    };
};

/**
 * Quickly save database contents; should be used with restoreDatabase()
 *
 * This is an optimisation for development purposes.
 *
 * This should be used to be able to run a subset of tests in a known DB state for testing purposes
 * (ie if there are side effects of a test, then you can take a snapshot so that subsequent tests can be run
 * without having to rerun the original test that created the snapshot).
 *
 * @param snapshotName
 */
var savedSnapshots = {};
const saveDatabase = (snapshotName) => {
    // If the same snapshot is saved repeatedly then it defeats the point of having
    // a known snapshot; you might as well just have side effects between tests
    expect(savedSnapshots[snapshotName]).toBe(undefined, snapshotName);

    const args = [
        'mysqlquickdump',
        '--dump', getDumpFile(snapshotName),
    ];

    savedSnapshots[snapshotName] = 1;
    expect(child_process.spawnSync(MANAGE_PY, args).status).toEqual(0, 'mysqlquickdump return value');
};

module.exports.restoreDatabase = restoreDatabase;
module.exports.saveDatabase = saveDatabase;

module.exports.absoluteFilePathForUpload = path.resolve(__dirname, 'upload.txt');
