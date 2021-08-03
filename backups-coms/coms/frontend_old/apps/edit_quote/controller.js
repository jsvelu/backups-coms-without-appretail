export default app => {

    app.controller('EditQuoteController', ['$scope', '$http', '$location', 'ApiService', function ($scope, $http, $location, ApiService) {

        $scope.post = (data) => {
            return ApiService.post('edit_quote/', data);
        };

        $scope.table_object = null;
        $scope.customer_type = 'Customer';
        $scope.caravan_selection = 'base';
        $scope.choices = {
            series_list: []
        };

        $scope.data = {
        };

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
        $scope.active_sub_tab = [true, false, false, false, false, false];

        $scope.order.desired_dd_day = 1;
        $scope.order.desired_dd_month = 2;
        $scope.order.desired_dd_year = 2016;


        $scope.info = {
            show_price: true,
            show_price_button: 'Hide'
        }

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

        var a = $('<a>', { href:$location.absUrl() } )[0];
        var quote_id = a.search.substr(1).split('=')[1];
        $scope.post({
            type: 'get_edit_pre_data',
            quote_id: quote_id
        }).then(function(r) {
            $scope.choices.dealerships = r.data.list.dealers;
            $scope.choices.states = r.data.list.states;
            $scope.choices.models = r.data.list.models;
            $scope.choices.series_list = r.data.list.series_list;
            $scope.data.categories = r.data.list.categories;
            $scope.data.availability_types = r.data.list.availability_types;
            $scope.data.series = r.data.list.series;
            $scope.quote = r.data.list.quote;
            $scope.quote.upgrade_retail_sum = 0;
            $scope.quote.upgrade_wholesale_sum = 0;
            $scope.quote.upgrade_cost_sum = 0;
            $scope.quote.extra_retail_sum = 0;
            $scope.quote.extra_wholesale_sum = 0;
            $scope.quote.extra_cost_sum = 0;
            $scope.quote.special_features_retail_sum = 0;
        });

        $scope.on_base_series_selection = function () {
            $scope.post({
                    type: 'set_series',
                    series_id: $scope.quote.series,
                    quote_id: $scope.quote.id
                }).then(function (r) {
                    $scope.active_sub_tab[2] = true;
            });
        };

        $scope.toggleShowPrice = function(){
            $scope.info.show_price = !$scope.info.show_price;
            if ($scope.info.show_price) {
                $scope.info.show_price_button = "Hide";
            }
            else
            {
                $scope.info.show_price_button = "Show Retail Price";
            }
        };

        $scope.OnSKUClick = function (group, item){
            group.selected_item = item;
            var prev_retail_differential = group.retail_price_differential;
            var prev_wholesale_differential = group.wholesale_price_differential;
            var prev_cost_differential = group.cost_price_differential;

            group.retail_price_differential = item.retail_price - group.standard_item.retail_price;
            group.wholesale_price_differential = item.wholesale_price - group.standard_item.wholesale_price;
            group.cost_price_differential = item.cost_price - group.standard_item.cost_price;

            $scope.quote.upgrade_retail_sum += group.retail_price_differential - prev_retail_differential;
            $scope.quote.upgrade_wholesale_sum += group.wholesale_price_differential - prev_wholesale_differential;
            $scope.quote.upgrade_cost_sum += group.cost_price_differential - prev_cost_differential;
        };

        $scope.UpdateFeaturesTotals = function (group, prev_differential){

            /*
            var i, j, k;
            var new_sum;

            for (i = 0; i < $scope.data.categories.length; ++i) {
                var cat = $scope.data.categories[i];
                for (j = 0; j < cat.groups.length; ++j) {
                    var g1 = cat.groups[j];
                    for (k = 0; k < g1.groups.length; ++k) {
                        var g2 = g1.groups[k];
                    }
                }
            } */

        }

        $scope.extra_checked = (category, group, item) => {
            item.is_selected = !item.is_selected;

            var int_sign;
            if (item.is_selected)
            {
                int_sign = 1;
                group.selected_extra_count++;
                category.sub_selected_extra_count++;
            }
            else
            {
                category.sub_selected_extra_count--;
                group.selected_extra_count--;
                int_sign = -1;
            }

            $scope.quote.extra_retail_sum += item.retail_price * int_sign;
            $scope.quote.extra_wholesale_sum -= item.wholesale_price * int_sign;
            $scope.quote.extra_cost_sum -= item.cost_price * int_sign;
        }

        $scope.onAddExtra = (category) => {
                $scope.data.category_for_extra = category;
                $('#extra_modal').modal({
                    backdrop: 'static',
                    keyboard: false
                });
        }

        $scope.onOpenSeriesPhotos = () => {
            $('#photos.modal').modal({
                backdrop: 'static',
            });
        };

        $scope.onShowFeaturedTotals = () => {
                $('#featured_totals_modal').modal({
                    backdrop: 'static',
                    keyboard: false
                });
        }

        $scope.onAddExtraSubmit = () => {
            $('.modal').modal('hide');
        }

        let serverData = () => ({
            type: 'get_list',
            search: $scope.search_id,
        });


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

        $scope.on_model_select = (model) => {
            $scope.post({
                    type: 'get_model_series',
                    model_id: $scope.quote.model
                }).then(function (r) {
                    $scope.quote.model_obj = null;
                    $scope.quote.series_obj = null;

                    $scope.get_model_name();
                    $scope.get_series_name();

                    $scope.choices.series_list = r.data.list.series_list;
            });
        };

        $scope.on_series_select = () => {
            $scope.post({
                    type: 'get_series_data',
                    series_id: $scope.quote.series,
                    quote_id: $scope.quote.id
                }).then(function (r) {
                    $scope.quote.series_obj = null;
                    $scope.get_series_name();
                    $scope.data.series = r.data.list.series;
                    $scope.data.categories = r.data.list.categories;
            });
        };

        $scope.get_model_name = () => {
            if ($scope.quote)
                if ($scope.quote.model_obj)
                    return $scope.quote.model_obj['title'];

            if(typeof $scope.choices.models === 'undefined')
                return '';

            var index;

            for (index = 0; index < $scope.choices.models.length; ++index) {
                if ($scope.choices.models[index].id == $scope.quote.model) {
                    $scope.quote.model_obj = $scope.choices.models[index];
                    return $scope.choices.models[index]['title'];
                }
            }
        };

        $scope.get_series_name = () => {
            if ($scope.quote)
                if ($scope.quote.series_obj)
                    return $scope.quote.series_obj['title'];

            var index;

            for (index = 0; index < $scope.choices.series_list.length; ++index) {
                if ($scope.choices.series_list[index].id == $scope.quote.series) {
                    $scope.quote.series_obj = $scope.choices.series_list[index];
                    return $scope.choices.series_list[index]['title'];
                }
            }

            return '';
        };

        $scope.add_special_row = (category) => {
            category.additional_expenses.push({
               id: '',
               category_id: '',
               notes: '',
               quantity: '',
               retail_charge: '',
               wholesale_charge: '',
               cost_price: '',
               approval_time: '',
               approval_notes: ''
            });
        };

        $scope.should_feature_price_be_disabled = (feature) => {
            return feature.category_id == '' ||
                    feature.notes == '' ||
                    feature.quantity == '';
        }

        $scope.on_special_feature_price_change = (feature) => {
            if (feature.previous_retail_charge === undefined)
            {
                feature.previous_retail_charge = 0;
            }

            $scope.quote.special_features_retail_sum += (parseInt(feature.retail_charge) - feature.previous_retail_charge);
            feature.previous_retail_charge = parseInt(feature.retail_charge);
        };

        $scope.update_customer_details = (form) => {
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

    }]);
}