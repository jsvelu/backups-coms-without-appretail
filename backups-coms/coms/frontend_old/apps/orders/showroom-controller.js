export default app => {
    app.controller('ShowroomController', function (
        $filter,
        $scope,
        $state,
        $timeout,
        ApiService,
        AppSettings,
        OrderService
    ) {

        require("./style.scss");

        $scope.order = OrderService;

        //update help content reference if needed since the baseURI is not available in the django views, and it shows
        //order help in showroom pages

        if (window.location.href.indexOf('showroom') > -1) {
            $("#lnk_help").attr('href', '/help/showroom');
        }
        //*** end update help content reference

        $scope.post = (endpoint, data) => {
            return ApiService.post('orders/' + endpoint, data);
        };

        if ($state.current.name === 'showroom') {
            $state.go("showroom.splash");
        }

        $scope.createQuote = () => {
            $state.go("showroom.customer");
        };

        $scope.current = {
            model: null,
            series: null,
            slider: 0,
        };

        $scope.choices = {
            models: [],
            series: [],
            states: [],
            referrals: [],
            dealerships: [],
        };

        $scope.info = {
            model_detail: null,
            series_detail: null,
        };

        $scope.modal = {
            photo: null,
            plan_view: false,
        };

        $scope.errors = {
            series_select: null,
        };

        $scope.editCurrentCustomer = false;

        $scope.post('showroom-data').then(r => {
            $scope.choices.model_series = r.data.models;
            $scope.choices.states = r.data.states;
            $scope.choices.acquisition_source = r.data.acquisition_source;
            $scope.choices.source_of_awareness = r.data.source_of_awareness;
            $scope.choices.shows = r.data.shows;
            $scope.choices.dealerships = r.data.dealerships;

            $scope.choices.available_delivery_months = [];
            for (var delivery_month_str of r.data.available_delivery_months) {
                var delivery_month = new Date(Date.parse(delivery_month_str));
                $scope.choices.available_delivery_months.push(
                    {
                        title: $filter('date')(delivery_month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS),
                        value: delivery_month,
                    }
                );

                // If this delivery month is the order's delivery month, then set the order delivery month to this object so that Angular can match it when comparing objects by references
                if ($scope.order.delivery_date && $scope.order.delivery_date.getTime() == delivery_month.getTime()) {
                    $scope.order.delivery_date = delivery_month;
                }
            }

            // Pre-select dealership, if only associated with one dealership
            if ($scope.choices.dealerships.length == 1) {
                $scope.order.dealership = $scope.choices.dealerships[0].id;
            }
        });

        $scope.customerProceed = (form) => {
            if (form && form.$valid) {
                $scope.order.order_type = 'Customer';
                $scope.choices.series = [];
                $state.go("showroom.model");
            }
        };

        $scope.onModelClick = (model) => {
            $scope.current.model = model;
            $scope.order.model = model.id;
            $state.go("showroom.series");
        };

        $scope.selectSeries = (series) => {
            $scope.current.series = series;
            $scope.order.series = series.id;
        };

        $scope.onViewSeriesPhotoClick = (series) => {
            $scope.selectSeries(series);
            $state.go("showroom.seriesphotos");
        };

        $scope.onStartQuoteClick = (series) => {
            $scope.selectSeries(series);
            $scope.onSeriesSelect();
        };

        $scope.onSeriesSelect = () => {
            $scope.errors.series_select = null;
            const success = r => {
                $timeout(() => {$state.go("order.caravan.features", {orderId:r.data.id});});
            };
            const failure = r => {
                if (r.status == 400) {
                    $scope.errors.series_select = r.data;
                } else {
                    $scope.errors.series_select = "An unexpected error has occurred";
                }
            };
            OrderService.saveOrder().then(success, failure);
        };

        $scope.select_physical_suburb = (suburb) => {
            $scope.order.customer.physical_address.suburb = suburb;
        };

        $scope.select_customer = (customer) => {
            $scope.order.customer = customer;
        };

        $scope.clearCustomer = () => {
            $scope.order.resetCustomer();
            $scope.search = {};
        };

        $scope.editCustomerFields = () => {
            $scope.editCurrentCustomer = true;
        };

        $scope.hasModelAvailableSeries = (model) => {
            let available_series = model.series.filter($scope.isSeriesAvailableForDealership);
            return available_series.length;
        };

        $scope.isSeriesAvailableForDealership = (series) => {
            return series.dealerships.indexOf($scope.order.dealership) != -1;
        };
    });
};
