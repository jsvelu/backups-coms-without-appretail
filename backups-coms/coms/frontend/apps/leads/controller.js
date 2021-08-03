export default app => {

    app.controller('LeadsController', function ($scope, $timeout, ApiService, Upload) {

        $scope.data = {
            all_leads: []
        };

        $scope.post = (data) => {
            return ApiService.post('leads/', data);
        };

        $scope.leads_table_config = {
            url: '/api/leads/',
            data: {type: 'all_leads'},
            dataSrc: 'list',
            columns: [
                {data: 'name', title: 'Name'},
                {data: 'post_code', title: 'Post Code'},
                {data: 'state', title: 'State'},
                {data: 'created', title: 'Created'},
            ]
        };

        let statsServerData = (type) => {
            return () => {
                let data = {
                    type: type,
                };
                if ($scope.data.from_date) {
                    data['from'] = $scope.data.from_date.toISOString();
                }
                if ($scope.data.to_date) {
                    data['to'] = $scope.data.to_date.toISOString();
                }
                return data;
            }
        };

        $scope.leads_stats_config = {
            url: '/api/leads-register/',
            data: statsServerData('lead_stats'),
            dataSrc: 'data.dealerships',
            columns: [
                {title: 'Name', data: 'name'},
                {title: 'Total', data: 'total'},
                {title: 'Won', data: (row, type, set, meta) => row.won + ' (' + row['won_%'] + '%)'},
                {title: 'Lost', data: (row, type, set, meta) => row.lost + ' (' + row['lost_%'] + '%)'},
                {title: 'Open', data: (row, type, set, meta) => row.open + ' (' + row['open_%'] + '%)'},
                {title: 'Working', data: (row, type, set, meta) => row.working + ' (' + row['working_%'] + '%)'},
            ]
        };

        $scope.advert_stats_config = {
            url: '/api/leads-register/',
            data: statsServerData('lead_stats'),
            dataSrc: 'data.sources',
            columns: [
                {title: 'Name', data: 'name'},
                {title: 'Total', data: 'total'},
                {title: 'Won', data: (row, type, set, meta) => row.won + ' (' + row['won_%'] + '%)'},
                {title: 'Lost', data: (row, type, set, meta) => row.lost + ' (' + row['lost_%'] + '%)'},
                {title: 'Open', data: (row, type, set, meta) => row.open + ' (' + row['open_%'] + '%)'},
                {title: 'Working', data: (row, type, set, meta) => row.working + ' (' + row['working_%'] + '%)'},
            ]
        };

        $scope.charts = {
            leadsByDealership: {
                type: "PieChart",
                displayed: true,
                data: {
                    cols: [
                        {
                            id: "dealership",
                            label: "Dealership",
                            type: "string",
                            p: {}
                        },
                        {
                            id: "leads",
                            label: "Leads",
                            type: "number",
                            p: {}
                        },
                    ],
                    rows: []
                },
                options: {
                    title: "Leads by Dealership",
                    fill: 20,
                    displayExactValues: true,
                    is3D: true,
                    chartArea: {
                        width: '90%',
                        height: '90%',
                    },
                },
            },

            advertising: {
                type: "PieChart",
                displayed: true,
                data: {
                    cols: [
                        {
                            id: "source",
                            label: "Source",
                            type: "string",
                            p: {}
                        },
                        {
                            id: "leads",
                            label: "Leads",
                            type: "number",
                            p: {}
                        },
                    ],
                    rows: []
                },
                options: {
                    title: "Leads by Source",
                    fill: 20,
                    displayExactValues: true,
                    is3D: true,
                    chartArea: {
                        width: '90%',
                        height: '90%',
                    },
                },
            }
        };

        $scope.onFilterDates = () => {
            $scope.data.leads_stats.ajax.reload();
            $scope.data.advert_stats.ajax.reload();
        };

        $scope.onUpdateLeadsChart = leadsData => {
            $scope.charts.leadsByDealership.data.rows = [];
                for(let k = 0; k < leadsData.length; k++) {
                    $scope.charts.leadsByDealership.data.rows.push({
                        c: [{v: leadsData[k].name}, {v: leadsData[k].total}]
                    });
                }
        };

        $scope.onUpdateAdvertChart = adsData => {
            $scope.charts.advertising.data.rows = [];
                for(let k = 0; k < adsData.length; k++) {
                    $scope.charts.advertising.data.rows.push({
                        c: [{v: adsData[k].name}, {v: adsData[k].total}]
                    });
                }
        };

        $scope.onLeadsTableDraw = table => {
            $scope.$apply($scope.onUpdateLeadsChart(table.ajax.json().data.dealerships));
        };

        $scope.onAdvertTableDraw = table => {
            $scope.$apply($scope.onUpdateAdvertChart(table.ajax.json().data.sources));
        };
    });
};
