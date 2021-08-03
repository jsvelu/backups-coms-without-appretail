export default app => {

    app.directive('qualityTopBar', function () {
        return {
            restrict: 'E',
            transclude: true,
            template: require('./partials/quality-top-bar.html'),
        };
    });
}