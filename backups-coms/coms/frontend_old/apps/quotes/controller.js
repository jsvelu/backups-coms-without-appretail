export default app => {

    app.controller('QuotesController', function ($scope, $http, ApiService) {

        require("./style.scss");

        $scope.post = (data) => {
            return ApiService.post('quotes/', data);
        };

        $scope.table_object = null;
        $scope.customer_type = 'Customer';
        $scope.choices = {};
        $scope.customer_form = {};

        $scope.order = {
            physical_add: {
                owner: '',
                street: '',
                postcode: '',
                state: '',
                suburb: ''
            },
            delivery_add: {
                name: '',
                street: '',
                postcode: '',
                state: '',
                suburb: ''
            },
            invoice_add: {
                name: '',
                street: '',
                postcode: '',
                state: '',
                suburb: ''
            },
            customer: {
                partner_name: ''
            }
        };

        $scope.order.desired_dd_day = 1;
        $scope.order.desired_dd_month = 2;
        $scope.order.desired_dd_year = 2016;

        $scope.days = [];
        $scope.months = [];
        $scope.years = [];

        let now = new Date();
        for(let i = 1; i <= 31; i++) {
            $scope.days.push(i);
        }
        const month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug','Sep','Oct','Nov','Dec'];
        for(let i = 0; i < 12; i++) {
            $scope.months.push([i, month_names[i]]);
        }
        for(let i = 0; i <= 20; i++) {
            $scope.years.push(now.getFullYear() + i);
        }

        $scope.post({
            type: 'get_new_pre_data'
        }).then(function(r) {
            $scope.choices.dealerships = r.data.list.dealers;
            $scope.choices.states = r.data.list.states;
        });

        let serverData = () => ({
            type: 'get_list',
            search: $scope.search_id,
        });

        $scope.ajax_config = {
            url: '/api/quotes/',
            data: serverData,
            dataSrc: 'list',
            columns: [
                {data: 'created', title: 'Date Created'},
                {data: 'quote_type', title: 'Type'},
                {data: 'quoted_for', title: 'Quoted For'},
                {data: 'series', title: 'Series'},
                {data: 'sales_person', title: 'Sales Person'},
                {data: 'retail_price', title: '$ Retail Sale Price'},
                {data: '', title: ''},
            ]
        };

        $scope.table_config = {
            oLanguage: {
                sLoadingRecords: '<img src="/static/newage/images/rolling.gif">'
            },
            bFilter: false,
            bLengthChange: false,
            columnDefs: [
                {
                targets: -1,
                data: 'id',
                render: function ( data, type, full, meta ) {
                  return '<a class="btn btn-default" href="edit_quote?id=' + full.id + '">Manage</a>';
                }
            } ]
        };

        $scope.search = (quote) => {
            $scope.search_id = quote.id;
            $scope.table_object.ajax.reload();
        };

        $scope.select_physical_suburb = (suburb) => {
            $scope.order.physical_add.suburb = suburb.suburb;
            $scope.order.physical_add.postcode = suburb.postcode;
            $scope.order.physical_add.state = suburb.state_id;
        };

        $scope.select_delivery_suburb = (suburb) => {
            $scope.order.delivery_add.suburb = suburb.suburb;
            $scope.order.delivery_add.postcode = suburb.postcode;
            $scope.order.delivery_add.state = suburb.state_id;
        };

        $scope.select_invoice_suburb = (suburb) => {
            $scope.order.invoice_add.suburb = suburb.suburb;
            $scope.order.invoice_add.postcode = suburb.postcode;
            $scope.order.invoice_add.state = suburb.state_id;
        };

        $scope.add_customer_quote = (form) => {
            if (form.$valid) {
                $scope.post({
                    type: 'add_customer_quote',
                    data: $scope.order
                }).then(function (r) {
                    if (r.data.result === 'fail')
                    {
                        $scope.order.insert_successful_message = '';
                        $scope.order.insert_failed_message = r.data.message;
                    }
                    else
                    {
                        $scope.order.insert_failed_message = '';
                        $scope.order.insert_successful_message = r.data.message;
                    }
                });
            }
        };

    });
}