'use strict';

import * as common from '../../../test-e2e/common';
import * as orders from './orders.pages';
import * as newage from '../../../nac/newage/protractor/newage.pages';
import * as schedule from '../../../nac/schedule/protractor/schedule.pages';


describe('Test orders with custom series/code', () => {

    const orderId = 90;
    const customSeriesName = 'Test Custom Name';
    const customSeriesCode = 'TCN123';
    const customSeriesDescription = `${customSeriesName} (${customSeriesCode})`;

    it('Can set a custom series name and code', common.restoreDatabase('base', () => { // TODO: uncomment check prints

        common.login('admin');

        let specialFeaturesPage = new orders.SpecialFeaturesPage(orderId);
        specialFeaturesPage.load();

        specialFeaturesPage.customSeriesName.sendKeys(customSeriesName);
        specialFeaturesPage.customSeriesCode.sendKeys(customSeriesCode);

        specialFeaturesPage.save.click();
        expect(specialFeaturesPage.alertDetailsSaved.isPresent()).toBeTruthy();

        // Check the textboxes
        expect(specialFeaturesPage.customSeriesName.getAttribute('value')).toContain(customSeriesName);
        expect(specialFeaturesPage.customSeriesCode.getAttribute('value')).toContain(customSeriesCode);

        // Check the top of the order page
        expect(specialFeaturesPage.modelDescription.getText()).toContain(customSeriesCode);
        specialFeaturesPage.requestToPlaceOrder.click();
        specialFeaturesPage.placeOrder.click();
        specialFeaturesPage.placeOrderPopup.modal.waitForOpen();
        specialFeaturesPage.placeOrderPopup.placeOrderButton.click();
        specialFeaturesPage.placeOrderPopup.modal.waitForClose();

        protractor.promise.controlFlow().execute(() => common.saveDatabase('order.customSeries'));
    }));


    const featuresPage = new orders.FeaturesPage(orderId);
    // Check the 4 printouts
    const checkPrint = function(type, button, PrintPage, strings) {
        it(`Printout (${type})`, common.restoreDatabase('order.customSeries', () => {
            common.login('admin');

            featuresPage.load();
            featuresPage.printMenuBtn.click();
            button.click();

            const printPage = new PrintPage(orderId);
            printPage.init();

            strings.forEach(s => {
                expect($('body').getText().then(x => x.toLowerCase())).toContain(s.toLowerCase(), `${type} print output contains ${s}`);
            });
        }));
    };

    checkPrint('Specs',   featuresPage.printMenu.specs,   orders.SpecificationPrintoutPage,[customSeriesCode, customSeriesDescription]);
    checkPrint('Invoice', featuresPage.printMenu.invoice, orders.InvoicePrintoutPage,      [customSeriesCode, customSeriesDescription]);
    checkPrint('Brochure',featuresPage.printMenu.brochure,orders.BrochurePrintoutPage,     [customSeriesCode, customSeriesName]);
    checkPrint('AutoCAD', featuresPage.printMenu.autocad, orders.AutoCADPrintoutPage,      [customSeriesCode, customSeriesDescription]);



    it('Order Listing Page', common.restoreDatabase('order.customSeries', () => {
        common.login('admin');
        // Check the order list page
        let orderListPage = new orders.OrderListPage();
        orderListPage.load();
        expect(orderListPage.table.getText()).toContain(customSeriesDescription);
    }));


    xit('Todo list [FIXME]', common.restoreDatabase('order.customSeries', () => {
        common.login('admin');

browser.pause();
// now go to http://localhost:8000/newage/orders/#/90/special_features
// and you will see unapprove features.
// Click on Save Order (nothing should have changed)
// Return to the home page
// Item 90 reappears in the todo list
//
// The underlying cause is that the special_features_approved_at/special_features_approved_by_id fields
// get set/unset on every 2nd save

        // Check the todo list
        let homePage = new newage.HomePage();
        homePage.load();
        expect(homePage.todoItems.getText()).toContain(customSeriesDescription);
    }));


    it('Dashboard', common.restoreDatabase('order.customSeries', () => {
        common.login('admin');

        // Check the dashboard
        let dashboardPage = new schedule.DashboardPage();
        dashboardPage.loadUsingMenuLink();
        dashboardPage.enterMonth.clear().sendKeys('Sep 2016');
        browser.actions().sendKeys(protractor.Key.ENTER).perform();
        expect(dashboardPage.table.getText()).toContain(customSeriesCode);
    }));

});
