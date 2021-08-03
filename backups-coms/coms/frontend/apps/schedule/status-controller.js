export default app => {

    require('./directives')(app);

    app.controller('OrderStatusController', function (
        $scope,
        $state,
        ApiService,
        Upload
    ) {

        $scope.history = {};
        $scope.new_customer_manager_id = null;
        $scope.new_sales_rep_id = null;
        $scope.loading = false;

        const formatDate = (cat, field) => {
            if ($scope.status[cat] &&
                $scope.status[cat][field] &&
                $scope.status[cat][field].data) {
                $scope.status[cat][field].data = new Date($scope.status[cat][field].data);
            }
        };

        const refreshStatus = () => {
            $scope.post('status', {
                order_id: $scope.order.id,
            }).then(
                (r) => {
                    $scope.status = r.data;
                    formatDate('delivery', 'delivery_date_set');
                    formatDate('delivery', 'warranty_date');
                    formatDate('delivery', 'pickup_date');

                    $scope.status['approval']['deposit_paid'].data = parseFloat($scope.status['approval']['deposit_paid'].data);

                    $scope.loading = false;
                }
            );

            $scope.post('status-history', {
                order_id: $scope.order.id,
            }).then(
                (r) => {
                    $scope.status_history = r.data.history;
                }
            );
        };

        refreshStatus();

        $scope.sectionComplete = (section) => {
            if (section) {
                for (let k of Object.keys(section)) {
                    if (section[k].status !== 'Complete' && section[k].status !== 'Optional') {
                        return false;
                    }
                }
                return true;
            }
        };

        const statusUpdate = (data) => {
            if ($scope.loading) {
                return;
            }

            $scope.loading = true;
            data.order_id = $scope.order.id;
            return ApiService.post('orders/status-update', data).finally(() => {
                refreshStatus();
            });
        };

        const checkValidAndUpdate = (form, field_name, field_value) => {
            if (form.$valid) {
                let data = {};
                data[field_name] = field_value;
                statusUpdate(data);
            }
        };

        $scope.updateDeposit = (form, deposit) => {
            checkValidAndUpdate(form, 'deposit', deposit);
        };

        $scope.updateChassis = () => {
            statusUpdate({'chassis_number': true});
        };

        $scope.enableChassisEdition = () => {
            $scope.editingChassis = true;
        };

        $scope.setChassis = () => {
            statusUpdate({'chassis_number': $scope.status.approval.chassis_appointed.data}).then(() => {
                $scope.editingChassis = false;
            });
        };

        $scope.updatePlannedQcDate = (form, qc_date_planned) => {
            checkValidAndUpdate(form, 'qc_date_planned', qc_date_planned);
        };

        $scope.updateActualQcDate = (form, qc_date_actual) => {
            checkValidAndUpdate(form, 'qc_date_actual', qc_date_actual);
        };

        $scope.updateVinNumber = (form, vin_number) => {
            checkValidAndUpdate(form, 'vin_number', vin_number);
        };

        $scope.updatePlannedDispatchDate = (form, dispatch_date_planned) => {
            checkValidAndUpdate(form, 'dispatch_date_planned', dispatch_date_planned);
        };

        $scope.updateActualDispatchDate = (form, dispatch_date_actual) => {
            checkValidAndUpdate(form, 'dispatch_date_actual', dispatch_date_actual);
        };

        $scope.updateDealershipReceivedDate = (form, received_date_dealership) => {
            checkValidAndUpdate(form, 'received_date_dealership', received_date_dealership);
        };

        $scope.checkErr = function(delivery_date_customer){
            $scope.errMessage = '';
            $scope.noShow = true;
            $scope.curDate = new Date();
            var dateEntered = document.getElementById("delivery_date_customer").value;
            console.log(dateEntered);
            var date = dateEntered.substring(0, 2);
            var month = dateEntered.substring(3, 5);
            var year = dateEntered.substring(6, 10);
            var dateToCompare = new Date(year, month - 1, date)

            if(dateToCompare > $scope.curDate){
                $scope.errMessage = "Delivery Date should not be greater than current date";
                alert("Delivery Date should not be greater than current date");
                $scope.noShow = false;
                return false;
            }
        };
        $scope.updateCustomerDeliveryDate = (form, delivery_date_customer) => {
            checkValidAndUpdate(form, 'delivery_date_customer', delivery_date_customer);
        };

        $scope.openWeightsModal = () => {
            $scope.status.delivery.new_weights = {data:{...$scope.status.delivery.weights.data}};
            $('#delivery_weights.modal').modal({
                backdrop: 'static',
            });
        };
        $scope.saveWeights = () => {
            statusUpdate({weights: $scope.status.delivery.new_weights}).then(() => {
                $('#delivery_weights.modal').modal('hide');
            });
        };

        $scope.updateDeliveryDate = (form, delivery_date) => {
            checkValidAndUpdate(form, 'delivery_date', delivery_date);
        };

        $scope.updateDrafter = (form, drafter) => {
            checkValidAndUpdate(form, 'drafter', drafter);
        };

        $scope.cancelFinalization = () => {
            $scope.order_finalization_cancel_reason = '';

            $('#order_finalization_cancel_reason.modal').modal({
                backdrop: 'static',
            });
        };

        $scope.processCancelFinalization = () => {
            $scope.post('cancel-finalize', {
                order_id: $scope.order.id,
                reason: $scope.order_finalization_cancel_reason,
            }).then(r => {
                $state.go('order.status', {}, {reload:true});
            });
        };

        $scope.approveCustomerPlan = () => {
            statusUpdate({
                review_customer_plan: 'approve',
                customer_plan_disclaimer_checked: $scope.status.approval.customer_plan_reviewed.customer_plan_disclaimer_checked,
                weight_estimate_disclaimer_checked: $scope.status.approval.customer_plan_reviewed.weight_estimate_disclaimer_checked,
            });
        };

        $scope.confirmRejectCustomerPlan = () => {
            $scope.customer_plan_reject_reason = '';

            $('#customer_plan_reject_reason.modal').modal({
                backdrop: 'static',
            });
        };

        $scope.processRejectCustomerPlan = () => {
            statusUpdate({
                review_customer_plan: 'reject',
                reject_reason: $scope.customer_plan_reject_reason
            });
        };

        $scope.updateDoc = (form, file_upload, type) => {
            if ($scope.loading) {
                return;
            }
            $scope.loading = true;
            switch(type) {
                case 'customer': type = 'customer_plan'; break;
                case 'factory': type = 'factory_plan'; break;
                case 'chassis': type = 'chassis_plan'; break;
                case 'contract': type = 'contract'; break;
            }
            if (form.$valid) {
                Upload.upload({
                    url: '/api/orders/status-update',
                    data: {
                        order_id: $scope.order.id,
                        upload_for: type,
                    },
                    file: file_upload,
                }).then(function (response) {
                    refreshStatus();
                }, function (resp) {
                    console.log('Error status: ' + resp.status);
                }).then(() => {
                    $scope.loading = false;
                });
            }
        };

        $scope.updateSalesforce = () => {
            statusUpdate();
        };

        $scope.updateSeparateDoc = (plan, type) => {
            if (plan && plan.is_separated) {
                statusUpdate({add_separate_doc: type});
            } else {
                $scope.deleteDoc(plan.id, type);
            }
        };

        $scope.deleteDoc = (id, type) => {
            if (type == 'customer') {
                statusUpdate({delete_customer_plan:id});
            } else if (type == 'factory') {
                statusUpdate({delete_factory_plan:id});
            } else if (type == 'chassis') {
                statusUpdate({delete_chassis_plan:id});
            } else if (type == 'contract') {
                statusUpdate({delete_contract:id});
            } else if (type == 'handover_to_driver_form') {
                statusUpdate({delete_handover_to_driver_form:id});
            } else if (type == 'handover_to_dealership_form') {
                statusUpdate({delete_handover_to_dealership_form:id});
            }
        };

        $scope.updateHistory = (form, history) => {
            if (form.$valid && history !== undefined) {
                if (history.file_upload !== undefined) {
                    Upload.upload({
                        url: '/api/orders/status-history-note',
                        data: {
                            order_id: $scope.order.id,
                            note: history.note,
                        },
                        file: history.file_upload,
                    }).then(function (response) {
                        refreshStatus();
                    }, function (resp) {
                        console.log('Error status: ' + resp.status);
                    });
                } else if (history.note) {
                    $scope.post('status-history-note', {
                        order_id: $scope.order.id,
                        note: history.note,
                    }).then( r => {
                        refreshStatus()
                    });
                }
                $scope.history = {};
            }
        };

        $scope.onOpenUpdateCustomerManager = () => {
            $('#update_customer_manager.modal').modal({
                backdrop: 'static',
            });
        };

        const getCustomerManagerList = () => {
            $scope.post('customer_manager', {
                order_id: $scope.order.id,
            }).then(
                (r) => {
                    $scope.customer_manager_list = r.data.customer_manager_list;
                }
            );
        };

        getCustomerManagerList();

        $scope.updateCustomerManager = () => {
            if (!$scope.new_customer_manager_id) {
                return;
            }
            $scope.post('customer_manager', {
                order_id: $scope.order.id,
                customer_manager_id: $scope.new_customer_manager_id
            }).then(
                (r) => {
                    $scope.order.customer_manager_name = r.data.name;
                }
            );
        };

        $scope.canChangeSalesRep = () => {
            return $scope.order.permissions && $scope.order.permissions.modify_order_sales_rep;
        };

         $scope.onOpenUpdateSalesRep = () => {
            $('#update_sales_rep.modal').modal({
                backdrop: 'static',
            });
        };

        const getSalesRepList = () => {
            if ($scope.canChangeSalesRep()) {
                $scope.post('sales_rep', {
                    order_id: $scope.order.id,
                }).then(
                    (r) => {
                        $scope.sales_rep_list = r.data.sales_rep_list;
                    }
                );
            }
        };

        getSalesRepList();

        $scope.updateSalesRep = () => {
            if (!$scope.new_sales_rep_id) {
                return;
            }
            $scope.post('sales_rep', {
                order_id: $scope.order.id,
                sales_rep_id: $scope.new_sales_rep_id
            }).then(
                (r) => {
                    $scope.order.dealer_sales_rep_name = r.data.name;
                }
            );
        };
    });
}
