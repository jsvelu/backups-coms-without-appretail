export default app => {

    app.filter('hasKeys', () => {
        return (input) => input && Object.keys(input).length;
    });

    app.filter('trustHTML', function($sce) {
        return (val) => $sce.trustAsHtml(val);
    });
};
