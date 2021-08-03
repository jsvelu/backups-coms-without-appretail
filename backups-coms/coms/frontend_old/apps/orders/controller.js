import * as ruleUtils from './rules.js';

export default app => {

    require('./showroom-controller')(app);
    require('./caravan-controller')(app);
    require('./status-controller')(app);
    require('./services/OrderService')(app);
    require('./services/OrderApiService')(app);

    app.controller('OrderController', function(
        $anchorScroll,
        $filter,
        $http,
        $interval,
        $location,
        $log,
        $q,
        $rootScope,
        $sce,
        $scope,
        $state,
        $timeout,
        $window,
        ApiService,
        AppSettings,
        OrderApiService,
        OrderService
    ) {

        require("./style.scss");

        // Define tabs structure
        $scope.tabData = [{
                heading: 'Customer Details',
                route: 'order.customer',
            },
            {
                heading: 'Caravan Details',
                route: 'order.caravan',
            },
            {
                heading: 'Status / Documents / History',
                route: 'order.status',
            },
            {
                heading: 'Special Features',
                route: 'order.special_features',
            },
             {
                heading: 'Certificates ',
                route: 'order.order_certificates',
            },
        ];

        $scope.choices = {
            departments: [],
            dealerships: [],
            models: [],
            states: [],
            series: {},
            delivery_min_date: new Date(),
        };

        $scope.info = {
            series_detail: {},
            show_price: true,
            rules: {
                item_description: '',
                item_rules: []
            },
        };

        $scope.chassis_lookup = {
            loading: false,
            no_results: false
        };

        $scope.loading = {
            items: false,
            extras: false,
            order: false,
        };

        $scope.GST_PERCENT = 0.1;
        $scope.cango = true;
        $scope.stock = 0;
        $scope.order = OrderService;
        $scope.messages = $sce.trustAsHtml(require("./messages.html"));

        $scope.editCurrentCustomer = false;

        $rootScope.$on('$stateChangeStart', () => {
            $rootScope.message = null;
        });

        $scope.post = (endpoint, data) => {
            return ApiService.post('orders/' + endpoint, data);
        };

        const reassignDeliveryDate = () => {
            if (!$scope.order.delivery_date) {
                return;
            }

            // Need to go through the list of available delivery month and affect the $scope.order.delivery_date to the matching object of the list so that Angular can find it when comparing objects by references
            for (let delivery_month_obj of $scope.choices.available_delivery_months) {

                let delivery_month = delivery_month_obj.value;

                if ($scope.order.delivery_date.getTime() == delivery_month.getTime()) {
                    $scope.order.delivery_date = delivery_month;
                    break;
                }
            }
        };

        const reassignSpecialFeaturesCategories = () => {
            // Need to do this at initialisation as special features only have 1 category field, which can be either a Category or a Department.
            // The ng-model used to track the selected values are 'selectedCategory' and 'selectedDepartment'

            // Create maps of category_id => category_object for fast lookup
            const categoryMap = {};
            const departmentMap = {};

            for (let categoryObj of $scope.choices.categories) {
                categoryMap[categoryObj.id] = categoryObj;
                for (let departmentObj of categoryObj.departments) {
                    departmentMap[departmentObj.id] = {
                        department: departmentObj,
                        parent: categoryObj,
                    };
                }
            }

            for (let special_feature of $scope.order.special_features) {
                if (!special_feature.sku_category) {
                    continue;
                }
                const category = categoryMap[special_feature.sku_category];
                if (category) {
                    special_feature.selectedCategory = category;
                }

                const departmentLookup = departmentMap[special_feature.sku_category];
                if (departmentLookup) {
                    special_feature.selectedDepartment = departmentLookup.department;
                    special_feature.selectedCategory = departmentLookup.parent;
                }

                $scope.onSpecialFeatureCategorySelect(special_feature);
                $scope.onSpecialFeatureDepartmentSelect(special_feature);
            }
        };

        const reassignData = () => {
            // Process multiple data reassignment required so that Angular can find the objects when comparing (as Angular compares by reference and not by value)
            reassignDeliveryDate();
            reassignSpecialFeaturesCategories();
        };

        // Load initial data
        $scope.post('initial-data', {
            order_id: $scope.order.id,
            dealership_id: $scope.order.dealership,
            customer_id: $state.params.customerId
        }).then(r => {
            $scope.choices.dealerships = r.data.dealerships;
            $scope.choices.categories = r.data.categories;
            $scope.choices.models = r.data.models;
            $scope.choices.states = r.data.states;
            $scope.choices.acquisition_source = r.data.acquisition_source;
            $scope.choices.source_of_awareness = r.data.source_of_awareness;
            $scope.choices.shows = r.data.shows;
            $scope.permissions = r.data.permissions;

            $scope.choices.available_delivery_months = [];

            let monthList = r.data.available_delivery_months;
            if ($scope.permissions.manual_override) {
                monthList = r.data.all_delivery_months;
            }

            for (let delivery_month_str of monthList) {
                let delivery_month = new Date(Date.parse(delivery_month_str));
                let available = r.data.available_delivery_months.indexOf(delivery_month_str) != -1;
                $scope.choices.available_delivery_months.push({
                    title: $filter('date')(delivery_month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS) + (available ? '' : ' *'),
                    value: delivery_month,
                });
            }

            reassignData();
            if ($scope.permissions.create_order == false && $scope.permissions.view_order == false) {
                $window.location.href = '/orders/list';
            }

            // Removed on 2016-08-29
            //if ($scope.permissions.view_production_data) {
            //    $scope.tabData.push(
            //        {
            //            heading: 'Production',
            //            route: 'order.production',
            //            active: $state.current.name === 'order.production',
            //        }
            //    );
            //}

            // Pre-select dealership, if only associated with one dealership
            if ($scope.choices.dealerships.length == 1) {
                $scope.order.dealership = $scope.choices.dealerships[0].id;
            }

            if (r.data.customer_info) {
                $scope.select_customer(r.data.customer_info);
            }

            $scope.$watch('order.special_features', (newVal, oldVal) => {
                if (!angular.equals(newVal, oldVal)) {
                    $scope.order.special_features_changed = true;
                }
            }, true);
        });

        $scope.lookupChassis = (text) => {
            $scope.chassis_lookup.loading = true;
            $scope.chassis_lookup.no_results = false;
            return $scope.post('chassis-lookup', {
                chassis_string: text
            }).then(r => {
                if (r.data.list.length) {
                    return r.data.list;
                } else {
                    $scope.chassis_lookup.no_results = true;
                }
            });
        };

        $scope.onChassisSelect = () => {
            $scope.post('from-chassis', {
                order_id: $scope.data.from_chassis
            }).then(r => {
                $scope.order.series = r.data.data.series;
                $scope.order.model = r.data.data.model;
                $scope.onModelSelect();
                $scope.onSeriesSelect();
            });
        };

        const confirmSeriesChangeMessage = 'This will reset the details of the order. Are you sure you want to continue?';
        $scope.isModelEditable = () => {
            // cant change model/series once order's finalized or placed
            if (['ORDER_FINALIZED', 'ORDER'].indexOf($scope.order.order_stage_details.code) != -1) {
                return false;
            }
            return $scope.order.isEditable();
        }
        $scope.onModelChange = () => {
            if (!$scope.order.model || confirm(confirmSeriesChangeMessage)) {
                $scope.order.model = $scope.order.modelSelection;
                $scope.order.series = null;
                $scope.order.resetOrderItems();
                $scope.onModelSelect();
            } else {
                $scope.order.modelSelection = $scope.order.model;
            }
        };
        $scope.onModelSelect = () => {
            if (!$scope.order.model) {
                $scope.choices.series = [];
                return;
            }
            $scope.post('model-series', {
                model_id: $scope.order.model,
                dealership_id: $scope.order.dealership,
            }).then(r => {
                $scope.choices.series = r.data.series;
                $scope.info.model_detail = r.data.model_detail;
            });
        };
        
        $scope.onSeriesChange = () => {
            if (!$scope.order.series || confirm(confirmSeriesChangeMessage)) {
                $scope.order.series = $scope.order.seriesSelection;
                $scope.order.resetOrderItems();

                $scope.onSeriesSelect();

            } else {
                $scope.order.seriesSelection = $scope.order.series;
            }
            $scope.calculatePrice();
        };

        //post /api/orders/production-unit

        $scope.onSeriesSelect = () => {
             
            if (!$scope.order.series) {
                $scope.choices.available_delivery_months = [];
                $scope.choices.available_delivery_months = [];
                return;
            }
            $scope.post('series-detail', {
                series_id: $scope.order.series,
                order_id: $scope.order.id,
            }).then(r => {
                $scope.info.series_detail = r.data;
                $scope.specials = $scope.info.series_detail.show_specials;

                $scope.all_delivery_months = $scope.info.series_detail.all_delivery_months;
                let monthList1 = $scope.all_delivery_months;
                $scope.available_delivery_months = $scope.info.series_detail.available_delivery_months;
                let monthList = $scope.available_delivery_months;

                $scope.avg_tare_weight = $scope.info.series_detail.avg_tare_weight;
                $scope.avg_ball_weight = $scope.info.series_detail.avg_ball_weight;
                
                $scope.permissions = $scope.info.series_detail.permissions;
                //$scope.all_delivery_months = $scope.info.series_detail.all_deliv0ery_months;
                // console.log(monthList1);
                // console.log('Hello');
                // console.log(monthList);

                $scope.choices.available_delivery_months = [];

                
                if ($scope.permissions.manual_override) {
                    monthList = r.data.all_delivery_months;
                }
                

            for (let delivery_month_str of monthList) {
                let delivery_month = new Date(Date.parse(delivery_month_str));
                let available = r.data.available_delivery_months.indexOf(delivery_month_str) != -1;
                $scope.choices.available_delivery_months.push({
                    title: $filter('date')(delivery_month, AppSettings.FORMAT_DATE_MONTH_SHORT_JS) + (available ? '' : ' *'),
                    value: delivery_month,
                });
            }
                // console.log('Welcome');
                // console.log($scope.choices.available_delivery_months);
                // console.log($scope.$scope.all_delivery_months );
                
                 
                $scope.onDeliveryChange(); 
                $scope.loadFeatures();
                $scope.calculatePrice();
                // console.log('Specials');
                // console.log($scope.specials);
            });
        };

        $scope.orderLookupData = () => {
            return {
                dealership: $scope.order.dealership,
            };
        };

        
        $scope.onDeliveryChange = () => {
            // alert('Delivery Date Selected');
            if(!$scope.order.delivery_date)
            {
                return;
            }
         // Need to go through the list of available delivery month and affect the $scope.order.delivery_date to the matching object of the list so that Angular can find it when comparing objects by references
            for (let delivery_month_obj of $scope.choices.available_delivery_months) {

                let delivery_month = delivery_month_obj.value;

                if ($scope.order.delivery_date.getTime() == delivery_month.getTime()) {
                    $scope.order.delivery_date = delivery_month;
                    break;
                }
            }
            
        };

        $scope.onOrderLookupSelect  = (item) => {
            $scope.orderLookupResultId = item.id;
        };

        $scope.assignSelectedOrderAndProceed = () => {
            $scope.order.loadOrderDetails_duplicate($scope.orderLookupResultId, false).then(
                () => {
                    OrderService.saveOrder().then(
                        () => {
                            $scope.onModelSelect();
                            $scope.onSeriesSelect();
                            $scope.loadFeatures();
                            $state.go('order.caravan.weightsize');
                        }
                    );
                }
            );
        };


        $scope.current_dealership = () => {
            let current = $scope.choices.dealerships.filter(x => x.id == $scope.order.dealership);
            if (current.length) {
                return current[0];
            } else {
                return null;
            }
        };

        $scope.createMessage = (type, message_list, close_timeout = null) => {
            if (typeof(message_list) == typeof('')) {
                message_list = [message_list];
            }

            $rootScope.message = { type, message_list };
            $anchorScroll('message-anchor');
            if (close_timeout !== null) {
                $interval(() => { $rootScope.message = null; }, close_timeout, 1);
            }
        };

        const replaceURL = () => {
            const url = $state.href("order.customer", { orderId: $scope.order.id })
                .split("/").slice(1).join("/");
            $location.path(url);
        };

        $scope.proceedDealerOrder = (form) => {

            const valid = form && form.$valid;
            // console.log('Entered Dealer Valid Value :' + valid);
            if (valid) {
                $scope.order.order_type = 'Stock';
                
                // console.log('Inside Valid :' + $scope.order.order_type  );

                if ($scope.order.order_stage_details && $scope.order.order_stage_details.code == 'ORDER_FINALIZED') {
                    $scope.order.update_customer_only = true;
                }
                OrderService.saveOrder().then(
                    () => {

                        // console.log('Inside Orderr Service ! ' );
                        
                        replaceURL();
                        $timeout(() => { $state.go('order.caravan.modelseries', { orderId: $scope.order.id }); });

                    }
                );
            }
        };

        $scope.proceedCustomerOrder = (form) => {
            const valid = form && form.$valid;
            $scope.cango = valid;
            // alert('Valid Value ' + valid);
            if (valid) {
                // alert('Inside Valid ' + valid);
                // console.log('Order Id ' + order.id);

                // alert($scope.order.order_type);
                if ($scope.order.id && $scope.order.order_type == 'Stock') {
                    $scope.order.is_order_converted = true;
                    // alert('Stock');
                    $scope.stock = 1;
                    $scope.order.order_type = 'Customer';
                    return;
                }

                if ($scope.order.order_type == 'Customer' && $scope.order.is_order_converted == 1) {
                    if ($scope.order.order_converted == null) {
                        alert('Please Enter Sales Date ! ');
                        // also add the sales date greater than logic here 
                        $scope.cango = false;
                    }
                    // also add the sales date greater than logic here 

                    if ($scope.order.order_converted != null) {

                        var dateent1 = $scope.order.order_converted;
                        var parts = dateent1.split("/");
                        //12/08/2019
                        var entdate = new Date(parts[1] + "/" + parts[0] + "/" + parts[2]);
                        var curdate = new Date();
                        if (entdate > curdate) {
                            alert(' Sales Date cannot Be greater than today ! ');
                            $scope.cango = false;
                            return;
                        }

                    }
                    if ($scope.cango == false) {
                        $scope.stock = 1;
                        return;
                    }
                    if ($scope.cango == true) {
                        $scope.stock = 0;
                    }
                }


                if ($scope.cango === true) {
                    if ($scope.order.order_stage_details && $scope.order.order_stage_details.code == 'ORDER_FINALIZED') {
                        $scope.order.update_customer_only = true;
                    }
                    $scope.order.order_type = 'Customer';
                    //order.order_type = Customer and order_converted != NULL
                    //if order.order_type = Customer then 
                    OrderService.saveOrder().then(
                        () => {

                            // replaceURL();
                            //if customer
                            // console.log('converted ' + $scope.is_order_converted);
                            // console.log('Date converted ' + $scope.order_converted);

                            if ($scope.stock == 0) {
                                delete $scope.order.update_customer_only;
                                replaceURL();
                                // $timeout(() => { $state.go('order.caravan.modelseries', { orderId: $scope.order.id }); });
                                $state.go('order.caravan.modelseries', { orderId: $scope.order.id });
                            }

                            if ($scope.stock == 1) {
                                alert('Stock  Customer order converted 1');
                                // replaceURL();
                                // $location.path(url);
                                // $timeout(() => { $state.go('order.caravan.modelseries', { orderId: $scope.order.id }); });
                            }
                            // console.log('After  Saving Order Id = ' + $scope.order.id + ' Order Type ' + $scope.order.order_type);

                        }
                    );
                }
            }
        };

        $scope.newOrderForCustomer = () => {
            OrderService.saveNewOrderForCustomer().then(
                () => {
                    replaceURL();
                    $timeout(() => { $state.go('order.caravan.modelseries', { orderId: $scope.order.id }); });
                }
            )
        };

        $scope.proceed = (form) => {
            switch ($state.current.name) {
                case "order.customer":
                    if (form && form.$valid) {
                        $state.go('order.caravan.modelseries');
                    }
                    break;
                case "order.caravan.modelseries":
                    // console.log('Inside Model Series');
                    if ($scope.order.model && $scope.order.series) {
                        // console.log('Saving Order');
                        // console.log('Model --' + $scope.order.model);
                        OrderService.saveOrder().then(
                            () => {
                                $state.go('order.caravan.weightsize');
                                $scope.onDeliveryChange();
                                $scope.loadFeatures();
                            }
                        );
                    }
                    break;
                case "order.caravan.weightsize":
                    if (form && form.$valid) {
                        OrderService.saveOrder().then(
                            () => { $state.go('order.caravan.features'); }
                        );
                    }
                    break;
            }
        };

        $scope.toggleWeightDisclaimer = () => {
            $scope.order.weight_estimate_disclaimer_time = new Date();
        };

        $scope.removeFeatureDocument = (feature) => {
            delete feature.new_document;
            delete feature.document;
        };

        $scope.hasAppliedShowSpecial = () => {
            return $scope.order.show_special && $scope.order.show_special.applied;
        };

        const getDepartmentsWithSelections = (category) => {
            let result = [];

            for (let department of category.departments) {
                if (department.selections.length) {
                    result.push(department);
                }
            }

            return result;
        };

        $scope.getDepartmentsWithAvailableOptions = (category) => {
            // Filter out departments that have selections as they cannot have optional extra as well
            let departmentsWithSelections = getDepartmentsWithSelections(category);

            return category.departments.filter(d => departmentsWithSelections.indexOf(d) == -1 && d.options.length);
        };

        $scope.getAvailableOptions = (category) => {
            let options = [];

            // Filter out departments that have selections as they cannot have optional extra as well
            let departmentsWithSelections = getDepartmentsWithSelections(category);

            for (let department of category.departments) {
                // if department doesn't have selection items
                if (departmentsWithSelections.indexOf(department) == -1) {
                    options = options.concat(department.options);
                }
            }

            return options;
        };

        $scope.hasCategoryOptions = (category) => {
            return $scope.getAvailableOptions(category).length;
        };

        $scope.getSelectedOptions = (category) => {
            let result = [];
            for (let department of $scope.getDepartmentsWithAvailableOptions(category)) {
                if ($scope.order.items[department.id]) {
                    result.push($scope.order.items[department.id]);
                }
            }
            return result;
        };

        $scope.isItemSelected = (item, department) => {
            // Returns true if the selected item for the given department is the item
            return $scope.order.items[department.id] && $scope.order.items[department.id].id == item.id;
        };

        $scope.calculatePrice = () => {
            // Do not calculate price until all data is available
            if ($scope.info.items === undefined || $scope.info.series_detail.retail_price === undefined) {
                return 0;
            }

            let detail = {
                manufacture: {
                    caravan: parseFloat($scope.info.series_detail.cost_price || 0),
                    upgrades: 0,
                    options: 0,
                    special_features: 0,
                    adjustments: $scope.order.price_adjustments.cost || 0,
                },
                wholesale: {
                    caravan: parseFloat($scope.info.series_detail.wholesale_price || 0),
                    upgrades: 0,
                    options: 0,
                    special_features: 0,
                    adjustments: ($scope.order.price_adjustments.wholesale || 0) + ($scope.order.after_sales.wholesale || 0),
                },
                retail: {
                    caravan: parseFloat($scope.info.series_detail.retail_price || 0),
                    upgrades: 0,
                    options: 0,
                    special_features: 0,
                    adjustments: ($scope.order.price_adjustments.retail || 0) + ($scope.order.after_sales.retail || 0),
                },
                options_upgrades: [],
                special_features: [],
            };

            for (let category of $scope.info.items) {
                for (let department of category.departments) {

                    if ($scope.order.items[department.id]) {
                        let item = $scope.order.items[department.id];
                        let price_multiplier = item.price_multiply || 1;
                        let item_price_manufacture = parseFloat(item.cost_price || 0) * price_multiplier;
                        let item_price_wholesale = parseFloat(item.wholesale_price || 0) * price_multiplier;
                        let item_price_retail = parseFloat(item.retail_price || 0) * price_multiplier;

                        if (item.availability_type == 1) { // standard
                            // no price increase, this is a standard item

                        } else if (item.availability_type == 5) { // selection
                            // no price increase, this is a selection item

                        } else if (item.availability_type == 2) { // upgrade
                            // get price difference between upgrade and standard item
                            detail.manufacture.upgrades += item_price_manufacture;
                            detail.wholesale.upgrades += item_price_wholesale;
                            detail.retail.upgrades += item_price_retail;
                            detail.options_upgrades.push({
                                'name': item.name,
                                'manufacture': item_price_manufacture,
                                'wholesale': item_price_wholesale,
                                'retail': item_price_retail,
                            });
                        }
                    }

                }

                let options = $scope.getSelectedOptions(category);
                if (options.length) {
                    for (let o of options) {
                        let price_multiplier = o.price_multiply || 1;
                        let option_price_manufacture = parseFloat(o.cost_price || 0) * price_multiplier;
                        let option_price_wholesale = parseFloat(o.wholesale_price || 0) * price_multiplier;
                        let option_price_retail = parseFloat(o.retail_price || 0) * price_multiplier;
                        detail.options_upgrades.push({
                            'name': o.name,
                            'manufacture': option_price_manufacture,
                            'wholesale': option_price_wholesale,
                            'retail': option_price_retail,
                        });
                        detail.manufacture.options += option_price_manufacture;
                        detail.wholesale.options += option_price_wholesale;
                        detail.retail.options += option_price_retail;
                    }
                }
            }

            for (let special_feature of $scope.order.special_features) {
                let feature_price_retail = parseFloat(special_feature.retail_price || 0);
                let feature_price_wholesale = parseFloat(special_feature.wholesale_price || 0);
                detail.retail.special_features += feature_price_retail;
                detail.wholesale.special_features += feature_price_wholesale;
                detail.special_features.push({
                    'name': special_feature.customer_description,
                    'manufacture': 0,
                    'wholesale': feature_price_wholesale,
                    'retail': feature_price_retail,
                });
            }

            const sum = (obj) => {
                return obj.caravan + obj.upgrades + obj.options + obj.special_features + obj.adjustments;
            };

            detail.retail.total = sum(detail.retail);
            detail.wholesale.total = sum(detail.wholesale);
            detail.manufacture.total = sum(detail.manufacture);

            let show_special_price = 0;
            if ($scope.hasAppliedShowSpecial()) {
                show_special_price = parseFloat($scope.order.show_special.price) || 0;
                detail.retail.total += show_special_price;
            }

            // In order to support the modal totals that allows adjustments store totals without adjustments as well
            const withoutAdjustment = summary => summary.total - summary.adjustments;

            detail.retail.totalNoAdjustment = withoutAdjustment(detail.retail);
            detail.wholesale.totalNoAdjustment = withoutAdjustment(detail.wholesale);
            detail.manufacture.totalNoAdjustment = withoutAdjustment(detail.manufacture);

            return {
                detail: detail,
                price: detail.retail.total,
            };
        };

        // Not used as of 10/08/2016
        //$scope.on_open_leads_lookup = () => {
        //    $('#lead-lookup.modal').modal({
        //        backdrop: 'static',
        //        keyboard: false
        //    });
        //};

        $scope.select_customer = (customer) => {
            $scope.order.customer = customer;
            $scope.editCurrentCustomer = false;
        };

        $scope.select_physical_suburb = (suburb) => {
            $scope.order.customer.physical_address.suburb = suburb;
        };

        $scope.select_delivery_suburb = (suburb) => {
            $scope.order.customer.delivery_address.suburb = suburb;
        };

        $scope.select_invoice_suburb = (suburb) => {
            $scope.order.customer.postal_address.suburb = suburb;
        };

        
       

    

        const resetChangedFlag = () => {
            for (let category of $scope.info.items) {
                for (let department of category.departments) {
                    department.changed = false;
                }
            }
            $scope.order.special_features_changed = false;
            $scope.order.price_changed = false;
        };

        const confirmSaveMessage = 'Order details will be saved before continuing.';

        $scope.checkAndConfirmSave = () => {
            return new Promise((fulfill, reject) => {

                const onChanged = () => {
                    if (confirm(confirmSaveMessage)) {
                        $scope.saveOrder().then(fulfill, reject);
                    } else {
                        reject();
                    }
                };

                if ($scope.order.special_features_changed || $scope.order.price_changed) {
                    onChanged();
                    return;
                }

                for (let category of $scope.info.items) {
                    for (let department of category.departments) {

                        if (department.changed) {
                            onChanged();
                            return;
                        }
                    }
                }

                fulfill();
            });
        };

        $scope.saveOrder = () => {

            if ($scope.order.order_stage_details.code == 'ORDER_FINALIZED' && $state.current.name === 'order.customer') {
                $scope.order.update_customer_only = true;
            }

            $scope.loading.order = true;
            return OrderService.saveOrder().then(
                    () => {
                        if ($scope.order.update_customer_only) {
                            delete $scope.order.update_customer_only;
                            $scope.createMessage('alert-warning', 'Customer details saved.');
                        } else {
                            $scope.createMessage('alert-info', 'Details Saved.');
                        }
                        reassignData();

                        setTimeout(resetChangedFlag, 1); // To be launched after current digest();
                    }
                )
                .finally(() => { $scope.loading.order = false; });
        };

        $scope.requestOrderApproval = () => {
            $scope.checkAndConfirmSave().then(() => {
                $scope.loading.order = true;
                OrderService.requestOrder().then(
                        () => { $state.go('order.status', {}, { reload: true }); }
                    )
                    .finally(() => { $scope.loading.order = false; });
                // This empty rejection handler to avoid error 'Unhandled promise rejection'
                // A rejection at this stage simply means the user cancelled when asked whether they want to save the order before continuing
            }, () => {});
        };

        $scope.rejectOrderApproval = () => {
            $scope.checkAndConfirmSave().then(() => {
                $scope.loading.order = true;
                OrderService.rejectOrder().then(
                        () => { $state.go('order.status', {}, { reload: true }); }
                    )
                    .finally(() => { $scope.loading.order = false; });
                // This empty rejection handler to avoid error 'Unhandled promise rejection'
                // A rejection at this stage simply means the user cancelled when asked whether they want to save the order before continuing
            }, () => {});
        };

        $scope.placeOrder = () => {
            $scope.checkAndConfirmSave().then(() => {
                $scope.loading.order = true;
                OrderService.placeOrder().then(
                        () => {
                            $state.go('order.status', {}, { reload: true });
                            if ($scope.order.last_server_error_message) {
                                $scope.createMessage('alert-danger', $scope.order.last_server_error_message);
                            }
                        }
                    )
                    .finally(() => { $scope.loading.order = false; });
                // This empty rejection handler to avoid error 'Unhandled promise rejection'
                // A rejection at this stage simply means the user cancelled when asked whether they want to save the order before continuing
            }, () => {});
        };

        $scope.confirmCancelOrder = () => {
            $scope.cancelReason = '';
            $('#cancel_order.modal').modal({
                backdrop: 'static',
            });
        };

        $scope.confirmPlaceOrder = () => {
            $('#place_order.modal').modal({
                backdrop: 'static',
            });
        };

        $scope.cancelOrder = () => {
            OrderService.cancelOrder($scope.cancelReason).then(
                () => { $state.go('order.status', {}, { reload: true }); }
            );
        };

        $scope.finalizeOrder = () => {
            $scope.checkAndConfirmSave().then(() => {
                $scope.loading.order = true;
                OrderService.finalizeOrder().then(
                        () => { $state.go('order.status', {}, { reload: true }); }
                    )
                    .finally(() => { $scope.loading.order = false; });
                // This empty rejection handler to avoid error 'Unhandled promise rejection'
                // A rejection at this stage simply means the user cancelled when asked whether they want to save the order before continuing
            }, () => {});
        };

        $scope.canOrderBeSaved = () => {
            return $scope.order.isEditable() || ($scope.permissions && ($scope.permissions.modify_special_features || $scope.permissions.approve_special_features));
        };

        $scope.canOrderApprovalBeRejected = () => {
            if (!$scope.order.order_stage_details) {
                return false;
            }
            return $scope.order.order_stage_details.code == 'ORDER_REQUESTED' && $scope.order.permissions.approve_order;
        };

        $scope.canOrderBeCancelled = () => {
            if (!$scope.order.order_stage_details) {
                return false;
            }
            return $scope.order.permissions.cancel_order && (
                $scope.order.order_stage_details.code == 'ORDER' ||
                $scope.order.order_stage_details.code == 'ORDER_FINALIZED');
        };

        $scope.canOrderApprovalBeRequested = () => {
            if (!$scope.order.order_stage_details ||
                $scope.order.is_expired ||
                $scope.order.has_missing_selections) {
                return false;
            }
            return ($scope.order.order_stage_details.code == 'QUOTE' ||
                $scope.order.order_stage_details.code == 'QUOTE_SELECTIONS' ||
                $scope.order.order_stage_details.code == 'ORDER_REJECTED') && $scope.order.permissions.request_order_approval;
        };

        $scope.canOrderBePlaced = () => {
            if (!$scope.order.order_stage_details ||
                $scope.order.is_expired ||
                $scope.order.has_missing_selections) {
                return false;
            }

            return $scope.order.order_stage_details.code == 'ORDER_REQUESTED' && $scope.order.permissions.approve_order;
        };

        $scope.canOrderBeFinalized = () => {
            if (!$scope.order.order_stage_details ||
                $scope.order.is_expired ||
                $scope.order.has_missing_selections ||
                ($scope.order.special_features.length && !$scope.order.special_features_approved)) {
                return false;
            }
            return $scope.order.order_stage_details.code == 'ORDER' && ($scope.order.permissions.finalize_order || $scope.order.permissions.lock_order);
        };

        $scope.canOrderPricesBeSaved = () => {
            if (!$scope.order.order_stage_details) {
                return false;
            }
            return $scope.order.order_stage_details.code == 'ORDER_FINALIZED' && $scope.order.permissions.modify_retail_prices_finalized;
        };

        $scope.canCreateOrderForSameCustomer = () => {
            return $scope.order.id && $scope.permissions && $scope.permissions.create_order && $scope.order.customer;
        };

        $scope.updateSalesforce = () => {
            $scope.post('update-salesforce', { order_id: $scope.order.id }).then(() => {
                OrderService.retrieveOrder($scope.order.id);
            });
        };

        $scope.applyShowSpecial = (special) => {
            if ($scope.order.show_special && $scope.order.show_special.applied) {
                $scope.unapplyShowSpecial($scope.order.show_special);
            }
            $scope.order.show_special = special;
            special.applied = true;
            ruleUtils.applyShowSpecialRules($scope);
            ruleUtils.updateRules($scope);
        };

        $scope.unapplyShowSpecial = (special) => {
            ruleUtils.unapplyRules(special.undo_rules, $scope);
            special.applied = false;
            $scope.order.show_special = null;
        };

        $scope.loadFeatures = () => {
            if ($scope.loading.items) {
                // Loading already in progress, no need to trigger another one
                return;
            }

            $scope.loading.items = true;
            OrderApiService.getFeatures($scope.order.series, $scope.order.id)
                .then(
                    data => {
                        $scope.info.items = data.categories;

                        matchOrderItemsToSeriesItems();

                        if ($scope.order.show_special_id) {
                            for (let special of $scope.specials) {
                                if (special.id == $scope.order.show_special_id) {
                                    $scope.order.show_special = special;
                                    break;
                                }
                            }

                            $scope.applyShowSpecial($scope.order.show_special);
                        }
                    }
                ).finally(
                    () => {
                        $scope.loading.items = false;
                    }
                );
        };

        /**
         * Selected items are the items defined in order.items[department_id].
         *
         * If Order is finalized:
         *   Keep all selected order items.
         *
         * Else if order item is set and item is still valid in the series defined items:
         *   Keep it selected (don't change anything)
         *
         * Else if series defined selections length is 1:
         *   Override selected item with selection from series
         *
         * Else (series have zero or multiple selections defined for the department):
         *   Remove the item from the order items (user has to make a selection)
         */
        const matchOrderItemsToSeriesItems = () => {
            let order = $scope.order;
            if (order.order_stage_details.code == 'ORDER_FINALIZED') {
                return;
            }

            for (let category of $scope.info.items) {
                for (let department of category.departments) {

                    let orderItem = order.items[department.id];

                    // Keeping this syntax for clarity
                    if (orderItem && isItemInDepartment(orderItem, department)) {
                        // Item still exist in the series, do not touch anything

                        // Mark department as changed if the availability is different that what is saved on the order
                        if (!isSameAvailability(orderItem, department)) {
                            department.changed = true;
                        }

                    } else if (department.selections.length == 1) {
                        // Mark department as changed if a new standard item is added or the standard item has changed
                        const departmentItem = department.selections[0];
                        if (!orderItem || orderItem.id != departmentItem.id || orderItem.availability_type != departmentItem.availability_type) {
                            department.changed = true;
                        }
                        // Item doesn't exist, but only one selection available: automatically select available item
                        order.items[department.id] = departmentItem;

                    } else {
                        // Mark department as changed if the order included this item
                        if (orderItem) {
                            department.changed = true;
                        }

                        // Item doesn't exist OR series have multiple selections defined for the department
                        delete order.items[department.id];
                    }

                }
            }
        };

        const isItemInDepartment = (item_search, department) => {
            for (let type of['selections', 'upgrades', 'options']) {
                for (let item of department[type]) {
                    if (item.id == item_search.id) {
                        return true;
                    }
                }
            }
            return false;
        };

        const isSameAvailability = (item_search, department) => {
            for (let type of['selections', 'upgrades', 'options']) {
                for (let item of department[type]) {
                    if (item.id == item_search.id) {
                        return item.availability_type == item_search.availability_type;
                    }
                }
            }
            return false;
        };

        // If order fields are already defined (e.g. coming from showroom), load required info
        if ($scope.order.validModel()) {
            $scope.onModelSelect();
        }
        if ($scope.order.validSeries()) {
            $scope.onSeriesSelect();
        }

        //Not used as of 10/08/2016
        ///*Lead lookup modal*/
        //$scope.on_lead_lookup_select = (lead_form) => {
        //
        //    var customer_model = lead_form.$$success.editable[0].$modelValue;
        //
        //    var selected_lead = JSON.parse(customer_model.lead)[0].fields;
        //
        //    var selected_physical_address = customer_model.physical_address == null ? null : JSON.parse(customer_model.physical_address)[0].fields;
        //    var selected_physical_address_suburb = customer_model.physical_address == null ? null : JSON.parse(customer_model.physical_address_suburb)[0].fields;
        //    var selected_physical_address_post_code = customer_model.physical_address == null ? null : JSON.parse(customer_model.physical_address_post_code)[0].fields;
        //
        //    var selected_postal_address = customer_model.postal_address == null ? null : JSON.parse(customer_model.postal_address)[0].fields;
        //    var selected_postal_address_suburb = customer_model.postal_address == null ? null : JSON.parse(customer_model.postal_address_suburb)[0].fields;
        //    var selected_postal_address_post_code = customer_model.postal_address == null ? null : JSON.parse(customer_model.postal_address_post_code)[0].fields;
        //
        //    var selected_delivery_address = customer_model.delivery_address == null ? null : JSON.parse(customer_model.delivery_address)[0].fields;
        //    var selected_delivery_address_suburb = customer_model.delivery_address == null ? null : JSON.parse(customer_model.delivery_address_suburb)[0].fields;
        //    var selected_delivery_address_post_code = customer_model.delivery_address == null ? null : JSON.parse(customer_model.delivery_address_post_code)[0].fields;
        //
        //    //console.log(lead_form.$$success.editable[0].$modelValue);
        //    console.log(selected_lead);
        //
        //    console.log(selected_physical_address);
        //    console.log(selected_physical_address_suburb);
        //    console.log(selected_physical_address_post_code);
        //
        //    console.log(selected_postal_address);
        //    console.log(selected_postal_address_suburb);
        //    console.log(selected_postal_address_post_code);
        //
        //    console.log(selected_delivery_address);
        //    console.log(selected_delivery_address_suburb);
        //    console.log(selected_delivery_address_post_code);
        //
        //    $scope.order.customer ={
        //        id: selected_lead.id,
        //        first_name: selected_lead.first_name,
        //        last_name: selected_lead.last_name,
        //        email: selected_lead.email,
        //        partner_name: selected_lead.partner_name,
        //        phone_number: selected_lead.phone1,
        //        phone_delivery: selected_lead.phone_delivery,
        //        phone_invoice: selected_lead.phone_invoice,
        //        address: {
        //            registered_owner: selected_physical_address.name,
        //            street: selected_physical_address.address,
        //            suburb: selected_physical_address_suburb.name,
        //            post_code: selected_physical_address_post_code.number,
        //            state: selected_physical_address_post_code.state,
        //            delivery: {
        //                name: selected_delivery_address.name,
        //                street: selected_delivery_address.address,
        //                suburb: selected_delivery_address_suburb.name,
        //                post_code: selected_delivery_address_post_code.number,
        //                state: selected_delivery_address_post_code.state
        //            },
        //            invoice: {
        //                name: selected_postal_address.name,
        //                street: selected_postal_address.address,
        //                suburb: selected_postal_address_suburb.name,
        //                post_code: selected_postal_address_post_code.number,
        //                state: selected_postal_address_post_code.state
        //            }
        //        },
        //    };
        //
        //    $('#lead-lookup.modal').modal('hide');
        //    return false;
        //};

        $scope.onOpenTradeInComment = () => {
            $('#trade_in_comment.modal').modal({
                backdrop: 'static',
            });
        };

        $scope.onOpenConditions = () => {
            $('#order_conditions.modal').modal({
                backdrop: 'static',
            });
        };

        $scope.onOpenAfterMarketNote = () => {
            $('#after_market_note.modal').modal({
                backdrop: 'static',
            });
        };

        $scope.isCustomerEditable = () => {
            return ($scope.order.id && !$scope.order.isStockOrder()) ||
                !($scope.order.customer && $scope.order.customer.id) ||
                $scope.editCurrentCustomer;
        };

        $scope.clearCustomer = () => {
            $scope.order.resetCustomer();
            $scope.search = {};
        };

        $scope.editCustomerFields = () => {
            $scope.editCurrentCustomer = true;
        };

        $scope.checkdisplayview = () => {
            // console.log('Checking ' + $scope.permissions.user_details);
            // <!-- Function checkdisplayview() gets the user id from user_details 
            // and if its dealershuip user returns 0 --- cannot see the contents on this tab
            // If staff or other spcial users can see the tab 
            // This is temporarily done for Road Owl Model alone as per client request 
            //     Road Owl Model Id is 16 -->
            //     Wayfarer Model Id is 12 -->
            //     MantaRay Model Id is 2 -->

            if(($scope.order.model ===16 ) ||($scope.order.model ===12 ) || ($scope.order.model ===2 ))
            {
                if( $scope.permissions.user_details===1)
                {   
                    return 0;
                } 
                else if ( $scope.permissions.user_details===0)
                {
                    return 1;
                }
            } else
            {
                if( $scope.permissions.user_details===1)
                {   
                    return 1;
                } 
                else if ( $scope.permissions.user_details===0)
                {
                    return 1;
                }
            }

        };

        $scope.replaceItem="";
        $scope.workcenter="";
        $scope.catname="";
        //Custom Function
        $scope.getCategory=(feature)  => {
            
              const categoryMap = {};
            const departmentMap = {};

            $scope.replaceItem="";
            $scope.workcenter="";

            for (let categoryObj of $scope.choices.categories) {
                categoryMap[categoryObj.id] = categoryObj;
                for (let departmentObj of categoryObj.departments) {
                    departmentMap[departmentObj.id] = {
                        department: departmentObj,
                        parent: categoryObj,
                    };
                }
            }
             // console.log(feature.factory_description);

             let lg ='';
            const category = categoryMap[feature.sku_category];
                    if (category) {
                    // console.log('inside : ' + category.name);
                    // console.log("inside " + category.title);
                    $scope.catname = category.title;
                    // special_feature.selectedCategory = category;
                
                
                    }                   
                        //department lookup
                const departmentLookup = departmentMap[feature.sku_category];
                if (departmentLookup) {
                    feature.selectedDepartment = departmentLookup.department;
                    // console.log(departmentLookup.department);
                    feature.selectedCategory = departmentLookup.parent;
                    // console.log(departmentLookup.parent);
                    $scope.workcenter=departmentLookup.parent.title;
                    $scope.replaceItem=departmentLookup.department.title  ;
                }

                    if(!$scope.workcenter)
                    {
                        $scope.workcenter = $scope.catname ;
                        $scope.replaceItem = feature.factory_description;

                        feature.selectedCategory   = $scope.workcenter;    
                        feature.selectedDepartment = $scope.replaceItem ;
                    }    
                    return $scope.workcenter;
            };

            /*
            for (let special_feature of $scope.order.special_features) {
                console.log('feature ' + feature.sku_category);
                console.log('special ' + special_feature.sku_category);
                // if (!special_feature.sku_category) {
                //     continue;
                // }
                if(feature.sku_category === special_feature.sku_category)
                {
                    console.log('true' + special_feature.factory_description);
                    // console.log(special_feature);
                    console.log('Print Cat ' + categoryMap[feature.sku_category].title);
                    const category = categoryMap[feature.sku_category];
                    if (category) {
                    // console.log('inside : ' + category.name);
                    console.log("inside " + category.title);
                    // special_feature.selectedCategory = category;
                
                    }

                }

            }

            return feature.factory_description;
        };


            /*
            for (let category of $scope.order.special_features) {
                for (let m2 of category.special_features) {
                    console.log(m2);
                    console.log(feature.factory_description);
                    console.log(category.name);

                }
                 }
                 return m2;
        };
        */

        $scope.onSpecialFeatureCategorySelect = (feature) => {
            feature.departmentList = $scope.generateDepartmentsForCategory(feature.selectedCategory);
            feature.sku_category = feature.selectedCategory ? feature.selectedCategory.id : null;
        };

        $scope.onSpecialFeatureDepartmentSelect = (feature) => {
            if (feature.selectedDepartment) {
                feature.sku_category = feature.selectedDepartment.id;
            } else {
                feature.sku_category = feature.selectedCategory.id;
            }
        };

        $scope.generateDepartmentsForCategory = (category) => {

            const departments = [];

            if (!category) {onFeatureDetailChange
                return departments;
            }

            // When an item is selected for a department, show item description instead of department name
            for (let department of category.departments) {
                let item = $scope.order.items[department.id];
                if (item) {
                    departments.push({
                        id: department.id,
                        title: item.public_description,
                    });
                }
            }

            const unusedDepartments = category.departments.filter((department) =>
                // Include department if not present in current 'departments' array
                departments.filter((d) => d.id == department.id).length == 0
            );
            return [
                ...departments,
                { id: null, title: '--------------------------------------------------' },
                ...unusedDepartments,
            ];
        };

        $scope.addSpecialFeature = () => {
            const newFeature = {};
            $scope.onFeatureDetailChange(newFeature);
            $scope.order.special_features.push(newFeature);
        };

        $scope.removeSpecialFeature = (index) => {
            $scope.order.special_features.splice(index, 1);
        };

        $scope.onFeatureDetailChange = (feature) => {
            feature.approved = null;
        };

        $scope.onPrintAutocad = () => {
            $scope.checkAndConfirmSave().then(() => { window.open('/orders/autocad/' + $scope.order.id + '/', '_blank'); });
        };
    });
}