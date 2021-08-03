'use strict';

import * as common from '../../../test-e2e/common';
import * as orders from './orders.pages';
import * as schedule from '../../../nac/schedule/protractor/schedule.pages';



describe('Test order printing', () => {

    const PRINT_ORDER_ID = 87;
    const PRINT_CHASSIS_NUM = 'NA0001';
    const PRINT_MODEL = '19FT MANTA RAY ENSUITE (MR19E)';
    const PRINT_CUSTOMER_FULLNAME = 'Checktest Checktestlast';
    const PRINT_CHASSIS_UPGRADE = 'Chassis 6"';
    const PRINT_CHASSIS_EXTRA = 'Bike Tongue on rear bumper';
    const PRINT_DEALER_DETAILS = 'Test / Training Dealer 1';
    const PRINT_DELIVERY_MONTH = 'September 2016';

    it('Can generate HTML page for specs on choosing Print (not checking actual PDF)', common.restoreDatabase('base', () => {
        common.login('admin');

        let featuresPage = new orders.FeaturesPage(PRINT_ORDER_ID);
        featuresPage.load();
        featuresPage.printMenuBtn.click();
        featuresPage.printMenu.specs.click();

        let specPrintoutPage = new orders.SpecificationPrintoutPage(PRINT_ORDER_ID);
        specPrintoutPage.initNoValidate();
        specPrintoutPage.init();

        expect($('body').getText()).toContain(`CUSTOMER: ${PRINT_CUSTOMER_FULLNAME}`);
        expect($('body').getText()).toContain(PRINT_CHASSIS_NUM);
        expect($('body').getText()).toContain(`SPECIFICATIONS ${PRINT_MODEL}`);
        expect($('body').getText()).toMatch(PRINT_CHASSIS_UPGRADE);   // TODO: Also check should be highlighted
        expect($('body').getText()).toMatch(PRINT_CHASSIS_EXTRA);     // TODO: Also check should be highlighted
    }));

    it('Can generate HTML page for brochure on choosing Print (not checking actual PDF)', common.restoreDatabase('base', () => {
        common.login('admin');

        let featuresPage = new orders.FeaturesPage(PRINT_ORDER_ID);
        featuresPage.load();
        featuresPage.printMenuBtn.click();
        featuresPage.printMenu.brochure.click();

        let brochurePrintoutPage = new orders.BrochurePrintoutPage(PRINT_ORDER_ID);
        brochurePrintoutPage.initNoValidate();
        brochurePrintoutPage.init();

        expect($('body').getText()).toContain(`Reference: ${PRINT_ORDER_ID}`);
        expect($('body').getText()).toContain(`Desired Delivery Month: ${PRINT_DELIVERY_MONTH}`);
        expect($('body').getText()).toContain(PRINT_DEALER_DETAILS);
        expect($('body').getText()).toMatch(PRINT_CHASSIS_UPGRADE);   // TODO: Also check should be highlighted
        expect($('body').getText()).toMatch(PRINT_CHASSIS_EXTRA);     // TODO: Also check should be highlighted
    }));

    it('Can generate HTML page for invoice on choosing Print (not checking actual PDF)', common.restoreDatabase('base', () => {
        common.login('admin');

        let featuresPage = new orders.FeaturesPage(PRINT_ORDER_ID);
        featuresPage.load();
        featuresPage.printMenuBtn.click();
        featuresPage.printMenu.invoice.click();

        let invoicePrintoutPage = new orders.InvoicePrintoutPage(PRINT_ORDER_ID);
        invoicePrintoutPage.initNoValidate();
        invoicePrintoutPage.init();

        expect($('body').getText()).toContain(`#${PRINT_ORDER_ID}`);
        expect($('body').getText()).toContain(PRINT_CUSTOMER_FULLNAME);
        expect($('body').getText()).toContain(PRINT_MODEL);
        expect($('body').getText()).toContain(PRINT_DEALER_DETAILS);

        expect($('body').getText()).toContain('$180.00');
        expect($('body').getText()).toContain('SPECIAL FEATURE');
        expect($('body').getText()).toContain('$250.00');
        expect($('body').getText()).toContain('$49,420.00');
    }));

    it('Available VIN number and special feature customer description on invoice', common.restoreDatabase('base', () => {

        const orderId = 88;
        const vinNum = '6KZNEWAGEGC123456';
        const customerDes = 'Customer Description One';
        common.login('admin');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        // fill in the missing plumbing
        featuresPage.plumbing.panel.click();
        featuresPage.plumbing.toiletDropdown.click();
        featuresPage.plumbing.toiletDropdown.element(by.cssContainingText('li', 'Toilet - Ceramic')).click();

        featuresPage.save.click();

        // Add new special feature with out customer discription and approve special feature
        featuresPage.linkSpecialFeatures.click();

        let specialFeaturesPage = new orders.SpecialFeaturesPage();
        specialFeaturesPage.init();
        specialFeaturesPage.addSpecialFeature.click();
        specialFeaturesPage.customerDescription.sendKeys(customerDes);
        specialFeaturesPage.approve.click();
        specialFeaturesPage.save.click();

        //specialFeaturesPage.requestFinalization.click();
        specialFeaturesPage.requestToPlaceOrder.click();
        specialFeaturesPage.placeOrder.click();
        specialFeaturesPage.placeOrderPopup.modal.waitForOpen();
        specialFeaturesPage.placeOrderPopup.placeOrderButton.click();
        specialFeaturesPage.placeOrderPopup.modal.waitForClose();
        browser.refresh();

        specialFeaturesPage.linkStatus.click();

        let statusPage = new orders.StatusPage();
        statusPage.init();

        // finalize order
        statusPage.finalizeOrder.click();
        browser.refresh();

        // Appoints drafter
        statusPage.drafterSelection.click();
        statusPage.drafterSelection.element(by.cssContainingText('option','Drafter')).click();
        statusPage.drafterAppoint.click();

        // Add Customer plan
        statusPage.customerPlanUploadInput.sendKeys(common.absoluteFilePathForUpload);
        statusPage.customerPlanUploadButton.click();

        // Remove Customer plan
        statusPage.customerPlanDeleteLink.click();

        // Re-add Customer plan (after testing removal)
        statusPage.customerPlanUploadInput.sendKeys(common.absoluteFilePathForUpload);
        statusPage.customerPlanUploadButton.click();

        // Upload Factory plan
        statusPage.factoryPlanUploadInput.sendKeys(common.absoluteFilePathForUpload);
        statusPage.factoryPlanUploadButton.click();

        // Remove Factory plan
        statusPage.factoryPlanDeleteLink.click();

        // Add Factory plan external
        statusPage.factoryPlanExternal.click();

        // Upload Chassis plan
        statusPage.chassisPlanUploadInput.sendKeys(common.absoluteFilePathForUpload);
        statusPage.chassisPlanUploadButton.click();

        // Remove Chassis plan
        statusPage.chassisPlanDeleteLink.click();

        // Add Chassis plan external
        statusPage.chassisPlanExternal.click();

        // Need to assign production dates to get the VIN enabled.
        const dashboardPage = new schedule.DashboardPage();
        dashboardPage.loadUsingMenuLink();
        dashboardPage.enterMonth.clear().sendKeys('Sep 2016');
        dashboardPage.assignDates.click();
        browser.sleep(1000)
        dashboardPage.enterMonth.clear().sendKeys('Oct 2016');
        dashboardPage.assignDates.click();
        browser.sleep(1000)

        statusPage = new orders.StatusPage(orderId);
        statusPage.load();

        // Assign VIN Number
        statusPage.vinNumberInput.sendKeys(vinNum);
        statusPage.vinNumberUpdate.click();
        browser.sleep(1000)

        featuresPage.load();
        featuresPage.saveOrder.click();
        featuresPage.printMenuBtn.click();
        featuresPage.printMenu.invoice.click();

        let invoicePrintoutPage = new orders.InvoicePrintoutPage(orderId);
        invoicePrintoutPage.initNoValidate();
        invoicePrintoutPage.init();

        expect($('body').getText()).toContain(`#${orderId}`);
        expect($('body').getText()).toContain(`${vinNum}`);
        expect($('body').getText()).toContain(`${customerDes}`);
        // print factory description in lieu of customer description is not added because that bit is defensive at the moment.

    }));

    it('Can generate HTML page for AutoCAD on choosing Print (not checking actual PDF)', common.restoreDatabase('base', () => {
        common.login('admin');

        let featuresPage = new orders.FeaturesPage(PRINT_ORDER_ID);
        featuresPage.load();
        featuresPage.printMenuBtn.click();
        featuresPage.printMenu.autocad.click();

        let autocadPrintoutPage = new orders.AutoCADPrintoutPage(PRINT_ORDER_ID);
        autocadPrintoutPage.initNoValidate();
        autocadPrintoutPage.init();

        expect($('body').getText()).toContain(PRINT_CUSTOMER_FULLNAME);
        expect($('body').getText()).toContain(PRINT_CHASSIS_NUM);
        expect($('body').getText()).toContain(PRINT_MODEL);
        expect($('body').getText()).toContain(PRINT_DEALER_DETAILS);

        expect($('body').getText()).toMatch(PRINT_CHASSIS_UPGRADE);   // TODO: Also check should be highlighted
        expect($('body').getText()).toMatch(PRINT_CHASSIS_EXTRA);     // TODO: Also check should be highlighted
    }));

    it('Special feature customer discription available on spec before lock order', common.restoreDatabase('base', () => {

        const orderId = 88;
        const beforeLock = 'Special features subject to manufacturer approval';
        common.login('admin');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        // fill in the missing plumbing
        featuresPage.plumbing.panel.click();
        featuresPage.plumbing.toiletDropdown.click();
        featuresPage.plumbing.toiletDropdown.element(by.cssContainingText('li', 'Toilet - Ceramic')).click();

        featuresPage.save.click();

        //approve special feature
        featuresPage.linkSpecialFeatures.click();
        let specialFeaturesPage = new orders.SpecialFeaturesPage(orderId);
        specialFeaturesPage.approve.click();
        specialFeaturesPage.save.click();


        specialFeaturesPage.requestToPlaceOrder.click();
        specialFeaturesPage.placeOrder.click();
        specialFeaturesPage.placeOrderPopup.modal.waitForOpen();
        specialFeaturesPage.placeOrderPopup.placeOrderButton.click();
        specialFeaturesPage.placeOrderPopup.modal.waitForClose();
        browser.refresh();

        featuresPage.load();
        featuresPage.printMenuBtn.click();
        featuresPage.printMenu.specs.click();

        let specPrintoutPage = new orders.SpecificationPrintoutPage(orderId);
        specPrintoutPage.initNoValidate();
        specPrintoutPage.init();

        expect($('body').getText()).toContain(beforeLock);


    }));

    it('Bottom section available on spec after lock order', common.restoreDatabase('base', () => {

        const orderId = 88;
        const afterLock = 'All content is the exclusive intellectual property of New Age Caravans.';
        common.login('admin');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        // fill in the missing plumbing
        featuresPage.plumbing.panel.click();
        featuresPage.plumbing.toiletDropdown.click();
        featuresPage.plumbing.toiletDropdown.element(by.cssContainingText('li', 'Toilet - Ceramic')).click();

        featuresPage.save.click();

        //approve special feature
        featuresPage.linkSpecialFeatures.click();
        let specialFeaturesPage = new orders.SpecialFeaturesPage(orderId);
        specialFeaturesPage.approve.click();
        specialFeaturesPage.save.click();


        specialFeaturesPage.requestToPlaceOrder.click();
        specialFeaturesPage.placeOrder.click();
        specialFeaturesPage.placeOrderPopup.modal.waitForOpen();
        specialFeaturesPage.placeOrderPopup.placeOrderButton.click();
        specialFeaturesPage.placeOrderPopup.modal.waitForClose();
        browser.refresh();

        let statusPage = new orders.StatusPage();
        statusPage.init();

        // finalize order
        statusPage.finalizeOrder.click();
        browser.refresh();

        featuresPage.load();
        featuresPage.printMenuBtn.click();
        featuresPage.printMenu.specs.click();

        let specPrintoutPage = new orders.SpecificationPrintoutPage(orderId);
        specPrintoutPage.initNoValidate();
        specPrintoutPage.init();

        expect($('body').getText()).toContain(afterLock);


    }));

});
