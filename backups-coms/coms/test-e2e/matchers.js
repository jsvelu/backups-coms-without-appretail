import * as _ from 'lodash';

import * as common from './common';

// -------------------------------------------------------------------------------
// Browser matchers

// The 1.x interface was simpler;
// this is a wrapper based on https://jasmine.github.io/2.0/upgrading.html#section-Custom_Matchers
// comparisonFn should return a bool
// parameters to comparisonFn are
//  actual, expected, [util, [customEqualityTesters]]
var simpleMatcher = (comparisonFn) => {
    return (util, customEqualityTesters) => {
        return {
            compare: (actual, expected) => {
                return {
                    pass: comparisonFn(actual, expected, util, customEqualityTesters),
                };
            },
        };
    };
};

// -------------------------------------------------------------------------------
// String / regex matchers

/**
 * Checks that the path part of a URL matches a given regex or string
 * @param expected regex or string
 * @returns {boolean}
 */
module.exports.toEqualUrlPath = simpleMatcher((actual, expected) => {
    return common.isUrlPathMatch(actual, expected);
});

/**
 * Checks that the path & query part of a URL matches a given regex or string
 * @returns {boolean}
 */
module.exports.toEqualUrlPathQuery = simpleMatcher((actual, expected) => {
    return common.isUrlPathQueryMatch(actual, expected);
});

/**
 * Checks that the hash part of a URL matches a given regex or string
 * @param expected regex or string
 * @returns {boolean}
 */
module.exports.toEqualUrlHash = simpleMatcher((actual, expected) => {
    return common.isUrlHashMatch(actual, expected);
});

/**
 * Like toContain(), but case insensitive
 * @param string to search for
 * @returns {boolean}
 */
module.exports.toContainInsensitive = function(actual, expected) {
    // Escape any regex special characters that slipped in
    expected = expected.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return (actual.search(new RegExp(expected, "i")) > -1);
};

/**
 * Checks that a value is a string
 * @param value
 * @returns {boolean}
 */
module.exports.toBeString = function(actual) {
    return _.isString(actual);
};

// -------------------------------------------------------------------------------
// Numeric matchers

/**
 * Checks whether a value has been incremented by one compared to the original
 * @param original number
 * @returns {boolean}
 */
module.exports.toFollow = function(actual, original) {
    if (typeof(original) == 'string') original = parseInt(original);
    if (typeof(actual) == 'string')   actual = parseInt(actual);
    return (original + 1) == actual;
};


/**
 * Like toBeLessThan(), but using numeric ordering (so '6' < '30')
 * @param number to be less than
 * @returns {boolean}
 */
module.exports.toBeLessThanNumeric = function(actual, target) {
    if (typeof(target) == 'string') target = parseFloat(target);
    if (typeof(actual) == 'string') actual = parseFloat(actual);
    return actual < target;
};

/**
 * Like toBeGreaterThan(), but using numeric ordering (so '30' > '6')
 * @param number to be less than
 * @returns {boolean}
 */
module.exports.toBeGreaterThanNumeric = function(actual, target) {
    if (typeof(target) == 'string') target = parseFloat(target);
    if (typeof(actual) == 'string') actual = parseFloat(actual);
    return actual > target;
};

/**
 * Like toEqual(), but using numeric ordering (so '06' == '6')
 * @param number to be less than
 * @returns {boolean}
 */
module.exports.toEqualNumeric = function(actual, target) {
    if (typeof(target) == 'string') target = parseFloat(target);
    if (typeof(actual) == 'string') actual = parseFloat(actual);
    return actual == target;
};