export default app => {

    app.controller('AllUOMController', function ($scope, $http, ApiService) {

        $scope.post = (data) => {
            return ApiService.post('uom/', data);
        };

        $scope.table_object = null;

        let serverData = () => ({
            type: 'all',
            search: $scope.search.text,
        });

        $scope.ajax_config = {
            url: '/api/uom/',
            data: serverData,
            dataSrc: 'list',
            columns: [
                {data: 'name', title: 'Name'},
            ]
        };

        $scope.table_config = {
            oLanguage: {
                sLoadingRecords: '<img src="/static/newage/images/rolling.gif">'
            },
            bFilter: false,
            bLengthChange: false,
            columnDefs: [{
                targets: -1,
                data: null,
                defaultContent: "<button class='btn btn-default'>Manage</button>"
            }]
        };

        $scope.search = () => {
            $scope.table_object.ajax.reload();
        };

    });
}