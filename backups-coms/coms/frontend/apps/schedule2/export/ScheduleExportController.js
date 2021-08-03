import _ from 'lodash';

export default app => {

    require('./ScheduleExportApiService')(app);

    app.controller('ScheduleExportController', function (
        $filter,
        $rootScope,
        $scope,
        AppSettings,
        ScheduleExportApiService
    ) {

        $scope.successMessages = [];
        $scope.errorMessages = [];

        $scope.monthList = [];

        $scope.exportScheduleCSV = {
            invalidDates: false,
            dateFrom: null,
            dateTo: null,
        };

        // $scope.exportScheduleCSV1 = {
        //     invalidDates: false,
        //     dateFrom: null,
        //     dateTo: null,
        // };

        // $scope.exportScheduleCSV2 = {
        //     invalidDates: false,
        //     dateFrom: null,
        //     dateTo: null,
        // };

        // $scope.exportScheduleCSV3 = {
        //     invalidDates: false,
        //     dateFrom: null,
        //     dateTo: null,
        // };

        // $scope.exportScheduleCSV4 = {
        //     invalidDates: false,
        //     dateFrom: null,
        //     dateTo: null,
        // };

        // $scope.exportScheduleCSV5 = {
        //     invalidDates: false,
        //     dateFrom: null,
        //     dateTo: null,
        // };

        $scope.contractorExports = {
            list: [],
            invalidDates: false,
            dateFrom: null,
            dateTo: null,
        };

        var initMonthPicker = function() {
            [
                '#exportScheduleCSV_dateFrom',
                '#exportScheduleCSV_dateTo',
                '#exportScheduleCSV1_dateFrom',
                // '#exportScheduleCSV1_dateTo',
                // '#exportScheduleCSV2_dateFrom',
                // '#exportScheduleCSV2_dateTo',
                // '#exportScheduleCSV3_dateFrom',
                // '#exportScheduleCSV3_dateTo',
                // '#exportScheduleCSV4_dateFrom',
                // '#exportScheduleCSV4_dateTo',
                // '#exportScheduleCSV5_dateFrom',
                // '#exportScheduleCSV5_dateTo',
                '#contractorExports_dateFrom',
                '#contractorExports_dateTo',
            ].forEach(function(id){
                $(id+'_shown').MonthPicker({ Button: false, MonthFormat: 'M yy', SelectedMonth: 0, AltFormat: "yy-mm-dd", AltField: id,
                    OnAfterMenuClose: function() {$(id).trigger('input');}
                });
            });
        };
        // use of ng-repeat interferes w/ monthpicker - we'll have to delay init or the contractor part will fail.
        setTimeout(initMonthPicker, 1500);

        ScheduleExportApiService.getInitialData().then((data) => {

            if ($scope.monthList.length == 0) {
                for (const month_str of data.month_list) {
                    const month = new Date(Date.parse(month_str));
                    $scope.monthList.push(
                        {
                            title: $filter('date')(month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS),
                            value: month,
                        }
                    );

                    if (isCurrentMonth(month)) {
                        $scope.exportScheduleCSV.dateFrom = $scope.exportScheduleCSV.dateTo = month;
                        // $scope.exportScheduleCSV1.dateFrom = $scope.exportScheduleCSV1.dateTo = month;
                        // $scope.exportScheduleCSV2.dateFrom = $scope.exportScheduleCSV2.dateTo = month;
                        // $scope.exportScheduleCSV3.dateFrom = $scope.exportScheduleCSV3.dateTo = month;
                        // $scope.exportScheduleCSV4.dateFrom = $scope.exportScheduleCSV4.dateTo = month;
                        // $scope.exportScheduleCSV5.dateFrom = $scope.exportScheduleCSV5.dateTo = month;
                        $scope.contractorExports.dateFrom = $scope.contractorExports.dateTo = month;
                    }
                }
            }

            $rootScope.permissions = data.permissions;
            $scope.dealers = data.dealer;
            $scope.contractorExports.list = data.contractor_exports;
        });

        $scope.validateDates = (exp) => {
            exp.invalidDates = exp.dateFrom > exp.dateTo;
        };

        const isCurrentMonth = (month) => {
            let today = new Date();
            return today.getFullYear() == month.getFullYear() && today.getMonth() == month.getMonth()
        };
    });
}
