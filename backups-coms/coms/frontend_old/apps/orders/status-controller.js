export default app => {

    require('./directives')(app);

    app.controller('OrderStatusController', function(
        $scope,
        $state,
        ApiService,
        Upload
    ) {

        $scope.history = {};
        $scope.new_customer_manager_id = null;
        $scope.new_sales_rep_id = null;
        $scope.loading = false;
        $scope.cert_loading = false;
        $scope.test_date = new Date();
        $scope.chassis_variable=true;
        $scope.chassis_date_control=new Date();
        $scope.production_date_control = new Date();
        $scope.building_date_control= new Date() ;

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
                    // $scope.chassis_variable=true;
                    // console.log( 'Enter Value ' +$scope.chassis_variable);
                    // status.approval.senior_designer_verfied_date.data
                    // console.log($scope.status.approval.senior_designer_verfied_date.data);
                    if ( $scope.status.approval.senior_designer_verfied_date.data    )
                    {
                    $scope.senior_designer_date_control = string_to_js_date_parser($scope.status.approval.senior_designer_verfied_date.data);
                    }
                    else
                    {
                        $scope.senior_designer_date_control='';
                    }

                     if ( $scope.status.approval.purchase_order_raised_date.data    )
                    {
                    $scope.purchase_order_date_control = string_to_js_date_parser($scope.status.approval.purchase_order_raised_date.data);
                    }
                    else
                    {
                        $scope.purchase_order_date_control='';
                    }


                    if ( $scope.status.delivery.actual_production_date.data    )
                    {
                    $scope.production_date_control = string_to_js_date_parser($scope.status.delivery.actual_production_date.data);
                    }
                    else
                    {
                        $scope.production_date_control='';
                    }

                    if ($scope.status.delivery.chassis_section.data)
                    {
                    $scope.chassis_date_control = string_to_js_date_parser($scope.status.delivery.chassis_section.data);
                    }else
                    {
                    $scope.chassis_date_control='';
                    }

                    if ($scope.status.delivery.building.data)
                    {
                    $scope.building_date_control = string_to_js_date_parser($scope.status.delivery.building.data);
                    }else
                    {
                    $scope.building_date_control='';
                    }

                    if ($scope.status.delivery.prewire_section.data)
                    {
                        $scope.prewire_date_control = string_to_js_date_parser($scope.status.delivery.prewire_section.data);
                    }else
                    {
                        $scope.prewire_date_control='';
                    }

                    if ($scope.status.delivery.plumbing_date.data)
                    {
                        $scope.plumbing_date_control = string_to_js_date_parser($scope.status.delivery.plumbing_date.data);
                    }else
                    {
                        $scope.plumbing_date_control='';
                    }

                    if ($scope.status.delivery.aluminium.data)
                    {
                        $scope.aluminium_date_control = string_to_js_date_parser($scope.status.delivery.aluminium.data);
                    }else
                    {
                        $scope.aluminium_date_control='';
                    }

                    if ($scope.status.delivery.finishing.data)
                    {
                        $scope.finishing_date_control = string_to_js_date_parser($scope.status.delivery.finishing.data);
                    }else
                    {
                        $scope.finishing_date_control='';
                    }

                    if ($scope.status.delivery.detailing_date.data)
                    {
                        $scope.detailing_date_control = string_to_js_date_parser($scope.status.delivery.detailing_date.data);
                    }else
                    {
                        $scope.detailing_date_control='';
                    }


                    if ($scope.status.delivery.watertest_date.data)
                    {
                        $scope.watertest_date_control = string_to_js_date_parser($scope.status.delivery.watertest_date.data);
                    }else
                    {
                        $scope.watertest_date_control='';
                    }

                    if ($scope.status.delivery.final_qc_date.data)
                    {
                        $scope.final_qc_date_control = string_to_js_date_parser($scope.status.delivery.final_qc_date.data);
                    }else
                    {
                        $scope.final_qc_date_control='';
                    }


                    if ($scope.status.delivery.dispatch_date_planned.data)
                    {
                        $scope.dispatch_date_planned_control = string_to_js_date_parser($scope.status.delivery.dispatch_date_planned.data);
                    }else
                    {
                        $scope.dispatch_date_planned_control='';
                    }

                    if ($scope.status.delivery.collection_date.data)
                    {
                        $scope.collection_date_control = string_to_js_date_parser($scope.status.delivery.collection_date.data);
                    }else
                    {
                        $scope.collection_date_control='';
                    }

                    if ($scope.status.delivery.dispatch_date_actual.data)
                    {
                        $scope.dispatch_date_actual_control = string_to_js_date_parser($scope.status.delivery.dispatch_date_actual.data);
                    }else
                    {
                        $scope.dispatch_date_actual_control='';
                    }

                    if ($scope.status.delivery.received_date_dealership.data)
                    {
                        $scope.received_date_dealership_control = string_to_js_date_parser($scope.status.delivery.received_date_dealership.data);
                    }else
                    {
                        $scope.received_date_dealership_control='';
                    }

                    if ($scope.status.delivery.delivery_date_customer.data)
                    {
                        $scope.delivery_date_customer_control = string_to_js_date_parser($scope.status.delivery.delivery_date_customer.data);
                    }else
                    {
                        $scope.delivery_date_customer_control='';
                    }

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

        const refreshCerts = () => {
            
            // console.log('status - docs');
            
            $scope.loading = false;

            $scope.post('status-docs', {
                order_id: $scope.order.id,
            }).then(
                (r) => {
                    $scope.status_docs = r.data.docs_data;
                    // console.log($scope.status_docs);
                }
            );
        };
        
        refreshStatus();

        refreshCerts();

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
                refreshCerts();
            });
        };

        const checkValidAndUpdate = (form, field_name, field_value) => {
            // if (form.$valid) {
                console.log(field_name + " : " + field_value);
                let data = {};
                data[field_name] = field_value;
                console.log( ' Data ' , data );
                statusUpdate(data);
            // }
        };

        const statusDelete = (data) => {
            if ($scope.loading) {
                return;
            }

            $scope.loading = true;
            data.order_id = $scope.order.id;
            return ApiService.post('orders/status-delete', data).finally(() => {
                refreshStatus();
            });
        };

        const checkValidAndDelete = (form, field_name, field_value) => {
            if (form.$valid) {
                let data = {};
                data[field_name] = field_value;
                statusDelete(data);
            }
        };

        $scope.updateDeposit = (form, deposit) => {
            checkValidAndUpdate(form, 'deposit', deposit);
        };

        $scope.updateChassis = () => {
            statusUpdate({ 'chassis_number': true });
        };

        $scope.enableChassisEdition = () => {
            $scope.editingChassis = true;
        };

        $scope.setChassis = () => {
            statusUpdate({ 'chassis_number': $scope.status.approval.chassis_appointed.data }).then(() => {
                $scope.editingChassis = false;
            });
        };

        $scope.deleteActualProdDate = (form, actual_production_date) => {
            checkValidAndDelete(form, 'del_actual_production_date', actual_production_date);
        };

        $scope.deleteChassisSection = (form, chassis_section) => {
            checkValidAndDelete(form, 'del_chassis_section', chassis_section);
        };

        $scope.deleteBuildingSection = (form, building) => {
            checkValidAndDelete(form, 'del_building', building);
        };


        $scope.deletePrewireSection = (form, prewire_section) => {
            checkValidAndDelete(form, 'del_prewire_section', prewire_section);
        };

        $scope.deletePlumbingDate = (form, plumbing_date) => {
            checkValidAndDelete(form, 'del_plumbing_date', plumbing_date);
        };

        $scope.deleteAluminiumSection = (form, aluminium) => {
            checkValidAndDelete(form, 'del_aluminium', aluminium);
        };

        $scope.deleteFinishing = (form, finishing) => {
            checkValidAndDelete(form, 'del_finishing', finishing);
        };

        $scope.deleteWatertestDate = (form, watertest_date) => {
            checkValidAndDelete(form, 'del_watertest_date', watertest_date);
        };

        $scope.deleteWeighbridgeDate = (form, weigh_bridge_date) => {
            checkValidAndDelete(form, 'del_weigh_bridge_date', weigh_bridge_date);
        };

        $scope.deleteDetailingDate = (form, del_detailing_date) => {
            checkValidAndDelete(form, 'del_detailing_date', del_detailing_date);
        };

        $scope.deleteActualQC = (form, qc_date_actual) => {
            checkValidAndDelete(form, 'del_qc_date_actual', qc_date_actual);
        };

        $scope.deleteFinalQC = (form, final_qc_date) => {
            checkValidAndDelete(form, 'del_final_qc_date', final_qc_date);
        };

        $scope.deleteActualDispatchDate = (form, dispatch_date_actual) => {
            checkValidAndDelete(form, 'del_dispatch_date_actual', dispatch_date_actual);
        };

        $scope.updateActualProductionDate = (form, actual_production_date) => {
            // console.log('Select Date format : ', $scope.test_date);
            //  let d = actual_production_date;
            // let currDate = d.getDate();
            // let currMonth = d.getMonth()+1;
            // let currYear = d.getFullYear();
            // let desired_format= currDate + "/" + currMonth + "/" + currYear;

            // console.log(desired_format + ' Converted Date format' + actual_production_date);

            let desired_format = date_control_to_string_date(actual_production_date);
            
            // console.log(actual_production_date + " : " + desired_format);

            checkValidAndUpdate(form, 'actual_production_date', desired_format);
        };



        $scope.updateActualProductionComments = (form, actual_production_comments) => {
            checkValidAndUpdate(form, 'actual_production_comments', actual_production_comments);
        };

        // Chassis section
        $scope.updateChassisSectionDate = (form, chassis_section) => {

            let desired_format = date_control_to_string_date(chassis_section);
            
            // console.log(chassis_section + " : " + desired_format);

            checkValidAndUpdate(form, 'chassis_section', desired_format);

            
        };

        $scope.updateChassisSectionComments = (form, chassis_section_comments) => {
            checkValidAndUpdate(form, 'chassis_section_comments', chassis_section_comments);
        };

        // Building
        $scope.updateBuildingDate = (form, building) => {

            let desired_format = date_control_to_string_date(building);
            
            checkValidAndUpdate(form, 'building', desired_format);
        };

        $scope.updateBuildingComments = (form, building_comments) => {
            checkValidAndUpdate(form, 'building_comments', building_comments);
        };
        // Prewire
        $scope.updatePrewireDate = (form, prewire_date) => {
            
            let desired_format = date_control_to_string_date(prewire_date);

            checkValidAndUpdate(form, 'prewire_section', desired_format);
        };
        $scope.updatePrewireComments = (form, prewire_comments) => {
            checkValidAndUpdate(form, 'prewire_comments', prewire_comments);
        };

        // Plumbing
        $scope.updatePlumbingDate = (form, plumbing_section_date) => {

            let desired_format = date_control_to_string_date(plumbing_section_date);
            checkValidAndUpdate(form, 'plumbing_date', desired_format);
        };

        $scope.updatePlumbingComments = (form, plumbing_comments) => {
            checkValidAndUpdate(form, 'plumbing_comments', plumbing_comments);
        };
        // Aluminium
        $scope.updateAluminiumDate = (form, aluminium_date) => {

            let desired_format = date_control_to_string_date(aluminium_date);
            checkValidAndUpdate(form, 'aluminium', desired_format);
        };
        $scope.updateAluminiumComments = (form, aluminium_comments) => {
            checkValidAndUpdate(form, 'aluminium_comments', aluminium_comments);
        };
        // Finishing
        $scope.updateFinishingDate = (form, finishing_date) => {
            let desired_format = date_control_to_string_date(finishing_date);
            checkValidAndUpdate(form, 'finishing', desired_format);
        };
        $scope.updateFinishingComments = (form, finishing_comments) => {
            checkValidAndUpdate(form, 'finishing_comments', finishing_comments);
        };

        $scope.updateWatertestDate = (form, watertest_section_date) => {
            let desired_format = date_control_to_string_date(watertest_section_date);
            checkValidAndUpdate(form, 'watertest_date', desired_format);
        };
        $scope.updateWatertestComments = (form, watertest_comments) => {
            checkValidAndUpdate(form, 'watertest_comments', watertest_comments);
        };

        $scope.updateWeighbridgeDate = (form, weigh_bridge_date) => {
            checkValidAndUpdate(form, 'weigh_bridge_date', weigh_bridge_date);
        };
        $scope.updateWeighbridgeComments = (form, weigh_bridge_comments) => {
            checkValidAndUpdate(form, 'weigh_bridge_comments', weigh_bridge_comments);
        };

        $scope.updateDetailingDate = (form, detailing_section_date) => {

            let desired_format = date_control_to_string_date(detailing_section_date);
            checkValidAndUpdate(form, 'detailing_date', desired_format);
        };
        $scope.updateDetalingComments = (form, detailing_comments) => {
            checkValidAndUpdate(form, 'detailing_comments', detailing_comments);
        };

        $scope.updatePlannedQcDate = (form, qc_date_planned) => {
            // let desired_format = date_control_to_string_date(qc_date_planned);
            checkValidAndUpdate(form, 'qc_date_planned', qc_date_planned);
        };

        $scope.updateActualQcDate = (form, qc_date_actual) => {
            // let desired_format = date_control_to_string_date(qc_date_actual);
            checkValidAndUpdate(form, 'qc_date_actual', qc_date_actual);
        };

        $scope.updateQCComments = (form, qc_comments) => {
            checkValidAndUpdate(form, 'qc_comments', qc_comments);
        };

        $scope.updatePlannedWatertestDate = (form, planned_watertest_date) => {
            // let desired_format = date_control_to_string_date(planned_watertest_date);
            checkValidAndUpdate(form, 'planned_watertest_date', planned_watertest_date);
        };

        $scope.updateActualWatertestDate = (form, actual_watertest_date) => {
            checkValidAndUpdate(form, 'actual_watertest_date', actual_watertest_date);
        };

        $scope.updateWatertestComments = (form, watertest_comments) => {
            checkValidAndUpdate(form, 'watertest_comments', watertest_comments);
        };

        $scope.updateFinalQcDate = (form, final_qc_date) => {
            let desired_format = date_control_to_string_date(final_qc_date);
            checkValidAndUpdate(form, 'final_qc_date', desired_format);
        };

        $scope.updateFinalQcComments = (form, final_qc_comments) => {
            checkValidAndUpdate(form, 'final_qc_comments', final_qc_comments);
        };
        $scope.updateSeniorDesigner = (form, senior_designer_verfied_date) => {
            let desired_format = date_control_to_string_date(senior_designer_verfied_date);
            checkValidAndUpdate(form, 'senior_designer_verfied_date', desired_format);

        };


        $scope.updatePurchaseOrderRaised = (form, purchase_order_raised_date) => {
            let desired_format = date_control_to_string_date(purchase_order_raised_date);
            checkValidAndUpdate(form, 'purchase_order_raised_date', desired_format);
        };


        $scope.updateVinNumber = (form, vin_number) => {
            checkValidAndUpdate(form, 'vin_number', vin_number);
        };

        $scope.updatePlannedDispatchDate = (form, dispatch_date_planned) => {
            checkValidAndUpdate(form, 'dispatch_date_planned', dispatch_date_planned);
        };

        $scope.updateActualDispatchDate = (form, dispatch_date_actual) => {
            let desired_format = date_control_to_string_date(dispatch_date_actual);
            // console.log(dispatch_date_actual + ' : ' + desired_format);
            checkValidAndUpdate(form, 'dispatch_date_actual', desired_format);
        };

        $scope.updateDispatchComments = (form, dispatch_comments) => {
            checkValidAndUpdate(form, 'dispatch_comments', dispatch_comments);
        };

        $scope.updateCollectionDate = (form, collection_date) => {

            let desired_format = date_control_to_string_date(collection_date);
            checkValidAndUpdate(form, 'collection_date', desired_format);

        };

        $scope.updateCollectionComments = (form, collection_comments) => {
            checkValidAndUpdate(form, 'collection_comments', collection_comments);
        };

        $scope.updateDealershipReceivedDate = (form, received_date_dealership) => {
            let desired_format = date_control_to_string_date(received_date_dealership);
            // console.log(received_date_dealership + ' : ' + desired_format);
            checkValidAndUpdate(form, 'received_date_dealership', desired_format);
        };

        // $scope.checkErr = function(delivery_date_customer) {
        //     $scope.errMessage = '';
        //     $scope.noShow = true;
        //     $scope.curDate = new Date();
        //     var dateEntered = document.getElementById("delivery_date_customer").value;
        //     var date = dateEntered.substring(0, 2);
        //     var month = dateEntered.substring(3, 5);
        //     var year = dateEntered.substring(6, 10);
        //     var dateToCompare = new Date(year, month - 1, date)

        //     if (dateToCompare > $scope.curDate) {
        //         $scope.errMessage = "Delivery Date should not be greater than current date";
        //         alert("Delivery Date should not be greater than current date");
        //         $scope.noShow = false;
        //         return false;
        //     }
        // };
        $scope.updateCustomerDeliveryDate = (form, delivery_date_customer) => {
            let desired_format = date_control_to_string_date(delivery_date_customer);
            checkValidAndUpdate(form, 'delivery_date_customer', desired_format);
        };

        $scope.openWeightsModal = () => {
            $scope.status.delivery.new_weights = { data: {...$scope.status.delivery.weights.data } };
            $('#delivery_weights.modal').modal({
                backdrop: 'static',
            });
        };
        $scope.saveWeights = () => {
            statusUpdate({ weights: $scope.status.delivery.new_weights }).then(() => {
                $('#delivery_weights.modal').modal('hide');
            });
        };

        $scope.updateDeliveryDate = (form, delivery_date) => {
            let desired_format = date_control_to_string_date(delivery_date);
            checkValidAndUpdate(form, 'delivery_date', desired_format);
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
                $state.go('order.status', {}, { reload: true });
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
            // console.log('Uploaded Doc ' + type + " : " + $scope.certificate_note);
            if ($scope.cert_loading) {
                return;
            }
            $scope.cert_loading = true;
            switch (type) {
                case 'customer':
                    type = 'customer_plan';
                    $scope.certificate_note='Customer Plan';
                    break;
                case 'factory':
                    type = 'factory_plan';
                    $scope.certificate_note='';
                    break;
                case 'chassis':
                    type = 'chassis_plan';
                    $scope.certificate_note='';
                    break;
                case 'contract':
                    type = 'contract';
                    $scope.certificate_note='';
                    break;
                case 'plumbing':
                    type = 'plumbing';
                    break;
                case 'electrical':
                    type = 'electrical';
                    break;
                case 'weighbridge':
                    type = 'weighbridge';
                    break;
                case 'qualitycontrol':
                    type = 'qualitycontrol';
                    break;
                 case 'others':
                    type = 'others';
                    break;
            }

            if (form.$valid) {
                Upload.upload({
                    url: '/api/orders/status-update',
                    data: {
                        order_id: $scope.order.id,
                        certificate_title:$scope.certificate_note,
                        upload_for: type,
                    },
                    file: file_upload,
                }).then(function(response) {
                    // console.log('Response Re entered');
                    refreshStatus();
                    refreshCerts();
                    
                }, function(resp) {}).then(() => {
                    $scope.cert_loading = false;
                    $scope.loading=false;
                    // console.log('Loading Complete Status : ' + $scope.cert_loading);
                });
            }
        };

        $scope.updateSalesforce = () => {
            statusUpdate();
        };

        $scope.checkcertvalue = () => {
            if ($scope.certificate_type == "others")
            {
                return true;
            }else
            {
                return false;
            }
        };

        // Converts String Date to Javascript Date Object 
        const string_to_js_date_parser = (string_date) => {

            // console.log( ' Input Date ', string_date );

            
            var incoming_date = string_date;

            var date = incoming_date.substring(0, 2);
            var month = incoming_date.substring(3,   5);
            var year = incoming_date.substring(6, 10);
            var formatted_date = new Date(year, month - 1, date);
            // console.log('Form Date :' +formatted_date);
            
            return formatted_date;
        };

        // Converts String Date to Javascript Date Object 
        const date_control_to_string_date = (date_control_date) => {

            // console.log( ' Selected Date ', date_control_date );

            
            let d = date_control_date;
            let currDate = d.getDate();
            let currMonth = d.getMonth()+1;
            let currYear = d.getFullYear();
            let desired_format= currDate + "/" + currMonth + "/" + currYear;

            // console.log( ' Converted Date format' + desired_format );
            // checkValidAndUpdate(form, 'actual_production_date', desired_format);
            
            return desired_format ;
        };

        $scope.check_date_value = () => {
            console.log('Date Test');
            console.log($scope.status.delivery.actual_production_date.data);
            var incoming_date = $scope.status.delivery.actual_production_date.data;
            var date = incoming_date.substring(0, 2);
            var month = incoming_date.substring(3,   5);
            var year = incoming_date.substring(6, 10);
            var formatted_date = new Date(year, month - 1, date);
            // console.log('Form Date :' +formatted_date);
            // $scope.status.delivery.actual_production_date = formatted_date 
            $scope.test_date= formatted_date;
            // document.getElementById('test_value').valueAsDate = formatted_date;
            // document.getElementById('my_date').valueAsDate = formatted_date;
            // console.log($scope.test_date);
            return true;
        };
           

        $scope.emptyfun = () => {
            console.log('Do Nothing ! ');
        };

        $scope.set_date_format = () => {
            console.log('Selected Date ' + $scope.test_date);
             let d = $scope.test_date
            let currDate = d.getDate();
            let currMonth = d.getMonth()+1;
            let currYear = d.getFullYear();
            let desired_format= currDate + "/" + currMonth + "/" + currYear;
            console.log('Date Requried : ' , desired_format);
            $scope.status.delivery.actual_production_date=desired_format;
            console.log('Date Var Changed : ' , $scope.status.delivery.actual_production_date);
            // $scope.status.delivery.actual_production_date.data=desired_format;
        }

        $scope.populateText = () => {
          
            if($scope.certificate_type=="plumbing")
                $scope.certificate_note ="Plumbing Certificate";
            if($scope.certificate_type=="electrical")
                $scope.certificate_note ="Electrical Certificate";
            if($scope.certificate_type=="weighbridge")
                $scope.certificate_note ="Weigh Bridge Certificate";
            if($scope.certificate_type=="qualitycontrol")
                $scope.certificate_note ="Quality Control Certificate";
            if($scope.certificate_type=="others")
                $scope.certificate_note ="Other Certificates";


        };
                

        $scope.updateSeparateDoc = (plan, type) => {
            if (plan && plan.is_separated) {
                statusUpdate({ add_separate_doc: type });
            } else {
                $scope.deleteDoc(plan.id, type);
            }
        };

        $scope.deleteDoc = (id, type) => {
            $scope.cert_loading=true;
            if (type == 'customer') {
                statusUpdate({ delete_customer_plan: id });
            } else if (type == 'factory') {
                statusUpdate({ delete_factory_plan: id });
            } else if (type == 'chassis') {
                statusUpdate({ delete_chassis_plan: id });
            } else if (type == 'contract') {
                statusUpdate({ delete_contract: id });
            } else if (type == 'handover_to_driver_form') {
                statusUpdate({ delete_handover_to_driver_form: id });
            } else if (type == 'handover_to_dealership_form') {
                statusUpdate({ delete_handover_to_dealership_form: id });
            } else if (type == 'order_certificate_form') {
                statusUpdate({ delete_order_certificate_form: id });
            }
            $scope.cert_loading=false;
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
                    }).then(function(response) {
                        refreshStatus();
                    }, function(resp) {});
                } else if (history.note) {
                    $scope.post('status-history-note', {
                        order_id: $scope.order.id,
                        note: history.note,
                    }).then(r => {
                        refreshStatus();
                    });
                }
                $scope.history = {};
            }
        };

        $scope.updateCertificate = (form, history) => {
            if (form.$valid && history !== undefined) {
                if (history.file_upload !== undefined) {
                    Upload.upload({
                        url: '/api/orders/status-history-note',
                        data: {
                            order_id: $scope.order.id,
                            note: history.note,
                        },
                        file: history.file_upload,
                    }).then(function(response) {
                        refreshStatus();
                    }, function(resp) {});
                } else if (history.note) {
                    $scope.post('status-history-note', {
                        order_id: $scope.order.id,
                        note: history.note,
                    }).then(r => {
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

         $scope.canDeleteCertificates = () => {
            // console.log('Senior View ' + $scope.status.permissions.view_status_senior_designer_verfied_date);
            // console.log('Senior Update ' + $scope.status.permissions.can_update_senior_designer_verfied_date);
            // console.log('Purchase View ' + $scope.status.permissions.view_status_purchase_order_raise_date);
            // console.log('Purchase Update ' + $scope.status.permissions.can_update_purchase_order_raised_date);
            // console.log('Delete ' + $scope.status.permissions.can_delete_certificates);
            return  $scope.status.permissions.can_delete_certificates;
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
                sales_rep_id: $scope.new_sales_rep_id,
            }).then(
                (r) => {
                    $scope.order.dealer_sales_rep_name = r.data.name;
                }
            );
        };
    });
}