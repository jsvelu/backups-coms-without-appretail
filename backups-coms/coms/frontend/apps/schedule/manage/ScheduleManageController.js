import _ from 'lodash';

export default app => {

    require('./ScheduleReferenceDataService')(app);

    app.controller('ScheduleManageController', function (
        $scope,
        $log,
        $state,
        $stateParams,
        $filter,
        $templateCache,
        AppSettings,
        ScheduleApiService,
        ScheduleReferenceDataService
    ) {
        // redirect to insert default params
        if ($stateParams.from > $stateParams.to) {
            $state.go($state.current,
                {
                    from: $stateParams.to,
                    to: $stateParams.from,
                },
                { location: 'replace' }
            );
            return;
        }

        // ------------------------
        // Data source filters
        $scope.dateFrom = $stateParams.from;
        $scope.dateTo = $stateParams.to;
        $scope.search = $stateParams.search || '';

        $scope.newDateFrom = $scope.dateFrom;
        $scope.newDateTo = $scope.dateTo;
        $scope.newSearch = $scope.search;

        // ------------------------
        // Data (async ajax load on page load)
        $scope.weeks = [];
        var capacities = {}
        var utilization = {}

        $scope.refData = ScheduleReferenceDataService;

        $scope.reloadData = (orderId) => {
            if (orderId) {
                $log.debug('loading', orderId);
                ScheduleApiService.getScheduleData(orderId).then(order => {
                    $log.debug('got', order);

                    var week = _.find($scope.weeks, _.matchesProperty('weekKey', order.weekKey));
                    if (!week) return;
                    var orderPos = _.findIndex(week.orders, _.matchesProperty('orderId', order.orderId));
                    if (orderPos == -1) return;
                    week.orders[orderPos] = order;

                    $scope.$broadcast('scheduleOrdersUpdated');
                })
            } else {
                $log.debug('loading all');
                ScheduleApiService.getScheduleListData($scope.dateFrom, $scope.dateTo, $scope.search)
                    .then((data) => {
                        $scope.refData.setReferenceData(data.referenceData);

                        $scope.dateFrom = data.dateFrom;
                        $scope.dateTo = data.dateTo;

                        $scope.weeks = data.weeks;
                        capacities = data.capacities;
                        utilization = data.utilization;

                        $scope.changeBuildDate.selectableBuildDateMin = data.selectableBuildDateMin;
                        $scope.changeBuildDate.selectableBuildDateMax = data.selectableBuildDateMax;

                        $scope.$broadcast('scheduleOrdersUpdated');
                    });
            }
        };

        $scope.reloadData();

        // used for child views that order data has been updated
        $scope.orderDataReloaded = () => { };


        $scope.getCapacity = (buildDate) => {
            var buildDate = $filter('date')(buildDate, AppSettings.FORMAT_DATE_ISO_JS);
            return (capacities[buildDate] || 0);
        };

        $scope.remainingCapacity = (buildDate) => {
            /**
             * How much remaining capacity is there for buildDate?
             * Will be negative if overallocated
             */
            var buildDate = $filter('date')(buildDate, AppSettings.FORMAT_DATE_ISO_JS);
            return (capacities[buildDate] || 0) - (utilization[buildDate] || 0);
        }


        // ------------------------
        $scope.updateFilters = () => {
            if ($scope.newDateFrom.valueOf() != $scope.dateFrom.valueOf()
                || $scope.newDateTo.valueOf() != $scope.dateTo.valueOf()
                || $scope.newSearch.trim() != $scope.search.trim())
            {
                $state.go($state.current, {
                    from: $scope.newDateFrom,
                    to: $scope.newDateTo,
                    search: $scope.newSearch.trim(),
                });
            }
        };

        // ------------------------
        // This clears all existing popups.
        //
        // popover-trigger="outsideClick" just flat out doesn't work (the popup opens but never closes when you click
        // on something). focus works for click-away but if you click inside the popup then it closes so form controls
        // don't work.
        //
        // angular-ui's solution is to manage it yourself. https://github.com/angular-ui/bootstrap/issues/3855
        $scope.clearPopups = () => {
            $scope.changeBuildDate.clearPopup();
            $scope.buildNotes.clearPopup();
        };

        // ------------------------
        // Change build Date
        $templateCache.put('schedule-change-build-date.html', require('./schedule-change-build-date.html'));

        // This isn't in its own directive because of the unexpected way uib-popover-template works;
        // (IMO it should have been designed to transclude the content inside it)
        $scope.changeBuildDate = (() => {
            var currentOrderId =  null;

            var self = {
                buildDate: null,
                originalBuildDate: null,
                buildPriorityId: null,
                selectableBuildDateMin: null,
                selectableBuildDateMax: null,
            };

            self.open = (order) => {
                if (self.isEditing(order.orderId)) return;

                $scope.clearPopups();

                // we do this to ensure that the existing one is deleted before creating the next one
                currentOrderId = order.orderId;
                self.originalBuildDate = order.buildDate;
                self.buildDate = order.buildDate;
                self.buildPriorityId = order.buildPriorityId;
            };

            self.isEditing = (orderId) => {
                return currentOrderId == orderId;
            };

            self.clearPopup = () => {
                currentOrderId = null;
            };


            self.isBuildDateAllowed = (buildDate) => {
                /**
                 * Are we allowed to select date?
                 */
                return $scope.getCapacity(buildDate) > 0
                    || buildDate.valueOf() == self.originalBuildDate.valueOf();
            };

            self.isBuildDateFull = (buildDate) => {
                /**
                 * Is specified build date full?
                 * If date is not specified, will use currently selected date
                 */
                buildDate = buildDate || self.buildDate;
                // need to account for the fact this order took up one slot on the original date
                var adjustRemainingCapacity = (buildDate.valueOf() == self.originalBuildDate.valueOf()) ? 1 : 0;
                return $scope.remainingCapacity(buildDate) + adjustRemainingCapacity <= 0;
            };

            self.getBuildDateSelectionClass = (buildDate) => {
               var classes = [];
                if (buildDate < self.selectableBuildDateMin) {
                    classes = 'calendar-select-outofrange';
                } else if (buildDate > self.selectableBuildDateMax) {
                    classes = 'calendar-select-outofrange';
                } else if ($scope.getCapacity(buildDate) <= 0) {
                    classes = 'calendar-select-capacity-none';
                } else if (self.isBuildDateFull(buildDate)) {
                    classes = 'calendar-select-capacity-full';
                }
                return classes;
            };


            self.submitOrder = (order) => {
                order.buildDate = self.buildDate;
                order.buildWeek = parseInt($filter('date')(order.buildDate, 'w'), 10);
                order.buildPriorityId = self.buildPriorityId;
                currentOrderId = null;

                 ScheduleApiService
                    .setOrderDatePriority(order.orderId, order.buildDate, order.buildPriorityId)
                    .finally(() => {
                        // if the date has changed, capacities etc may have changed too so we
                        // reload everything
                        $scope.reloadData();
                    });
            };

            self.cancelEdit = () => {
                currentOrderId = null;
            };

            return self;

        })();

        // ------------------------
        // Change Build Priority
        $scope.onPriorityChange = (order) => {
            ScheduleApiService
                .setOrderPriority(order.orderId, order.buildPriorityId)
                .finally(() => {
                    $scope.reloadData(order.orderId);
                });
        };

        $scope.saveCompletionOverride = (order, checklistCompletion, overrideValue) => {
            ScheduleApiService
                .setBuildOverride(
                    order.orderId,
                    checklistCompletion.checklistId,
                    overrideValue
                )
                .finally(() => {
                    $scope.reloadData(order.orderId);
                });
        };

        // ------------------------
        // Build Notes
        $templateCache.put('schedule-build-notes.html', require('./schedule-build-notes.html'));
        $scope.buildNotes = (() => {
            var currentOrderId = null;
            var currentChecklistId = null;
            var self = {
                title: 'Build Notes',
                newBuildNoteText: '',
            };

            self.isOpen = (order, checklist) => {
                return currentOrderId == order.orderId &&
                    currentChecklistId == checklist.checklistId;
            };

            self.clearPopup = () => {
                currentOrderId = null;
                currentChecklistId = null;
            };

            self.open = (order, checklist) => {
                if (self.isOpen(order, checklist)) return;
                $scope.clearPopups();
                currentOrderId = order.orderId;
                currentChecklistId = checklist.checklistId;
                self.newBuildNoteText = '';
            };

            self.submitNote = (order, checklist) => {
                ScheduleApiService
                    .postBuildNote(
                        order.orderId,
                        checklist.checklistId,
                        self.newBuildNoteText.trim()
                    )
                    .finally(() => {
                        console.log('reloading');
                        $scope.reloadData(order.orderId);
                    });
                self.clearPopup();
            };

            return self;
        })();
        $scope.notesClick = (orderId, checklistId) => {
            $scope.buildNotesPopup.orderId = orderId;
            $scope.buildNotesPopup.checklistId = checklistId;
            //console.log(orderId, checklistId);
        };
    });
}
