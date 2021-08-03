export default app => {
    app.controller('ScheduleArchiveController', function (
        $scope,
        $stateParams
        /*, $http, ApiService, $state, Order, $sce*/
    ) {
        console.log('archive init', $scope);

        console.log($stateParams);

/*
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
            {
                heading: 'Resources',
                route: 'order.caravan.resources'
            },ApiService
        ];

        // Fake data for testing ui
        $scope.specials = [
            {
                title: 'January Special',
                offer: $sce.trustAsHtml('$1000 discount'),
                availability: 'For customers who complete order by 1st March',
                terms: 'These are the terms and conditions',
                terms_visible: false,
            },
            {
                title: 'Nowra Show Special',
                offer: $sce.trustAsHtml('<ul><li>1 extra tyre</li><li>Fridge upgrade</li><li>Satellite Dish</li></ul>'),
                availability: 'For Nowra show patrons',
                terms: 'These are the terms and conditions',
                terms_visible: false,
                cost: '2000',
                normal_price: '8000',
            },
            {
                title: 'Premium Colour Selection',
                offer: $sce.trustAsHtml('Upgrade to:<ul><li>Leather lounge</li><li>Marbe benchtop</li></ul>'),
                availability: 'For customers who complete order by 1st March',
                terms: 'These are the terms and conditions',
                terms_visible: false,
                cost: '0',
            }
        ];

        $scope.makeRows = (array) => {
            let rows = [];
            for(let i = 0; i < array.length; i++) {
                if (i % 3 == 0) {
                    rows.push([]);
                }
                rows[rows.length - 1].push(array[i]);
            }
        };

        $scope.getCategoryOptions = (category) => {
            let options = {
                items: [],
                category: category,
            };
            for (let key of Object.keys(category.groups)) {
                category.groups[key].options.forEach(v => options.items.push(v))
            }
            return options;
        }

        $scope.hasCategoryOptions = (category) => {
            return $scope.getCategoryOptions(category).items.length;
        };

        $scope.onOpenOptions = category => {
            $scope.data.current_options = $scope.getCategoryOptions(category);
            $('#options.modal').modal({
                backdrop: 'static',
                keyboard: false
            });
        };

        $scope.onOpenTotals = () => {
            $('#totals.modal').modal({
                backdrop: 'static',
            });
        };

        $scope.onOpenSpecials= () => {
            $('#specials.modal').modal({
                backdrop: 'static',
            });
        };

        $scope.onOpenSeriesPhotos = () => {
            $scope.view_photos = $scope.info.series_detail.photos;
            $scope.view_info = '';
            $('#photos.modal').modal({
                backdrop: 'static',
            });
        };

        $scope.onOpenSeriesPlans = () => {
            $scope.view_photos = $scope.info.series_detail.plans;
            $scope.view_info = '';
            $('#photos.modal').modal({
                backdrop: 'static',
            });
        };

        $scope.onItemPhotoClick = (item) => {
            $scope.view_photos = [item.photo];
            $scope.view_info = item.title;
            $('#photos.modal').modal({
                backdrop: 'static',
            });
        };

        // Return whether a given item is an upgrade item
        $scope.isUpgrade = (group, item) => {
            if (typeof item === 'undefined') {
                return false;
            }
            return group.upgrades.filter( x => x.id == item.id ).length;
        };

        $scope.hasAddedSpecials = () => {
            return $scope.specials.filter( x => x.applied ).length;
        };

        $scope.onOptionSelect = item => {
            if (typeof $scope.data.current_options.category.selected_options === 'undefined') {
                $scope.data.current_options.category.selected_options = [];
            }
            if (typeof item.selected === 'undefined') {
                item.selected = true;
                $scope.data.current_options.category.selected_options.push(item);
            } else {
                item.selected = !item.selected;
                if (item.selected) {
                    $scope.data.current_options.category.selected_options.push(item);
                } else {
                    $scope.data.current_options.category.selected_options =
                        $scope.data.current_options.category.selected_options.filter( e => e.id != item.id );
                }
            }
        };

        // Make sure each group has at least one selected item
        $scope.checkFeatures = () => {
            $scope.selection_errors = [];
            for (let catKey of Object.keys($scope.info.items)) {
                for (let grpKey of Object.keys($scope.info.items[catKey].groups)) {
                    if ($scope.info.items[catKey].groups[grpKey].selections.length +
                        $scope.info.items[catKey].groups[grpKey].upgrades.length == 0) {
                        return;
                    }

                    if (typeof $scope.info.items[catKey].groups[grpKey].selected_item === 'undefined') {
                        let catName = $scope.info.items[catKey].title;
                        let groupName = $scope.info.items[catKey].groups[grpKey].title;
                        $scope.selection_errors.push([catName, groupName]);
                    }
                }
            }
        };*/
    });
}