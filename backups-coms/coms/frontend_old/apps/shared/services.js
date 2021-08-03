export default app => {

    require('./services/ApiService')(app);
    require('./services/StateChangeAdvancedService')(app);
    require('./services/AppSettings')(app);
    require('./services/TestSettings')(app);
    require('./services/DateProvider')(app);
};
