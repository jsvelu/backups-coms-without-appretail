import * as common from '../../../test-e2e/common';
import * as orders from './orders.pages';
import * as showroom from './showroom.pages';
import * as newage from '../../../nac/newage/protractor/newage.pages';
import * as schedule from '../../../nac/schedule/protractor/schedule.pages'

describe('Test order flows page', () => {
    const modelList = ['Select Model', 'Commando', 'Manta Ray', 'Oz Classic', 'Wallaby'];
    const seriesList = ['Select Series', "15' Ensuite (BARR-15ENS)", "16' Bunk Combo (BARR-16BUN)"];
    const selectedModel = 'Wallaby';
    const selectedModelValue = 'number:9';
    const selectedSeries = "15' Ensuite (BARR-15ENS)";
    const selectedSeriesValue = 'number:2';
    const selectedDeliveryMonth = 'Nov 2016';
    const selectedStockValue = 'number:1';

     const createAndSelectInitalOrderItems = () => {
        // Order creation
        let createOrderPage = new orders.NewOrderPage();
        createOrderPage.loadUsingMenuLink();
        createOrderPage.desiredDeliveryMonth.element(by.cssContainingText('option', selectedDeliveryMonth)).click();

        expect(createOrderPage.dealershipForStock.$$('option').count()).toEqual(2);
        expect(createOrderPage.dealershipForStock.getAttribute('value')).toEqual(selectedStockValue);
        createOrderPage.stockFormSubmit.click();

        // Choosing model and series
        let modelSeriesPage = new orders.ModelSeriesPage();
        modelSeriesPage.init();

        expect(modelSeriesPage.model.$$('option').getText()).toEqual(modelList);
        expect(modelSeriesPage.series.$$('option').getText()).toEqual([ 'Select Series' ]);
        modelSeriesPage.model.element(by.cssContainingText('option', selectedModel)).click();

        expect(modelSeriesPage.model.getAttribute('value')).toEqual(selectedModelValue);
        expect(modelSeriesPage.series.$$('option').getText()).toEqual(seriesList);
        modelSeriesPage.series.element(by.cssContainingText('option', selectedSeries)).click();

        expect(modelSeriesPage.series.getAttribute('value')).toEqual(selectedSeriesValue);
        modelSeriesPage.formSubmit.click();

     };

    // Leave the test as is for now, with a comment that we need to update the code to check the actual data on the order instead of the Audit values to determine the status of the order.
    it('Can save order details and request approval', common.restoreDatabase('base', () => {
        common.login('dealerprincipal');

        createAndSelectInitalOrderItems();

        // Weight and size
        let weightSizePage = new orders.WeightAndSizePage();
        weightSizePage.init();
        // Request to Place Order
        weightSizePage.requestToPlaceOrder.click();

        let statusPage = new orders.StatusPage();
        statusPage.init();

        expect(statusPage.orderRequested.getAttribute('innerText')).toEqual('Complete');
        expect(statusPage.orderPlaced.getAttribute('innerText')).toEqual('Requires Action');
    }));


    // Leave the test as is for now, with a comment that we need to update the code to check the actual data on the order instead of the Audit values to determine the status of the order.
    it('Can Approve an order as dealerprincipal', common.restoreDatabase('base', () => {

        common.login('dealerprincipal');

        createAndSelectInitalOrderItems();

        // Weight and size
        let weightSizePage = new orders.WeightAndSizePage();
        weightSizePage.init();

        // Request to Place Order
        weightSizePage.requestToPlaceOrder.click();

        // Checks for status w/ refresh
        browser.refresh();
        weightSizePage.placeOrder.click();
        weightSizePage.placeOrderPopup.modal.waitForOpen();
        weightSizePage.placeOrderPopup.placeOrderButton.click();
        weightSizePage.placeOrderPopup.modal.waitForClose();

        browser.refresh();
        weightSizePage.linkStatus.click();
        let statusPage = new orders.StatusPage();
        statusPage.init();

        expect(statusPage.orderRequested.getAttribute('innerText')).toEqual('Complete');
        expect(statusPage.orderPlaced.getAttribute('innerText')).toEqual('Complete');
    }));


    it('Can approve special features and further change invalidates approval', common.restoreDatabase('base', () => {
        const orderId = 90;

        common.login('dealerprincipal');
        // Move order to next state to proceed.
        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();
        statusPage.requestToPlaceOrder.click();
        statusPage.placeOrder.click();
        statusPage.placeOrderPopup.modal.waitForOpen();
        statusPage.placeOrderPopup.placeOrderButton.click();
        statusPage.placeOrderPopup.modal.waitForClose();

        common.login('schedulemanager');
        statusPage.load();

        expect(statusPage.specialFeature.getAttribute('innerText')).toEqual('Requires Action');
        statusPage.linkSpecialFeatures.click();

        let specialFeaturesPage = new orders.SpecialFeaturesPage();
        specialFeaturesPage.init();

        expect(specialFeaturesPage.customerDescription.get(0).getAttribute('value')).toEqual('Special feature');
        expect(specialFeaturesPage.retailPrice.get(0).getAttribute('value')).toEqual('200.00');
        expect(specialFeaturesPage.category.get(0).getAttribute('value')).toEqual('2');
        expect(specialFeaturesPage.department.get(0).getAttribute('value')).toEqual('83');

        specialFeaturesPage.approve.get(0).click();

        specialFeaturesPage.saveOrder.click();

        expect(specialFeaturesPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');

        specialFeaturesPage.linkStatus.click();
        statusPage = new orders.StatusPage();
        statusPage.init();

        expect(statusPage.specialFeature.getAttribute('innerText')).toEqual('Complete');

        // go back to the special features page and make changes as dealer rep
        common.login('dealerrep');
        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();
        featuresPage.linkStatus.click();

        featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();
        featuresPage.linkSpecialFeatures.click();
        specialFeaturesPage = new orders.SpecialFeaturesPage();
        specialFeaturesPage.init();

        expect(specialFeaturesPage.customerDescription.get(0).getAttribute('value')).toEqual('Special feature');

        specialFeaturesPage.retailPrice.sendKeys('\u0008\u0008\u0008\u0008\u0008\u0008\u0008123');

        expect(specialFeaturesPage.totalCharge.getText()).toEqual('$64,363.00');
        expect(specialFeaturesPage.approvalPending.get(0).isPresent()).toBeTruthy();

        specialFeaturesPage.saveOrder.click();

        expect(specialFeaturesPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');

        specialFeaturesPage.linkStatus.click();
        statusPage = new orders.StatusPage();
        statusPage.init();

        expect(statusPage.specialFeature.getAttribute('innerText')).toEqual('Requires Action');
    }));


    it('Progress order till finalized state', common.restoreDatabase('base', () => {
        const orderId = 88;

        common.login('admin');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        // fill in the missing plumbing
        featuresPage.plumbing.panel.click();
        featuresPage.plumbing.toiletDropdown.click();
        featuresPage.plumbing.toiletDropdown.element(by.cssContainingText('li', 'Toilet - Ceramic')).click();
        expect(featuresPage.plumbing.toiletUnselected.isPresent()).toBeFalsy();

        featuresPage.save.click();
        expect(featuresPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');

        // Approve special feature
        featuresPage.linkSpecialFeatures.click();

        let specialFeaturesPage = new orders.SpecialFeaturesPage();
        specialFeaturesPage.init();
        specialFeaturesPage.approve.get(0).click();
        specialFeaturesPage.save.click();
        expect(specialFeaturesPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');

        specialFeaturesPage.requestToPlaceOrder.click();

        specialFeaturesPage.placeOrder.click();
        specialFeaturesPage.placeOrderPopup.modal.waitForOpen();
        specialFeaturesPage.placeOrderPopup.placeOrderButton.click();
        specialFeaturesPage.placeOrderPopup.modal.waitForClose();
        browser.refresh();

        specialFeaturesPage.linkStatus.click();

        let statusPage = new orders.StatusPage();
        statusPage.init();

        expect(statusPage.finalized.getAttribute('innerText')).toEqual('Requires Action');

        // finalize order
        statusPage.finalizeOrder.click();
        expect(statusPage.finalized.getAttribute('innerText')).toEqual('Complete');
        protractor.promise.controlFlow().execute(() => common.saveDatabase('orderflow.010.order_finalized'));
    }));

    it('Progress another order untill finalized state(this is to test manual set chassis)', common.restoreDatabase('orderflow.010.order_finalized', () => {
        const orderId = 95;
        common.login('dealerprincipal');

        // Order creation
        let createOrderPage = new orders.NewOrderPage();
        createOrderPage.loadUsingMenuLink();
        createOrderPage.desiredDeliveryMonth.element(by.cssContainingText('option', 'Nov 2016')).click();
        createOrderPage.saveStockOrder.click();

        // attempts to clone an existing order
        let modelSeriesPage = new orders.ModelSeriesPage();
        modelSeriesPage.init();

        modelSeriesPage.customerLookupInput.sendKeys('NA0002');
        modelSeriesPage.customerLookupLists.get(0).click();

        modelSeriesPage.cloneSubmit.click();

        let weightSizePage = new orders.WeightAndSizePage();

        weightSizePage.formSubmit.click();

        let featuresPage = new orders.FeaturesPage();
        featuresPage.init();
        featuresPage.save.click();
        featuresPage.requestToPlaceOrder.click();
        featuresPage.placeOrder.click();
        featuresPage.placeOrderPopup.modal.waitForOpen();
        featuresPage.placeOrderPopup.placeOrderButton.click();
        featuresPage.placeOrderPopup.modal.waitForClose();
        browser.refresh();
        featuresPage.finalizeOrder.click();

        protractor.promise.controlFlow().execute(() => common.saveDatabase('orderflow.020.next_order_finalized'));

    }));

    it('Cancel finalization for order num 88(this is to test manual set chassis)', common.restoreDatabase('orderflow.020.next_order_finalized', () => {
        const orderId = 88;

        common.login('admin');
        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();
        expect(statusPage.finalized.getAttribute('innerText')).toEqual('Complete');

        statusPage.cancelOrderLock.click();

        statusPage.cancelOrderLockPopup.modal.waitForOpen();
        statusPage.cancelOrderLockPopup.cancelOrderLockReason.sendKeys('Cancel Lock Order');
        statusPage.cancelOrderLockPopup.cancelOrderLockButton.click();
        statusPage.cancelOrderLockPopup.modal.waitForClose();
        expect(statusPage.orderRequested.getAttribute('innerText')).toEqual('Requires Action');

        protractor.promise.controlFlow().execute(() => common.saveDatabase('orderflow.030.with_one_cancelfinalisation_order'));

    }));

    it('Verify user can manually set a chassis number less than current maximum chassis number', common.restoreDatabase('orderflow.030.with_one_cancelfinalisation_order', () => {
        const orderId = 95;
        common.login('admin');

        //check that user can manualy set chassis num less than current
        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();
        statusPage.setChassisNumButton.click();
        statusPage.setChassisNumField.clear().sendKeys('NA0005');
        statusPage.confirmChassisButton.click();
        browser.sleep(5000)
        statusPage.saveOrder.click();
        expect(statusPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');
        expect(statusPage.setChassisNumField.getAttribute('value')).toEqual('NA0005');

    }));


    it('Verify user can not manually set change chassis number grater than current chassis num', common.restoreDatabase('orderflow.010.order_finalized', () => {
        const orderId = 88;
        common.login('admin');

        //check that user can manualy set chassis num less than current
        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();

        //check that user can not manualy set chassis num grater than current
        statusPage.setChassisNumButton.click();
        statusPage.setChassisNumField.clear().sendKeys('NA0006');
        statusPage.confirmChassisButton.click();
        expect(statusPage.errorMessages.getAttribute('innerText')).toEqual('1- You cannot assign a chassis number higher than the current maximum value.');

    }));

    it('Verify user can not manually change chassis number into an already existing chassis num', common.restoreDatabase('orderflow.010.order_finalized', () => {
        const orderId = 88;
        common.login('admin');

        //check that user can manualy set chassis num less than current
        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();

        //check that user can not manualy set chassis num grater than current
        statusPage.setChassisNumButton.click();
        statusPage.setChassisNumField.clear().sendKeys('NA0006');
        statusPage.confirmChassisButton.click();
        expect(statusPage.errorMessages.getAttribute('innerText')).toEqual('1- You cannot assign a chassis number higher than the current maximum value.');

    }));

    it('Can progress finalized order', common.restoreDatabase('orderflow.010.order_finalized', () => {
        const orderId = 88;

        common.login('admin');

        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();

        // A chassis number should be added to the order
        expect(statusPage.chassisAppointed.getAttribute('innerText')).toEqual('Complete');
        expect(statusPage.drafterAppointed.getAttribute('innerText')).toEqual('Requires Action');

        // Appoints drafter
        statusPage.drafterSelection.click();
        statusPage.drafterSelection.element(by.cssContainingText('option','Drafter')).click();
        statusPage.drafterAppoint.click();

        expect(statusPage.drafterAppointed.getAttribute('innerText')).toEqual('Complete');

        // Add Customer plan
        statusPage.customerPlanUploadInput.sendKeys(common.absoluteFilePathForUpload);
        statusPage.customerPlanUploadButton.click();

        expect(statusPage.customerPlan.getAttribute('innerText')).toEqual('Complete');
        // Remove Customer plan
        statusPage.customerPlanDeleteLink.click();

        expect(statusPage.customerPlan.getAttribute('innerText')).toEqual('Requires Action');

        // Re-add Customer plan (after testing removal)
        statusPage.customerPlanUploadInput.sendKeys(common.absoluteFilePathForUpload);
        statusPage.customerPlanUploadButton.click();

        expect(statusPage.customerPlan.getAttribute('innerText')).toEqual('Complete');

        // Upload Factory plan
        statusPage.factoryPlanUploadInput.sendKeys(common.absoluteFilePathForUpload);
        statusPage.factoryPlanUploadButton.click();

        expect(statusPage.factoryPlan.getAttribute('innerText')).toEqual('Complete');

        // Remove Factory plan
        statusPage.factoryPlanDeleteLink.click();

        expect(statusPage.factoryPlan.getAttribute('innerText')).toEqual('Requires Action');

        // Add Factory plan external
        statusPage.factoryPlanExternal.click();

        expect(statusPage.factoryPlan.getAttribute('innerText')).toEqual('Complete');

        // Upload Chassis plan
        statusPage.chassisPlanUploadInput.sendKeys(common.absoluteFilePathForUpload);
        statusPage.chassisPlanUploadButton.click();

        expect(statusPage.chassisPlan.getAttribute('innerText')).toEqual('Complete');

        // Remove Chassis plan
        statusPage.chassisPlanDeleteLink.click();

        expect(statusPage.chassisPlan.getAttribute('innerText')).toEqual('Requires Action');

        // Add Chassis plan external
        statusPage.chassisPlanExternal.click();

        expect(statusPage.chassisPlan.getAttribute('innerText')).toEqual('Complete');

        // Need to assign production dates to get the VIN enabled.
        const dashboardPage = new schedule.DashboardPage();
        dashboardPage.loadUsingMenuLink();
        dashboardPage.enterMonth.clear().sendKeys('Sep 2016');
        browser.actions().sendKeys(protractor.Key.ENTER).perform();
        // click the assign production button twice because order 87 (the one right before 88 being tested) is corrupted and has a chassis number even that its still in the quote stage
        // and this caused the first assignment to be fired to order 87 and only the second click correctly gives 88 a production date)
        dashboardPage.assignDates.click();
        dashboardPage.assignDates.click();
        protractor.promise.controlFlow().execute(() => common.saveDatabase('orderflow.020.production_dates_finalized'));
    }));

    it('Can progress order after production dates finalized', common.restoreDatabase('orderflow.020.production_dates_finalized', () => {
        const orderId = 88;

        common.login('admin');
        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();

        // Assign VIN Number
        statusPage.vinNumberInput.sendKeys('6KZNEWAGEGC123456');
        statusPage.vinNumberUpdate.click();
        expect(statusPage.vinNumber.getAttribute('innerText')).toEqual('Complete');

        // Enter planned QC date
        statusPage.qcDatePlannedInput.sendKeys('01/09/2016');
        statusPage.qcDatePlannedUpdate.click();
        expect(statusPage.qcDatePlanned.getAttribute('innerText')).toEqual('Complete');
        // Verify Weekends are counted.
        expect(statusPage.dispatchDatePlannedInput.getAttribute('value')).toEqual('05/09/2016');

        // Enter planned dispatch date
        statusPage.dispatchDatePlannedInput.clear();
        statusPage.dispatchDatePlannedInput.sendKeys('03/09/2016');
        statusPage.dispatchDatePlannedUpdate.click();
        expect(statusPage.dispatchDatePlanned.getAttribute('innerText')).toEqual('Complete');

        // Validate actual QC date (should already be entered)
        statusPage.qcDateActualUpdate.click();
        expect(statusPage.qcDateActual.getAttribute('innerText')).toEqual('Complete');

        // Assign weights
        statusPage.weightsOpenModal.click();
        statusPage.deliveryWeightModal.waitForOpen();
        statusPage.weightsModalTare.sendKeys('1234');
        statusPage.weightsModalAtm.sendKeys('1234');
        statusPage.weightsModalTowBall.sendKeys('1234');
        statusPage.weightsModalTyres.sendKeys('123*15');
        statusPage.weightsModalChassisGtm.sendKeys('1234');
        statusPage.weightsModalGasComp.sendKeys('12345678');
        statusPage.weightsModalPayload.sendKeys('1234');
        statusPage.weightsModalSave.click();

        expect(statusPage.weights.getAttribute('innerText')).toEqual('Complete');

        // Enter actual dispatch date
        statusPage.dispatchDateActualInput.sendKeys('01/01/2017');
        statusPage.dispatchDateActualUpdate.click();

        expect(statusPage.dispatchDateActual.getAttribute('innerText')).toEqual('Complete');

        // Upload driver handover form
        statusPage.handoverToDriverUploadInput.sendKeys(common.absoluteFilePathForUpload);
        statusPage.handoverToDriverUploadButton.click();

        expect(statusPage.handoverToDriver.getAttribute('innerText')).toEqual('Complete');

        // Remove driver handover form
        statusPage.handoverToDriverDeleteLink.click();

        expect(statusPage.handoverToDriver.getAttribute('innerText')).toEqual('Requires Action');

        // Add driver handover form external
        statusPage.handoverToDriverExternal.click();

        expect(statusPage.handoverToDriver.getAttribute('innerText')).toEqual('Complete');

        // Enter van received date
        statusPage.receivedDateDealershipInput.sendKeys('01/01/2017');
        statusPage.receivedDateDealershipUpdate.click();

        expect(statusPage.receivedDateDealership.getAttribute('innerText')).toEqual('Complete');

        // Upload dealership handover form
        statusPage.handoverToDealershipUploadInput.sendKeys(common.absoluteFilePathForUpload);
        statusPage.handoverToDealershipUploadButton.click();

        expect(statusPage.handoverToDealership.getAttribute('innerText')).toEqual('Complete');

        // Remove dealership handover form
        statusPage.handoverToDealershipDeleteLink.click();

        expect(statusPage.handoverToDealership.getAttribute('innerText')).toEqual('Requires Action');

        // Add dealership handover form external
        statusPage.handoverToDealershipExternal.click();

        expect(statusPage.handoverToDealership.getAttribute('innerText')).toEqual('Complete');

        // Enter customer delivery date
        statusPage.customerDeliveryDateInput.sendKeys('01/01/2017');
        statusPage.customerDeliveryDateUpdate.click();

        expect(statusPage.customerDeliveryDate.getAttribute('innerText')).toEqual('Complete');

        protractor.promise.controlFlow().execute(() => common.saveDatabase('orderflow.030.customer_delivery_date_added'));
    }));

    it('Customer delivery date of a stock order not open until it is converted to a customer order', common.restoreDatabase('base', () => {
        const orderId = 92;
        common.login('admin');


        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        featuresPage.linkCustomerDetails.click();

        let customerDetailsPage = new orders.CustomerDetailsPage(orderId);
        customerDetailsPage.convertDelaershipBtn.click();
        customerDetailsPage.saveOrder.click();

        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();

        // Appoints drafter
        browser.sleep(1000)
        statusPage.drafterSelection.click();
        statusPage.drafterSelection.element(by.cssContainingText('option','Drafter')).click();
        statusPage.drafterAppoint.click();

        // Need to assign production dates to get the VIN enabled.
        const dashboardPage = new schedule.DashboardPage();
        dashboardPage.loadUsingMenuLink();
        dashboardPage.enterMonth.clear().sendKeys('Oct 2016');
        browser.actions().sendKeys(protractor.Key.ENTER).perform();
        // click the assign production button twice because order 91 (the one right before 92 being tested) is corrupted and has a chassis number even that its still in the quote stage
        // and this caused the first assignment to be fired to order 87 and only the second click correctly gives 91 a production date)
        dashboardPage.assignDates.click();
        browser.sleep(1000)
        dashboardPage.assignDates.click();
        browser.sleep(1000)

        statusPage = new orders.StatusPage(orderId);
        statusPage.load();

        // Add Customer plan
        statusPage.customerPlanUploadInput.sendKeys(common.absoluteFilePathForUpload);
        statusPage.customerPlanUploadButton.click();

        // Upload Factory plan
        statusPage.factoryPlanUploadInput.sendKeys(common.absoluteFilePathForUpload);
        statusPage.factoryPlanUploadButton.click();

        // Upload Chassis plan
        statusPage.chassisPlanUploadInput.sendKeys(common.absoluteFilePathForUpload);
        statusPage.chassisPlanUploadButton.click();

        // Assign VIN Number
        statusPage.vinNumberInput.sendKeys('6KZNEWAGEGC123456');
        statusPage.vinNumberUpdate.click();

        // Enter planned QC date
        statusPage.qcDatePlannedInput.sendKeys('01/09/2016');
        statusPage.qcDatePlannedUpdate.click();

        // Enter planned dispatch date
        statusPage.dispatchDatePlannedInput.clear();
        statusPage.dispatchDatePlannedInput.sendKeys('03/09/2016');
        statusPage.dispatchDatePlannedUpdate.click();

        // Validate actual QC date (should already be entered)
        statusPage.qcDateActualUpdate.click();

        // Assign weights
        statusPage.weightsOpenModal.click();
        statusPage.deliveryWeightModal.waitForOpen();
        statusPage.weightsModalTare.sendKeys('1234');
        statusPage.weightsModalAtm.sendKeys('1234');
        statusPage.weightsModalTowBall.sendKeys('1234');
        statusPage.weightsModalTyres.sendKeys('123*15');
        statusPage.weightsModalChassisGtm.sendKeys('1234');
        statusPage.weightsModalGasComp.sendKeys('12345678');
        statusPage.weightsModalPayload.sendKeys('1234');
        statusPage.weightsModalSave.click();

        // Enter actual dispatch date
        statusPage.dispatchDateActualInput.sendKeys('01/01/2017');
        statusPage.dispatchDateActualUpdate.click();

        // Upload driver handover form
        statusPage.handoverToDriverUploadInput.sendKeys(common.absoluteFilePathForUpload);
        statusPage.handoverToDriverUploadButton.click();

        // Enter van received date
        statusPage.receivedDateDealershipInput.sendKeys('01/01/2017');
        statusPage.receivedDateDealershipUpdate.click();

        // Upload dealership handover form
        statusPage.handoverToDealershipUploadInput.sendKeys(common.absoluteFilePathForUpload);
        statusPage.handoverToDealershipUploadButton.click();
        expect(statusPage.customerDeliveryDateInactive.getAttribute('innerText')).toContain('Not yet required');

        statusPage.linkCustomerDetails.click();
        let customerDetails = new orders.CustomerDetailsPage(orderId);
        customerDetails.customerLookupInput.sendKeys('test');
        customerDetails.customerLookupLists.get(0).click();
        customerDetails.customerFormSubmit.click();

        let statusCompletePage = new orders.StatusPage(orderId);
        statusCompletePage.load();
        expect(statusPage.customerDeliveryDate.getAttribute('innerText')).toEqual('Requires Action');

    }));

    it('Can reassign customer manager', common.restoreDatabase('base', () => {
        const orderId = 87;

        common.login('admin');

        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();
        statusPage.changeManager.click();
        browser.sleep(1000);
        statusPage.changeManagerSelection.click();
        statusPage.changeManagerSelection.element(by.cssContainingText('option','Dealer Principal')).click();
        statusPage.changeManagerConfirm.click();

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        // fill in the missing plumbing
        featuresPage.plumbing.panel.click();
        featuresPage.plumbing.toiletDropdown.click();
        featuresPage.plumbing.toiletDropdown.element(by.cssContainingText('li', 'Toilet - Ceramic')).click();
        featuresPage.save.click();
        featuresPage.linkStatus.click();
        expect(featuresPage.plumbing.toiletUnselected.isPresent()).toBeFalsy();
        featuresPage.requestToPlaceOrder.click();

        common.login('dealerprincipal');
        let homePage = new newage.HomePage();
        homePage.init();
        expect(homePage.todoItems.getAttribute('innerText')).toContain(`#${orderId}`);
    }));

    it("Doesn't show added departments for finalised orders", common.restoreDatabase('base', () => {
        const orderId = 91;

        common.login('dealerrep');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();
        featuresPage.hideSideBar();

        expect(element.all(by.css('div.missing-selections')).count()).toEqual(0);
    }));


    it('Can change model and series successfully', common.restoreDatabase('base', () => {
        const orderId = 88;

        common.login('dealerrep');

        let modelSeriesPage = new orders.ModelSeriesPage(orderId);
        modelSeriesPage.load();

        expect(modelSeriesPage.model.getAttribute('value')).toEqual('number:2');
        expect(modelSeriesPage.series.getAttribute('value')).toEqual('number:15');
        modelSeriesPage.model.element(by.cssContainingText('option', selectedModel)).click();
        browser.switchTo().alert().accept()
        modelSeriesPage.series.element(by.cssContainingText('option', selectedSeries)).click();
        modelSeriesPage.formSubmit.click();

        modelSeriesPage.load();
        expect(modelSeriesPage.model.getAttribute('value')).toEqual('number:9');
        expect(modelSeriesPage.series.getAttribute('value')).toEqual('number:2');

    }));

    it('Can change customer of an existing order successfully', common.restoreDatabase('orderflow.010.order_finalized', () => {
        const orderId = 93;
        common.login('dealerprincipal');


        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        featuresPage.linkCustomerDetails.click();

        let customerDetails = new orders.CustomerDetailsPage(orderId);
        expect(customerDetails.customerFirstname.getAttribute('value')).toEqual('Test user firstname 01');

        customerDetails.customerLookupInput.clear();
        customerDetails.customerLookupInput.sendKeys('Checktest Checktestlast ');
        customerDetails.customerLookupLists.get(0).click();
        customerDetails.customerFormSubmit.click();

        featuresPage.linkCustomerDetails.click();
        expect(customerDetails.customerFirstname.getAttribute('value')).toEqual('Checktest');


    }));

     it('Can cancel order successfully', common.restoreDatabase('orderflow.010.order_finalized', () => {
        const orderId = 88;

        common.login('admin');
        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();
        statusPage.cancelOrder.click();

        statusPage.cancelOrderPopup.modal.waitForOpen();
        statusPage.cancelOrderPopup.cancelOrderButton.click();
        statusPage.cancelOrderPopup.modal.waitForClose();

        expect(statusPage.currentStage.getAttribute('innerText')).toEqual('Order (Cancelled)');

    }));

    it('Change VIN Number', common.restoreDatabase('orderflow.030.customer_delivery_date_added', () => {
        const orderId = 88;

        common.login('admin');
        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();

        // change VIN Number
        expect(statusPage.vinNumberInput.getAttribute('value')).toEqual('6KZNEWAGEGC123456');
        statusPage.vinNumberInput.clear();
        statusPage.vinNumberInput.sendKeys('ABCDEFGHIJK123456');
        statusPage.vinNumberUpdate.click();
        expect(statusPage.vinNumberInput.getAttribute('value')).toEqual('ABCDEFGHIJK123456');

    }));

    it('Change QC Date', common.restoreDatabase('orderflow.030.customer_delivery_date_added', () => {
        const orderId = 88;

        common.login('admin');
        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();

        // Edit planned QC date
        expect(statusPage.qcDatePlannedInput.getAttribute('value')).toEqual('01/09/2016');
        statusPage.qcDatePlannedInput.clear();
        statusPage.qcDatePlannedInput.sendKeys('02/09/2016');
        statusPage.qcDatePlannedUpdate.click();
        expect(statusPage.qcDatePlannedInput.getAttribute('value')).toEqual('02/09/2016');

    }));

    it('Change Dispatch Date', common.restoreDatabase('orderflow.030.customer_delivery_date_added', () => {
        const orderId = 88;

        common.login('admin');
        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();

        // Edit planned QC date
        expect(statusPage.dispatchDateActualInput.getAttribute('value')).toEqual('01/01/2017');
        statusPage.dispatchDateActualInput.clear();
        statusPage.dispatchDateActualInput.sendKeys('02/01/2017');
        statusPage.dispatchDateActualInput.click();
        expect(statusPage.dispatchDateActualInput.getAttribute('value')).toEqual('02/01/2017');

    }));

    it('Change Customer Delivery Date', common.restoreDatabase('orderflow.030.customer_delivery_date_added', () => {
        const orderId = 88;

        common.login('admin');
        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();

        // Edit planned QC date
        expect(statusPage.customerDeliveryDateInput.getAttribute('value')).toEqual('01/01/2017');
        statusPage.customerDeliveryDateInput.clear();
        statusPage.customerDeliveryDateInput.sendKeys('02/01/2017');
        statusPage.customerDeliveryDateUpdate.click();
        expect(statusPage.customerDeliveryDateInput.getAttribute('value')).toEqual('02/01/2017');

    }));

    it('Cancel order lock', common.restoreDatabase('orderflow.010.order_finalized', () => {
        const orderId = 88;

        common.login('admin');
        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();
        expect(statusPage.finalized.getAttribute('innerText')).toEqual('Complete');

        statusPage.cancelOrderLock.click();

        statusPage.cancelOrderLockPopup.modal.waitForOpen();
        statusPage.cancelOrderLockPopup.cancelOrderLockReason.sendKeys('Cancel Lock Order');
        statusPage.cancelOrderLockPopup.cancelOrderLockButton.click();
        statusPage.cancelOrderLockPopup.modal.waitForClose();
        expect(statusPage.orderRequested.getAttribute('innerText')).toEqual('Requires Action');

    }));

    it('Generate history while adding and removing special features', common.restoreDatabase('base', () => {
        const orderId = 88;

        common.login('dealerprincipal');

        let SpecialFeaturesPage = new orders.SpecialFeaturesPage(orderId);
        SpecialFeaturesPage.load()
        SpecialFeaturesPage.remove.click();
        SpecialFeaturesPage.save.click();
        browser.wait(protractor.ExpectedConditions.elementToBeClickable(SpecialFeaturesPage.alertDetailsSaved));

        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();
        expect(statusPage.historyActionRowOne.getAttribute('innerText')).toEqual('Special Feature Deleted');
        SpecialFeaturesPage.load()

        SpecialFeaturesPage.addSpecialFeature.click();
        SpecialFeaturesPage.customerDescription.sendKeys('Test Special Feature');
        SpecialFeaturesPage.retailPrice.sendKeys('100');
        SpecialFeaturesPage.save.click();
        browser.wait(protractor.ExpectedConditions.elementToBeClickable(SpecialFeaturesPage.alertDetailsSaved));

        statusPage.load();
        expect(statusPage.historyActionRowOne.getAttribute('innerText')).toEqual('Special Feature Added');
    }));

     it('Generate history while adding and removing optional extras', common.restoreDatabase('base', () => {

        const orderId = 93;

        common.login('dealerprincipal');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        featuresPage.chassis.panel.click();

        featuresPage.chassis.addExtra.click();
        featuresPage.optionsModal.waitForOpen();
        expect(featuresPage.chassis.extraModal.isDisplayed()).toBeTruthy();

        featuresPage.chassis.extraItems.get(1).click();
        featuresPage.chassis.extraModalClose.click();
        featuresPage.optionsModal.waitForClose();

        featuresPage.save.click();
        expect(featuresPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');

        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();
        expect(statusPage.historyActionRowOne.getAttribute('innerText')).toEqual('Optional Extra Added');
        featuresPage.load();

        featuresPage.chassis.panel.click();
        featuresPage.chassis.removeExtra.click();
        featuresPage.save.click();
        expect(featuresPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');

        statusPage.load();
        expect(statusPage.historyActionRowOne.getAttribute('innerText')).toEqual('Optional Extra Deleted');

    }));

    it('Update series price from admin, changes the price on an unfinalised order', common.restoreDatabase('base', () => {
        const orderId = 88;
        const total = '$62,140.00'
        const costPrice = '40000'
        const wholesalePrice = '48991'
        const retailPrice = '61991'
        const newtotal = '$62,141.00'

        common.login('admin');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        featuresPage.displayTotalsBtn.click();
        featuresPage.displayTotals.modal.waitForOpen();
        expect(featuresPage.displayTotals.grandTotalsRetail.getText()).toEqual(total);

        let adminSeriesPage = new newage.AdminSeriesPage();
        adminSeriesPage.load();
        adminSeriesPage.seriesTable.selectSeries.click();

        adminSeriesPage.costPrice.clear().sendKeys(costPrice);
        adminSeriesPage.wholesalePrice.clear().sendKeys(wholesalePrice);
        adminSeriesPage.retailPrice.clear().sendKeys(retailPrice);
        adminSeriesPage.saveBtn.click();

        featuresPage.load();
        featuresPage.displayTotalsBtn.click();
        featuresPage.displayTotals.modal.waitForOpen();
        expect(featuresPage.displayTotals.grandTotalsRetail.getText()).toEqual(newtotal);

    }));


    it('Update series price from admin, does not changes the price on a finalised order', common.restoreDatabase('orderflow.010.order_finalized', () => {
        const orderId = 88;
        const total = '$62,140.00'
        const costPrice = '40000'
        const wholesalePrice = '48991'
        const retailPrice = '61991'

        common.login('admin');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        featuresPage.displayTotalsBtn.click();
        featuresPage.displayTotals.modal.waitForOpen();
        expect(featuresPage.displayTotals.grandTotalsRetail.getText()).toEqual(total);

        let adminSeriesPage = new newage.AdminSeriesPage();
        adminSeriesPage.load();
        adminSeriesPage.seriesTable.selectSeries.click();

        adminSeriesPage.costPrice.clear().sendKeys(costPrice);
        adminSeriesPage.wholesalePrice.clear().sendKeys(wholesalePrice);
        adminSeriesPage.retailPrice.clear().sendKeys(retailPrice);
        adminSeriesPage.saveBtn.click();

        featuresPage.load();
        featuresPage.displayTotalsBtn.click();
        featuresPage.displayTotals.modal.waitForOpen();
        expect(featuresPage.displayTotals.grandTotalsRetail.getText()).toEqual(total);

    }));

    it('Drafter changes to options/upgrades, does not changes the price on a finalised order', common.restoreDatabase('orderflow.010.order_finalized', () => {
        const orderId = 88;
        const optionUpgradesBefore = '$0.00'
        const optionUpgradesAfter = '$975.00'
        const basicPrice = '$61,990.00'

        common.login('drafter');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        featuresPage.displayTotalsBtn.click();
        featuresPage.displayTotals.modal.waitForOpen();
        expect(featuresPage.displayTotals.retailoptionalExtras.getText()).toEqual(optionUpgradesBefore);
        expect(featuresPage.displayTotals.retailBasicCaravan.getText()).toEqual(basicPrice);

        featuresPage.load();
        featuresPage.chassis.panel.click();

        featuresPage.chassis.addExtra.click();
        featuresPage.optionsModal.waitForOpen();
        expect(featuresPage.chassis.extraModal.isDisplayed()).toBeTruthy();

        featuresPage.chassis.extraItems.get(1).click();
        featuresPage.chassis.extraModalClose.click();
        featuresPage.optionsModal.waitForClose();

        featuresPage.saveOrder.click();
        expect(featuresPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');

        featuresPage.displayTotalsBtn.click();
        featuresPage.displayTotals.modal.waitForOpen();
        expect(featuresPage.displayTotals.retailoptionalExtras.getText()).toEqual(optionUpgradesAfter);
        expect(featuresPage.displayTotals.retailBasicCaravan.getText()).toEqual(basicPrice);


    }));

});
