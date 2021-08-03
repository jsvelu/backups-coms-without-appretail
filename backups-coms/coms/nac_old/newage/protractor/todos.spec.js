import * as common from '../../../test-e2e/common';
import * as newage from '../../../nac/newage/protractor/newage.pages';
import * as orders from '../../../nac/orders/protractor/orders.pages';
import * as schedule from '../../../nac/schedule/protractor/schedule.pages'


describe('Test todo list', () => {

    const orderId = 94;

    const checkTodoList = (username, todoText, manageLink) => {
        common.login(username);

        const homePage = new newage.HomePage();
        homePage.init();

        let orderRows = homePage.todoItems.getRowsForOrder(orderId);

        expect(orderRows.count()).toBeGreaterThan(0, `todo list contains order ${orderId} (is MOCK_DATES enabled for django server?)`);
        expect(homePage
                .todoItems
                .getCellsForOrder(orderId, 'action', todoText)
                .count()
            ).toBeGreaterThan(0, `todo list contains actions for order ${orderId}`);

        // https://github.com/seleniumhq/selenium-google-code-issue-archive/issues/1943
        // webdriver turns it into a fully qualified URL
        const manageUrl = browser.baseUrl + `newage/orders/#/${orderId}${manageLink}`;
        expect(homePage
                .todoItems
                .getCellsForOrder(orderId, 'manage', 'Manage')
                .first()
                .element(by.linkText('Manage'))
                .getAttribute('href'))
            .toEqual(manageUrl, `todo list contains manage link for order ${orderId}`);
    };

    const checkNotOnTodoList = username => {
        common.login(username);

        const homePage = new newage.HomePage();
        homePage.init();

        const orderRow = homePage.todoItems.getRowsForOrder(orderId);
        expect(orderRow.count()).toBe(0, 'Order should not be visible in todo list');
    };

    const addFeature = (user) => {
        common.login(user);

        const specialFeaturesPage = new orders.SpecialFeaturesPage(orderId);
        specialFeaturesPage.load();
        specialFeaturesPage.addSpecialFeature.click();
        specialFeaturesPage.customerDescription.sendKeys('New special feature');
        specialFeaturesPage.retailPrice.sendKeys('123');

        specialFeaturesPage.save.click();
        expect(specialFeaturesPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');
    };

    // General organisation of the test is:
    // - Check order in todo list
    // - Progress the order to next stage
    // - Check order not in todo list
    // Using this order allows to speed up testing as it removes a logout/login cycle, since the user for which we test the todo list is the one that needs to action it
    // There might be some exception to this flow, when checking for todo out of the standard flow

    it('dealerrep completes missing selection and requests for approval', common.restoreDatabase('base', () => {
        common.login('dealerrep');

        // fill in the missing plumbing
        const featuresPage = new orders.FeaturesPage(orderId);

        featuresPage.load();
        featuresPage.plumbing.panel.click();
        featuresPage.plumbing.toiletDropdown.click();
        featuresPage.plumbing.toiletDropdown.element(by.cssContainingText('li', 'Toilet - Ceramic')).click();
        expect(featuresPage.plumbing.toiletUnselected.isPresent()).toBeFalsy();
        featuresPage.save.click();
        featuresPage.requestToPlaceOrder.click();
        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.010.missingSelection'));

        checkNotOnTodoList('dealerrep');
    }));

    it('Dealerprincipal will place the order', common.restoreDatabase('todoList.010.missingSelection', () => {
        common.login('dealerprincipal');

        const featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        featuresPage.placeOrder.click();
        featuresPage.placeOrderPopup.modal.waitForOpen();
        featuresPage.placeOrderPopup.placeOrderButton.click();
        featuresPage.placeOrderPopup.modal.waitForClose();

        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.020.missingSelection'));

        checkNotOnTodoList('dealerprincipal');
    }));

    it('Verify place an order with complete selections is not auto finalizing it ', common.restoreDatabase('todoList.020.missingSelection', () => {
        //checkTodoList('drafterprincipal', 'Assign Drafter', '/status');
        common.login('dealerprincipal');
        const statusPage = new orders.StatusPage(orderId);
        statusPage.load();
        expect(statusPage.finalized.getAttribute('innerText')).toEqual('Requires Action');
        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.030.autofinalize'));
    }));

    it('dealerrep completes missing selection and requests for approval For not autofinalized flow', common.restoreDatabase('base', () => {
        common.login('dealerrep');

        // fill in the missing plumbing
        const featuresPage = new orders.FeaturesPage(orderId);

        featuresPage.load();
        featuresPage.plumbing.panel.click();
        featuresPage.plumbing.toiletDropdown.click();
        featuresPage.plumbing.toiletDropdown.element(by.cssContainingText('li', 'Toilet - Ceramic')).click();

        expect(featuresPage.plumbing.toiletUnselected.isPresent()).toBeFalsy();
        featuresPage.save.click();
        featuresPage.requestToPlaceOrder.click();

        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.040.requestToPlaceOrder'));

        checkNotOnTodoList('dealerrep');
    }));

    it('dealerrep adds subject details to the quote', common.restoreDatabase('todoList.040.requestToPlaceOrder', () => {
        common.login('dealerrep');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();
        featuresPage.subjectToBtn.click();
        featuresPage.subjectTo.modal.waitForOpen();
        featuresPage.subjectTo.conditionText.sendKeys('Some condition');
        featuresPage.subjectTo.close.click();
        featuresPage.subjectTo.modal.waitForClose();
        featuresPage.save.click();
        expect(featuresPage.alertDetailsSaved.isPresent()).toBeTruthy('Details Saved');

        checkTodoList('dealerrep','Check and fulfill conditions', '/status' );

        featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();
        featuresPage.subjectToBtn.click();
        featuresPage.subjectTo.modal.waitForOpen();
        featuresPage.subjectTo.conditionMet.click();
        featuresPage.subjectTo.save.click();
        featuresPage.subjectTo.modal.waitForClose();
        featuresPage.save.click();
        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.050.addSubject'));

        checkNotOnTodoList('dealerrep');

    }));

    it('add special feature and approve order', common.restoreDatabase('todoList.010.missingSelection', () => {
        addFeature('dealerrep');

        // Approve order to move to next state
        common.login('dealerprincipal');
        const featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();
        featuresPage.placeOrder.click();
        featuresPage.placeOrderPopup.modal.waitForOpen();
        featuresPage.placeOrderPopup.placeOrderButton.click();
        featuresPage.placeOrderPopup.modal.waitForClose();

        checkTodoList('schedulemanager', 'Approve Special Feature', '/special_features');
        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.055.special_feature_added'));
    }));

    it('do not accept or reject special feature', common.restoreDatabase('todoList.055.special_feature_added', () => {
        common.login('dealerrep');

        const specialFeaturesPage = new orders.SpecialFeaturesPage(orderId);
        specialFeaturesPage.load();
        specialFeaturesPage.saveOrder.click();

        checkTodoList('schedulemanager', 'Approve Special Feature', '/special_features');

        common.login('dealerrep');
        specialFeaturesPage.load();
        specialFeaturesPage.saveOrder.click();

        checkTodoList('schedulemanager', 'Approve Special Feature', '/special_features');
    }));

    it('add special feature and reject it.', common.restoreDatabase('todoList.010.missingSelection', () => {
        addFeature('dealerrep');

        // Approve order to move to next state
        common.login('dealerprincipal');
        const featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();
        featuresPage.placeOrder.click();
        featuresPage.placeOrderPopup.modal.waitForOpen();
        featuresPage.placeOrderPopup.placeOrderButton.click();
        featuresPage.placeOrderPopup.modal.waitForClose();

        checkTodoList('schedulemanager', 'Approve Special Feature', '/special_features');

        const specialFeaturesPage = new orders.SpecialFeaturesPage(orderId);
        specialFeaturesPage.load();

        specialFeaturesPage.reject.get(0).click();
        specialFeaturesPage.rejectReason.get(0).sendKeys('Because.');

        specialFeaturesPage.saveOrder.click();
        expect(specialFeaturesPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');
        checkTodoList('dealerprincipal', 'Special Feature Rejected', '/special_features');
        checkTodoList('dealerrep', 'Special Feature Rejected', '/special_features');
    }));


    it('add sepecial feature and approve it', common.restoreDatabase('todoList.050.addSubject', () => {
        addFeature('dealerrep');

        checkTodoList('schedulemanager', 'Approve Special Feature', '/special_features');
        const specialFeaturesPage = new orders.SpecialFeaturesPage(orderId);
        specialFeaturesPage.load();

        specialFeaturesPage.approve.get(0).click();
        specialFeaturesPage.save.click();

        expect(specialFeaturesPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');

        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.060.withSpecialFeature'));

        checkTodoList('dealerprincipal', 'Waiting Approval', '/status');
    }));


    it('displays the order in todo list for Approval for dealer principal ', common.restoreDatabase('todoList.060.withSpecialFeature', () => {
        checkTodoList('dealerprincipal', 'Waiting Approval', '/status');

        const statusPage = new orders.StatusPage(orderId);
        statusPage.load();
        statusPage.placeOrder.click();
        statusPage.placeOrderPopup.modal.waitForOpen();
        statusPage.placeOrderPopup.placeOrderButton.click();
        statusPage.placeOrderPopup.modal.waitForClose();
        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.065.approved'));
        checkNotOnTodoList('dealerprincipal');

    }));

    it('order does not desplay in todo list of schedulemanager for finalisation', common.restoreDatabase('todoList.065.approved', () => {
        checkNotOnTodoList('schedulemanager', 'Ready for finalisation', '/status');
        const statusPage = new orders.StatusPage(orderId);
        statusPage.load();
        statusPage.finalizeOrder.click();

        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.070.finalized'));
        checkTodoList('drafterprincipal', 'Assign Drafter', '/status');

    }));


    it('displays the order in todo list for missing drafter', common.restoreDatabase('todoList.070.finalized', () => {
        checkTodoList('drafterprincipal', 'Assign Drafter', '/status');

        const statusPage = new orders.StatusPage(orderId);

        statusPage.load();
        statusPage.drafterSelection.click();
        statusPage.drafterSelection.element(by.cssContainingText('option','Drafter')).click();
        statusPage.drafterAppoint.click();

        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.080.drafterAssigned'));
        checkNotOnTodoList('dealerprincipal');
    }));

    it('displays the order in todo list for missing customer plan for drafter', common.restoreDatabase('todoList.080.drafterAssigned', () => {
        common.login('drafterprincipal');
        let statusPage = new orders.StatusPage(orderId);

        statusPage.load();
        checkTodoList('drafter', 'Draft plans', '/status');
        statusPage = new orders.StatusPage(orderId);
        statusPage.load();
        statusPage.customerPlanUploadInput.sendKeys(common.absoluteFilePathForUpload);
        statusPage.customerPlanUploadButton.click();
        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.090.customerPlan'));
        checkTodoList('drafter', 'Prepare factory and chassis plans', '/status');
    }));


    it('displays the order in todo list for missing factory / chassis plans for drafter', common.restoreDatabase('todoList.090.customerPlan', () => {
        checkTodoList('drafter', 'Prepare factory and chassis plans', '/status');

        const statusPage = new orders.StatusPage(orderId);
        statusPage.load();
        statusPage.factoryPlanExternal.click();
        statusPage.chassisPlanExternal.click();

        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.070.productionPlans'));

        checkNotOnTodoList('drafter');
    }));


    it('Assign production dates', common.restoreDatabase('todoList.070.productionPlans', () => {
        // Assign production dates, So that Vin details are enabled
        common.login('schedulemanager');

        let dashboardPage = new schedule.DashboardPage();
        dashboardPage.loadUsingMenuLink();

        // click the assign production button twice because orders are corrupted and have a chassis numbers even that those are still in the quote stage
        // and this caused the first assignment to be fired to irelavent orders and only the second click correctly gives this order a production date)
        dashboardPage.enterMonth.clear().sendKeys('Oct 2016');
        browser.sleep(1000)
        dashboardPage.assignDates.click();
        dashboardPage.assignDates.click();
        browser.sleep(1000)

        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.080.assignProductionDates'));

    }));

    it('displays the order in todo list for vin and weights completion by vin & weight team', common.restoreDatabase('todoList.080.assignProductionDates', () => {
        checkTodoList('vin', 'Enter VIN', '/status');

        const statusPage = new orders.StatusPage(orderId);
        statusPage.load();
        statusPage.vinNumberInput.sendKeys('6KZNEWAGEGC123456');
        statusPage.vinNumberUpdate.click();
        browser.sleep(1000)
        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.090.weights'));

        checkNotOnTodoList('vin');
    }));


    it('displays the order in todo list for planned qc date completion by transport team', common.restoreDatabase('todoList.090.weights', () => {
        checkTodoList('transport', 'Enter Planned QC Date', '/status');

        const statusPage = new orders.StatusPage(orderId);
        statusPage.load();
        statusPage.qcDatePlannedInput.sendKeys('01/09/2016');
        statusPage.qcDatePlannedUpdate.click();
        // Verify Weekends are accounted.
        expect(statusPage.dispatchDatePlannedInput.getAttribute('value')).toEqual('05/09/2016');

        statusPage.dispatchDatePlannedInput.clear();
        statusPage.dispatchDatePlannedInput.sendKeys('03/09/2016');
        statusPage.dispatchDatePlannedUpdate.click();

        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.100.qcPlanned'));
    }));


    it('displays the order in todo list for actual qc date completion by transport team', common.restoreDatabase('todoList.100.qcPlanned', () => {
        checkTodoList('transport', 'Enter Actual QC Date', '/status');

        const statusPage = new orders.StatusPage(orderId);
        statusPage.load();

        statusPage.qcDateActualUpdate.click();
        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.110.qcActual'));

    }));


    it('displays the order in todo list weights completion by vin & weight team', common.restoreDatabase('todoList.110.qcActual', () => {
        checkTodoList('vin', 'Enter Weights', '/status');

        const statusPage = new orders.StatusPage(orderId);
        statusPage.load();
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

        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.110.weights'));

        checkNotOnTodoList('vin');
    }));


    it('displays the order in todo list for actual dispatch date completion by transport team', common.restoreDatabase('todoList.110.weights', () => {
        checkTodoList('transport', 'Enter Actual Dispatch Date', '/status');

        const statusPage = new orders.StatusPage(orderId);
        statusPage.load();
        statusPage.dispatchDateActualInput.sendKeys('01/01/2017');
        statusPage.dispatchDateActualUpdate.click();

        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.120.dispatchActual'));
    }));


    it('displays the order in todo list for handover to driver form upload by transport team', common.restoreDatabase('todoList.120.dispatchActual', () => {
        checkTodoList('transport', 'Upload Driver Handover Form', '/status');

        const statusPage = new orders.StatusPage(orderId);
        statusPage.load();
        statusPage.handoverToDriverExternal.click();

        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.130.handoverToDriver'));

        checkNotOnTodoList('transport');
    }));


    it('displays the order in todo list for received date dealership completion by customer manager', common.restoreDatabase('todoList.130.handoverToDriver', () => {
        checkTodoList('dealerrep', 'Enter VAN Received Date', '/status');

        const statusPage = new orders.StatusPage(orderId);
        statusPage.load();
        statusPage.receivedDateDealershipInput.sendKeys('01/01/2017');
        statusPage.receivedDateDealershipUpdate.click();

        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.140.receivedDealership'));
    }));


    it('displays the order in todo list for handover to dealership form upload by customer manager', common.restoreDatabase('todoList.140.receivedDealership', () => {
        checkTodoList('dealerrep', 'Upload Driver Handover To Dealership Form', '/status');

        const statusPage = new orders.StatusPage(orderId);
        statusPage.load();
        statusPage.handoverToDealershipExternal.click();

        // Convert 94 Order from stock to customer because otherwise the next test will fail as STOCK orders wont appear in the todo
        statusPage.linkCustomerDetails.click();
        let customerDetails = new orders.CustomerDetailsPage(orderId);
        browser.sleep(4000);
        customerDetails.customerLookupInput.sendKeys('test');
        customerDetails.customerLookupLists.get(0).click();
        customerDetails.customerFormSubmit.click();



        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.150.handover'));

    }));


    it('displays the order in todo list for customer delivery date completion by customer manager', common.restoreDatabase('todoList.150.handover', () => {
        checkTodoList('dealerrep', 'Enter Customer Delivery Date', '/status');

        const statusPage = new orders.StatusPage(orderId);
        statusPage.load();
        statusPage.customerDeliveryDateInput.sendKeys('01/01/2017');

        statusPage.customerDeliveryDateUpdate.click();

        protractor.promise.controlFlow().execute(() => common.saveDatabase('todoList.160.customerDelivery'));

        checkNotOnTodoList('dealerrep');
    }));

});
