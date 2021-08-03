import _ from 'lodash';

export default app => {
    app.controller('ProductionControllerExpanded', function ($location, $rootScope, $scope, $state, $stateParams, StateChangeAdvancedService) {

        $scope.expandAllCategories = () => {
            $scope.order.productionList.forEach(function (element, index, array) {
                element.IsOpen = true;
            });
        };

        $scope.order.productionList.hideVerified = false;
        $scope.toggleVerified = ($event) => {
            $scope.order.productionList.hideVerified = !$scope.order.productionList.hideVerified;
            $scope.order.productionList.forEach(function (element, index, array) {
                element.HideVerified = $scope.order.productionList.hideVerified;
            });
            if ($scope.order.productionList.hideVerified) {
                $($event.target).html('Show Verified Items');
            }
            else {
                $($event.target).html('Hide Verified Items');
            }
        }

        // ------------------------
        // Code for preserving URL parameters
        if (typeof($rootScope['productionVisibleGroups']) == 'undefined') {
            $rootScope['productionVisibleGroups'] = ""
        }

        if (typeof($rootScope['productionHiddenVerified']) == 'undefined') {
            $rootScope['productionHiddenVerified'] = ""
        }

        var pathParts = $location.path().split('/'); //['', :orderId, 'production', :visibleGroups, :hiddenVerified]

        if ($stateParams.visibleGroups == '' && $stateParams.hiddenVerified == '') {
            if (!($rootScope['productionVisibleGroups'] == "" && $rootScope['productionHiddenVerified'] == "")) {

                StateChangeAdvancedService.goNoReload($state, $stateParams, {
                    visibleGroups: $rootScope['productionVisibleGroups'],
                    hiddenVerified: $rootScope['productionHiddenVerified']
                });
            }
        } else {
            $rootScope['productionVisibleGroups'] = $stateParams.visibleGroups;
            $rootScope['productionHiddenVerified'] = $stateParams.hiddenVerified;
        }
        // ------------------------

        // ------------------------
        // Selection of group to expand
        (() => {
            var groupVisibility = {};

            for (let groupKey of $stateParams.visibleGroups.split(',')) {
                if (groupKey) groupVisibility[groupKey] = true;
            }

            $scope.updateGroupVisibility = () => {
                $scope.order.productionList.forEach(function (production) {
                    production.open = production.id in groupVisibility;

                    //TODO: check with Levi the naming convention for properties created through defineProperty
                    if (!_.has(production, 'IsOpen')) {
                        Object.defineProperty(production, "IsOpen", {
                            get: function () {
                                return production.open;
                            },
                            set: function (newValue) {
                                production.open = newValue;

                                if (newValue) {
                                    groupVisibility[production.id] = true;
                                }
                                else {
                                    if (production.id in groupVisibility) {
                                        delete groupVisibility[production.id];
                                    }
                                }

                                var newVisibleGroups = [];
                                _.forOwn(groupVisibility, (value, key) => {
                                    if (value) newVisibleGroups.push(key);
                                });
                                newVisibleGroups.sort();
                                newVisibleGroups = newVisibleGroups.join(',');

                                StateChangeAdvancedService.goNoReload($state, $stateParams, {visibleGroups: newVisibleGroups});

                                $rootScope['productionVisibleGroups'] = newVisibleGroups;
                            }
                        });
                    }

                });
            }

            $scope.updateGroupVisibility();

            $scope.isGroupVisible = (groupKey) => {
                return groupVisibility[groupKey];
            };
        })();

        // ------------------------
        // Selection of verified to show
        (() => {
            var hiddenVerified = {};

            for (let groupKey of $stateParams.hiddenVerified.split(',')) {
                if (groupKey) hiddenVerified[groupKey] = true;
            }

            $scope.updateHiddenVerified = () => {
                $scope.order.productionList.forEach(function (production) {
                    production.hideVerified = production.id in hiddenVerified;

                    //TODO: check with Levi the naming convention for properties created through defineProperty
                    if (!_.has(production, 'HideVerified')) {
                        Object.defineProperty(production, "HideVerified", {
                            get: function () {
                                return production.hideVerified;
                            },
                            set: function (newValue) {
                                production.hideVerified = newValue;

                                if (newValue) {
                                    hiddenVerified[production.id] = true;
                                }
                                else {
                                    if (production.id in hiddenVerified) {
                                        delete hiddenVerified[production.id];
                                    }
                                }

                                var newHiddenVerified = [];
                                _.forOwn(hiddenVerified, (value, key) => {
                                    if (value) newHiddenVerified.push(key);
                                });
                                newHiddenVerified.sort();
                                newHiddenVerified = newHiddenVerified.join(',');

                                StateChangeAdvancedService.goNoReload($state, $stateParams, {hiddenVerified: newHiddenVerified});

                                $rootScope['productionHiddenVerified'] = newHiddenVerified;
                            }
                        });
                    }

                });
            }

            $scope.updateHiddenVerified();

            $scope.isVerifiedHidden = (groupKey) => {
                return hiddenVerified[groupKey];
            };
        })();

        $scope.displayVerifiedShowLink = (production) => {
            return production.verifiedCount && production.hideVerified;
        }

        $scope.showVerified = (production) => {
            production.HideVerified = false;
            return false;
        }

        $scope.isRowInvisible = (production, rowItem) => {
            return (production.HideVerified && (rowItem.verification == "yes"));
        }

        $scope.incrementVerifiedCount = (category, item, value) => {
            category.verifiedCount++;
            item.previousVerification = value;
        }

        $scope.decrementVerifiedCount = (category, item, value) => {
            if (item.previousVerification === "yes")
                category.verifiedCount--;
            item.previousVerification = value;
        }
    });
}