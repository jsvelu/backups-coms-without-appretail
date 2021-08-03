import * as ruleUtils from './rules.js';
import _ from 'lodash';

export default app => {

    app.controller('OrderCaravanController', function (
        $http,
        $log,
        $q,
        $scope,
        $state,
        $sce,
        ApiService,
        AppSettings,
        OrderService,
        TestSettings,
        Upload
    ) {

        $scope.tabData = [
            {
                heading: 'Model & Series',
                route: 'order.caravan.modelseries'
            },
            {
                heading: 'Weight & Size',
                route: 'order.caravan.weightsize'
            },
            {
                heading: 'Features',
                route: 'order.caravan.features'
            },
        ];

        $scope.internal = {
            price_multiplies: [],
            file_uploads: {},
        };


        $scope.special_features_expanded = false;
        $scope.options_upgrades_expanded = false;

        $scope.uploader = Upload;
        $scope.priceMultiplyItems = (ruleItem, item) => ruleUtils.priceMultiplyItems(ruleItem, item, $scope);

        const setOptionsAvailability = (department) => {
            // Within a department, only 1 optional extra can be selected
            for (let item of department.options) {
                let selectedOption = $scope.order.items[department.id];
                if (selectedOption) {
                    selectedOption.available = true; // Currently selected option is always available
                }
                item.available = !selectedOption || selectedOption.id == item.id;
            }
        };

        $scope.onOpenOptions = category => {
            $scope.optionsByDepartment = $scope.getDepartmentsWithAvailableOptions(category);
            for (let department of $scope.optionsByDepartment) {
                setOptionsAvailability(department);
            }
            $('#options.modal').modal({
                backdrop: 'static',
            });
        };

        $scope.onOpenTotals = () => {
            const detail = $scope.calculatePrice().detail;
            $scope.totals = detail;
            $('#totals.modal').modal({
                backdrop: 'static',
            });
        };

        $scope.onOpenSpecials = () => {
            $('#specials.modal').modal({
                backdrop: 'static',
            });
        };

        $scope.onPrintPdfClick = ($event) => {
            // Called when someone clicks on a print PDF button
            // Assumes that the <a href=".."> container contains the URL of the PDF
            // console.log('Print PDF Click Entered ');
            // alert('hello');
            // alert($event);

            let href = $($event.target).closest('a').attr('href');
            if (TestSettings.DISABLE_PDF) {
                href += href.indexOf('?') !== -1 ? '&' : '?';
                href += 'is_html=1';
            }
            const target = TestSettings.DISABLE_PDF ? '_self' : '_blank';
            $event.preventDefault();
            $scope.checkAndConfirmSave().then(() => {
                window.open(href, target);
            });
        };

        $scope.onOpenSeriesPhotos = () => {
            $scope.view_photos = $scope.info.series_detail.photos;
            $('#photos.modal').modal({
                backdrop: 'static',
            });
        };

        $scope.onOpenSeriesPlans = () => {
            $scope.view_photos = $scope.info.series_detail.plans;
            $('#photos.modal').modal({
                backdrop: 'static',
            });
        };

        $scope.onItemSelect = (department, item) => {
            let hasChanged = !$scope.order.items[department.id] || $scope.order.items[department.id].id != item.id;

            // Apply rules even if the selected object is the same

            const selectItem = () => {
                $scope.order.items[department.id] = item;
                department.changed = department.changed || hasChanged;
                ruleUtils.updateRules($scope);
            };

            // Check for rules

            $scope.post('item-rules', {
                sku_id: item.id,
                series_id: $scope.order.series,
            }).then( response => {
                const rules = response.data.rules;
                $scope.info.rules = rules;
                if (rules.length) {
                    $scope.cancelRules = () => {};
                    $scope.acceptRules = (form) => {
                        if (form && form.$valid) {
                            let current_item = $scope.order.items[department.id];
                            if (current_item) {
                                ruleUtils.unapplyRules(current_item.undo_rules, $scope); // unapply any rules on the currently selected item
                            }
                            ruleUtils.applyRules(rules, item, null, $scope);
                            selectItem();
                            $('#rules.modal').modal('hide');
                        }
                    };
                    $('#rules.modal').modal({});
                } else {
                    selectItem();
                }
            });
        };

        $scope.onItemPhotoClick = (item) => {
            // Unavailable options should not show their photos
            if (typeof(item.available) === 'undefined') {
                let department = getDepartmentById(item.sku_category);
                setOptionsAvailability(department);
            }
            if (item.available === false) {
                return;
            }

            $scope.view_photos = [{url:item.photo}];
            $scope.view_header = item.public_description;

            $('#photos.modal').modal({
                backdrop: 'static',
            });
        };

        // Return whether a given item is an upgrade item
        $scope.isUpgrade = (department, item) => {
            if (typeof item === 'undefined') {
                return false;
            }
            return department.upgrades.filter( i => i.id == item.id ).length;
        };

        const getDepartmentById = (departmentId) => {
            for (let category of $scope.info.items) {
                for (let department of category.departments) {
                    if (department.id == departmentId) {
                        return department;
                    }
                }
            }
        };

        $scope.onOptionSelect = (item) => {
            let department = getDepartmentById(item.sku_category);

            if (typeof(item.available) === 'undefined') {
                setOptionsAvailability(department);
            }
            // Extras items as part of show specials will be managed through the show special
            if (item.special_name || !item.available) {
                return;
            }

            if ($scope.order.items[department.id]) {
                delete $scope.order.items[department.id];
            } else {
                $scope.order.items[department.id] = item;
            }

            department.changed = true;

            setOptionsAvailability(department);
            ruleUtils.updateRules($scope);
        };

        $scope.getDepartmentsMissingSelection = (category) => {
            let result = [];

            for (let department of category.departments) {
                if ((department.selections.length > 0 || department.upgrades.length > 0) && !$scope.order.items[department.id]) {
                    result.push(department);
                }
            }

            return result;
        };

        $scope.hasSpecialFeatureForDepartment = (category, department) => {

            //for (let special_feature of $scope.order.special_features[category.id]) {
            //    if (special_feature.sku_category == department.id) {
            //        return true;
            //    }
            //}
            return false;
        }
    });
}
