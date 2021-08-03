import _ from 'lodash';

export default app => {
    // Not a regular service/value: must be available in app.config() phase
    app.constant('TestSettings', window.__TEST_SETTINGS);
};

