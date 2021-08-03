var app = require("./config.js");

require('lodash');
require('./apps/orders/controller')(app);

app.config(($stateProvider, $urlRouterProvider) => {

    $urlRouterProvider.otherwise("/customer");

    $stateProvider
        .state("order", {
            url: "/:orderId",
            template: require("./apps/orders/order.html"),
            controller: "OrderController",
            require: {
                default_sub_route: ['order', 'order.customer'],
            },
            resolve: {
                // This resolve is listed as a dependency in child state resolves, so that we
                // can retrieve an existing order from the url parameter if it exists
                FetchExistingOrder: (OrderService, $state, $q, $timeout, $stateParams) => {
                    let OrderId = $stateParams.orderId;
                    if (OrderId !== 'new' && isNaN(parseInt(OrderId))) {
                        $timeout(()=>{$state.go('order.customer', {orderId: 'new'});});
                        return $q.reject();
                    }
                    if (OrderId !== 'new') {
                        const succ = () => {};
                        const fail = () => {
                            OrderService.constructor();

                            // TODO: Figure out what is the correct way to invoke a state change from inside the resolve.
                            $timeout(()=>{$state.go('order.error', {error: 'There was an error while retrieving the order.', orderId: 'new'});});
                        };
                        return OrderService.retrieveOrder(OrderId).then(succ, fail);
                    }
                    OrderService.constructor();
                    return $q.resolve();
                },
            },
        })
        .state("showroom", {
            url: "/showroom",
            template: require("./apps/orders/showroom.html"),
            controller: "ShowroomController",
        })
        .state("showroom.customer", {
            url: "/customer",
            template: require("./apps/orders/showroom-customer.html"),
        })
        .state("showroom.model", {
            url: "/model",
            template: require("./apps/orders/showroom-model.html"),
            resolve: {
                Order: (OrderService, $state, $q, $timeout) => {
                    if (!OrderService.validCustomer()) {
                        $timeout(() => { $state.go('showroom.customer'); });
                        return $q.reject();
                    }
                    return OrderService;
                }
            },
        })
        .state("showroom.series", {
            url: "/series",
            template: require("./apps/orders/showroom-series.html"),
            resolve: {
                Order: (OrderService, $state, $q, $timeout) => {
                    if (!OrderService.validModel()) {
                        $timeout(() => { $state.go('showroom.model'); });
                        return $q.reject();
                    }
                    return OrderService;
                }
            },
        })
        .state("showroom.seriesphotos", {
            url: "/series-photos",
            template: require("./apps/orders/showroom-series-photos.html"),
            resolve: {
                Order: (OrderService, $state, $q, $timeout) => {
                    if (!OrderService.validSeries()) {
                        $timeout(() => { $state.go('showroom.series'); });
                        return $q.reject();
                    }
                    return OrderService;
                }
            },
        })
        .state("order.error", {
            url: "/error",
            template: require("./apps/orders/error.html"),
            params: {
                error: '',
            },
            controller: ($scope, $stateParams) => {
                $scope.params = $stateParams;
            },
        })
        .state("order.manage", {
            url: "/manage/:orderId",
            controller: ($scope) => {
                if ($scope.order.model) {
                    $scope.onModelSelect();
                }
                if ($scope.order.series) {
                    $scope.onSeriesSelect();
                }
            },
            resolve: {
                Order: (FetchExistingOrder, OrderService, $state, $q, $timeout, $stateParams) => {
                    const success = () => {
                        OrderService.base_order = parseInt($stateParams.orderId);
                        $timeout(() => { $state.go('order.customer'); });
                    };
                    const failure = () => {
                        $timeout(() => { $state.go('order.error', {
                            error: 'There was an error while retrieving the order.'
                        }); });
                        return $q.reject();
                    };
                    return OrderService.retrieveOrder($stateParams.orderId).then(success, failure);
                }
            },
        })
        .state("order.customer", {
            url: "/customer/:customerId",
            template: require("./apps/orders/customer-details.html"),
            params: { customerId: '' },
        })
        .state("order.caravan", {
            url: "/caravan",
            template: require("./apps/orders/caravan-details.html"),
            controller: "OrderCaravanController",
            require: {
                default_sub_route: ['order.caravan', 'order.caravan.features'],
            },
            resolve: {
                Order: (FetchExistingOrder, OrderService, $state, $q, $timeout, $stateParams) => {
                    if (!OrderService.validCustomer()) {
                        let orderId = OrderService.id || $stateParams.orderId;
                        $timeout(() => { $state.go('order.customer', {orderId: orderId}); });
                        return $q.reject();
                    }
                    return OrderService;
                },
            },
        })
        .state("order.caravan.modelseries", {
            url: "/model-and-series",
            template: require("./apps/orders/model-and-series.html"),
        })
        .state("order.caravan.weightsize", {
            url: "/weight-and-size",
            template: require("./apps/orders/weight-and-size.html"),
            resolve: {
                Order: (FetchExistingOrder, OrderService, $state, $q, $timeout) => {
                    if (!OrderService.validModelSeries()) {
                        $timeout(() => { $state.go('order.caravan.modelseries', {orderId: OrderService.id}); });
                        return $q.reject();
                    }
                    return OrderService;
                }
            },
        })
        .state("order.caravan.features", {
            url: "/features",
            template: require("./apps/orders/features.html"),
            resolve: {
                Order: (FetchExistingOrder, OrderService, $state, $q, $timeout) => {
                    if (!OrderService.validModelSeries()) {
                        $timeout(() => { $state.go('order.caravan.modelseries', {orderId: OrderService.id}); });
                        return $q.reject();
                    }
                    return OrderService;
                }
            },
        })
        .state("order.caravan.resources", {
            url: "/resources",
            template: require("./apps/orders/resources.html"),
        })
        .state("order.status", {
            url: "/status",
            template: require("./apps/orders/status.html"),
            controller: "OrderStatusController",
            resolve: {
                Order: (FetchExistingOrder, OrderService, $state, $q, $timeout) => {
                    if (!OrderService.validModelSeries()) {
                        $timeout(() => { $state.go('order.caravan.modelseries', {orderId: OrderService.id}); });
                        return $q.reject();
                    }
                    return OrderService;
                }
            },
        })
        .state("order.special_features", {
            url: "/special_features",
            template: require("./apps/orders/special_features.html"),
        })
        .state("order.order_certificates", {
            url: "/order_certificates",
            template: require("./apps/orders/order_certificates.html"),
            controller: "OrderStatusController",
        })

        // Removed on 2016-08-29
        //.state("order.production", {
        //    url: "/production",
        //    template: require("./apps/orders/production.html"),
        //})
});
