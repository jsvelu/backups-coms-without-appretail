import _ from 'lodash';

export default app => {
    // Not a regular service/value: must be available in app.config() phase
    app.constant('AppSettings', window.__APP_SETTINGS);
};

