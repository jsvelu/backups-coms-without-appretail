export default app => {
    app.controller('ModelsController', function ($scope, ApiService, $q, $log) {

        require("./style.scss");

        $scope.post = (data) => {
            return ApiService.post('models/', data);
        };

        $scope.data = {
            models: []
        };

        $scope.loading = {
            models: false,
            group_items: {},
        };

        $scope.clone = {
        };

        // Get a list of models
        const refresh_models = () => {
            $scope.loading.models = true;
            return $scope.post({
                type: 'models'
            }).then(function (r) {
                _.merge($scope.data.models, r.data.models);
                if (_.isEmpty($scope.data.selected_model)) {
                    $scope.data.selected_model = $scope.data.models[0];
                }
                
                $scope.data.table_row_width = $scope.data.selected_model.series.length * 250 + 500;

                $scope.data.categories = r.data.categories;

                reset_categories();

                $scope.loading.models = false;
                return $q.resolve(r);
            });
        };

        const reset_categories = () => {
            for (let category of $scope.data.categories) {
                for (let group of category.groups) {
                    // Reset the items available for this sub-category
                    group.items = [];

                    // Reset the open state of the sub-categories accordions to false
                    group.open_state = false;
                    if (group.isOpened === undefined) {
                        Object.defineProperty(group, "isOpened",
                            {
                                get : () => { return group.open_state; },
                                set : (newValue) => {
                                    group.open_state = newValue;
                                    if (group.open_state) {
                                        refresh_items(group);
                                    }
                                }
                            });
                    }

                    group.isSeriesSelectorVisible = {}; // Map of id -> boolean to track series availability selector visibility per group per series
                }
            }
        }

        const refresh_items = (subCategory) => {
            $scope.loading.group_items[subCategory.id] = true;
            $scope.post({
                type: 'model_items',
                model_id: $scope.data.selected_model.id,
                category_id: subCategory.id
            }).then(r => {
                $scope.loading.group_items[subCategory.id] = false;
                subCategory.items = r.data.items;
                return $q.resolve(r);
            });
        };

        refresh_models();

        // And a list of the item availability types (standard, selection, etc)
        $scope.post({
            type: 'availability_types'
        }).then(r => $scope.data.availability_types = r.data.list);

        $scope.first_key = obj => obj[Object.keys(obj)[0]];

        $scope.on_model_select = (item) => {
            $scope.data.selected_model = item;
            reset_categories();
        };

        $scope.update_series_sku = (series) => {
            ApiService.post('models/series-sku/' + series.id, {
                availability_type: series.availability_type,
                print_visible: series.print_visible,
                contractor_description: series.contractor_description,
            });
        };

        $scope.update_all_series_sku = (seriesSku, department) => {
            $scope.loading.group_items[department.id] = true;
            department.isSeriesSelectorVisible[seriesSku.id] = false;

            ApiService.post('models/series/' + seriesSku.series_id, {
                availability_type: seriesSku.departmentAvailability,
                department_id: department.id,
            }).then(() => { refresh_items(department) });
        };

        $scope.on_open_clone_series = () => {
            if (_.isEmpty($scope.data.selected_model.series)) {
                return;
            }
            $scope.clone.series_id = $scope.data.selected_model.series[0].id;
            $scope.clone.model_id = $scope.data.selected_model.id;
            $('#clone-series.modal').modal({
                backdrop: 'static',
                keyboard: false
            });
        };

        $scope.alpha_ordered = (obj) => {
            return _.sortBy(obj, o => o.title);
        };

        $scope.screen_ordered = (obj) => {
            return _.sortBy(obj, o => o.order);
        };

        $scope.toggleVisibility = (series) => {
            if (_.get(series, 'hidden', null) === null) {
                series.hidden = false;
            }
            series.hidden = !series.hidden;
        };

        $scope.visibleSeries = (seriesList) => {
            // FIlter out hidden series
            if (seriesList) {
                return seriesList.filter(s =>
                  !_.get(_.find($scope.data.selected_model.series, ss => ss.id == s.series_id ), 'hidden', false));
            }
        };

        $scope.on_clone_series = (form) => {
            if (form && form.$valid) {

                let clone_model = $scope.data.models
                     .filter(x => x.id == $scope.clone.model_id)[0];

                for (var i = 0; i < clone_model.series.length; i++) {
                    if (clone_model.series[i].name == $scope.clone.series_title) {
                        $scope.clone.message = 'Series title already exists';
                        return;
                    }
                }
                $scope.post({
                    type: 'clone_series',
                    model_id: $scope.clone.model_id,
                    series_id: $scope.clone.series_id,
                    production_unit: $scope.clone.production_unit,
                    series_title: $scope.clone.series_title,
                    series_code: $scope.clone.series_code,
                }).then(r => {
                    // Close the model and force a refresh
                    $('#clone-series.modal').modal('hide');
                    refresh_models();
                }, err => {
                    $scope.clone.message = err.data;
                });
            }
        };
    });
};