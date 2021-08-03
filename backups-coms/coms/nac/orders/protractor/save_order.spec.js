'use strict';

import * as common from '../../../test-e2e/common';
import * as orders from './orders.pages';
import * as newage from '../../../nac/newage/protractor/newage.pages';
import * as schedule from '../../../nac/schedule/protractor/schedule.pages';


describe('Test new orders page saving', () => {


    it('Can save and load a new order just after creation', common.restoreDatabase('base', () => {

        const orderId = 93;

        common.login('admin');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();
        featuresPage.save.click();
        expect(featuresPage.alertDetailsSaved.isPresent()).toBeTruthy();
        expect(element.all(by.css('div.missing-selections')).count()).toEqual(5);

        featuresPage.linkModelSeries.click();
        let modelSeriesPage = new orders.ModelSeriesPage();
        modelSeriesPage.init();
        expect(modelSeriesPage.model.getAttribute('value')).toEqual('number:2');
        expect(modelSeriesPage.series.getAttribute('value')).toEqual('number:15');

        modelSeriesPage.linkCustomerDetails.click();
        let customerDetailsPage = new orders.CustomerDetailsPage();
        customerDetailsPage.init();
        expect(customerDetailsPage.dealershipForCustomer.getAttribute('value')).toEqual('number:1');
        expect(customerDetailsPage.customerFirstname.getAttribute('value')).toEqual('Test user firstname 01');
        expect(customerDetailsPage.customerLastname.getAttribute('value')).toEqual('Test user lastname 01');
        expect(customerDetailsPage.customerEmail.getAttribute('value')).toEqual('testuser01@example.com');
        expect(customerDetailsPage.customerMailingList.getAttribute('checked')).toEqual('true');
        expect(customerDetailsPage.customerPhone.getAttribute('value')).toEqual('0198765432');
        expect(customerDetailsPage.customerPartnerName.getAttribute('value')).toEqual('Test user partner 01');
        expect(customerDetailsPage.customerTowVehicle.getAttribute('value')).toEqual('Test user car 01');
        expect(customerDetailsPage.customerSourceOfAwareness.getAttribute('value')).toEqual('number:4');
        expect(customerDetailsPage.customerAcquisitionSource.getAttribute('value')).toEqual('number:5');
        expect(customerDetailsPage.customerAddressName.getAttribute('value')).toEqual('Test user name 01');
        expect(customerDetailsPage.customerAddressStreet.getAttribute('value')).toEqual('01 Testuser St');
        expect(customerDetailsPage.customerAddressSuburb.getAttribute('value')).toEqual('NUNAWADING');
        expect(customerDetailsPage.customerAddressState.getAttribute('value')).toEqual('string:VIC');
        expect(customerDetailsPage.customerAddressPostCode.getAttribute('value')).toEqual('3131');
    }));


    it('Can save and load order with selection made', common.restoreDatabase('base', () => {

        const orderId = 93;

        common.login('admin');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        expect(featuresPage.chassis.firstItem.isDisplayed()).toBeFalsy();

        featuresPage.chassis.panel.click();
        expect(featuresPage.chassis.firstItem.isDisplayed()).toBeTruthy();
        expect(featuresPage.chassis.linoColourUnselected.isPresent()).toBeTruthy();

        featuresPage.chassis.linoColourDropdown.click();
        featuresPage.chassis.linoColourDropdown.element(by.cssContainingText('li', 'Lino - Timber Naturel')).click();
        expect(featuresPage.chassis.linoColourUnselected.isPresent()).toBeFalsy();
        expect(featuresPage.chassis.linoColourCurrent.getText()).toEqual('Lino - Timber Naturel');
        expect(element.all(by.css('div.missing-selections')).count()).toEqual(4);


        expect(featuresPage.furniture.firstItem.isDisplayed()).toBeFalsy();

        featuresPage.furniture.panel.click();
        expect(featuresPage.furniture.firstItem.isDisplayed()).toBeTruthy();
        expect(featuresPage.furniture.laminexColourUnselected.isPresent()).toBeTruthy();
        expect(featuresPage.furniture.panelColourBaseUnselected.isPresent()).toBeTruthy();
        expect(featuresPage.furniture.panelColourOverheadUnselected.isPresent()).toBeTruthy();
        expect(featuresPage.furniture.splashbackColourUnselected.isPresent()).toBeTruthy();

        featuresPage.furniture.bedDropdown.click();
        featuresPage.furniture.bedDropdown.element(by.cssContainingText('li', 'Bed Queen (BEDQ)')).click();
        expect(featuresPage.furniture.bedUnselected.isPresent()).toBeFalsy();
        expect(featuresPage.furniture.bedCurrent.getText()).toEqual('Bed Queen (BEDQ)');

        featuresPage.furniture.laminexColourDropdown.click();
        featuresPage.furniture.laminexColourDropdown.element(by.cssContainingText('li', 'Laminex - Lunar Stone')).click();
        expect(featuresPage.furniture.laminexColourUnselected.isPresent()).toBeFalsy();
        expect(featuresPage.furniture.laminexColourCurrent.getText()).toEqual('Laminex - Lunar Stone');

        featuresPage.furniture.panelColourBaseDropdown.click();
        featuresPage.furniture.panelColourBaseDropdown.element(by.cssContainingText('li', 'Panel (Base) - Sable Satin')).click();
        expect(featuresPage.furniture.panelColourBaseUnselected.isPresent()).toBeFalsy();
        expect(featuresPage.furniture.panelColourBaseCurrent.getText()).toEqual('Panel (Base) - Sable Satin');

        featuresPage.furniture.panelColourOverheadDropdown.click();
        featuresPage.furniture.panelColourOverheadDropdown.element(by.cssContainingText('li', 'Panel (OHC) - White Matt')).click();
        expect(featuresPage.furniture.panelColourOverheadUnselected.isPresent()).toBeFalsy();
        expect(featuresPage.furniture.panelColourOverheadCurrent.getText()).toEqual('Panel (OHC) - White Matt');

        featuresPage.furniture.splashbackColourDropdown.click();
        featuresPage.furniture.splashbackColourDropdown.element(by.cssContainingText('li', 'Splashback - Silver Pixel')).click();
        expect(featuresPage.furniture.splashbackColourUnselected.isPresent()).toBeFalsy();
        expect(featuresPage.furniture.splashbackColourCurrent.getText()).toEqual('Splashback - Silver Pixel');
        expect(element.all(by.css('div.missing-selections')).count()).toEqual(3);

        featuresPage.save.click();
        expect(featuresPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');

        browser.refresh();

        expect(element.all(by.css('div.missing-selections')).count()).toEqual(3);

        featuresPage.chassis.panel.click();
        expect(featuresPage.chassis.linoColourUnselected.isPresent()).toBeFalsy();
        expect(featuresPage.chassis.linoColourCurrent.getText()).toEqual('Lino - Timber Naturel');

        featuresPage.furniture.panel.click();
        expect(featuresPage.furniture.bedUnselected.isPresent()).toBeFalsy();
        expect(featuresPage.furniture.bedCurrent.getText()).toEqual('Bed Queen (BEDQ)');
        expect(featuresPage.furniture.laminexColourUnselected.isPresent()).toBeFalsy();
        expect(featuresPage.furniture.laminexColourCurrent.getText()).toEqual('Laminex - Lunar Stone');
        expect(featuresPage.furniture.panelColourBaseUnselected.isPresent()).toBeFalsy();
        expect(featuresPage.furniture.panelColourBaseCurrent.getText()).toEqual('Panel (Base) - Sable Satin');
        expect(featuresPage.furniture.panelColourOverheadUnselected.isPresent()).toBeFalsy();
        expect(featuresPage.furniture.panelColourOverheadCurrent.getText()).toEqual('Panel (OHC) - White Matt');
        expect(featuresPage.furniture.splashbackColourUnselected.isPresent()).toBeFalsy();
        expect(featuresPage.furniture.splashbackColourCurrent.getText()).toEqual('Splashback - Silver Pixel');
    }));


    it('Can save and load order with extra items', common.restoreDatabase('base', () => {

        const orderId = 93;

        common.login('admin');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        featuresPage.chassis.panel.click();
        expect(featuresPage.chassis.items.count()).toEqual(16);

        featuresPage.chassis.addExtra.click();
        featuresPage.optionsModal.waitForOpen();
        expect(featuresPage.chassis.extraModal.isDisplayed()).toBeTruthy();

        featuresPage.chassis.extraItems.get(1).click();
        featuresPage.chassis.extraModalClose.click();
        featuresPage.optionsModal.waitForClose();
        expect(featuresPage.chassis.extraModal.isDisplayed()).toBeFalsy();
        expect(featuresPage.chassis.items.count()).toEqual(17);
        expect(featuresPage.chassis.items.get(16).element(by.cssContainingText('div.item-name', 'Extra Spare Wheel - 265/75 R16 Cooper Stt')).isPresent()).toBeTruthy();
        expect(featuresPage.totalCost.getText()).toEqual('$62,965.00');

        featuresPage.save.click();
        expect(featuresPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');

        browser.refresh();

        featuresPage.chassis.panel.click();
        expect(featuresPage.chassis.extraModal.isDisplayed()).toBeFalsy();
        expect(featuresPage.chassis.items.count()).toEqual(17);
        expect(featuresPage.chassis.items.get(16).element(by.cssContainingText('div.item-name', 'Extra Spare Wheel - 265/75 R16 Cooper Stt')).isPresent()).toBeTruthy();
        expect(featuresPage.totalCost.getText()).toEqual('$62,965.00');
    }));


    it('Can save and load order with special features', common.restoreDatabase('base', () => {

        const orderId = 93;

        common.login('admin');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        featuresPage.linkSpecialFeatures.click();

        let specialFeaturesPage = new orders.SpecialFeaturesPage();
        specialFeaturesPage.init();

        specialFeaturesPage.addSpecialFeature.click();
        specialFeaturesPage.customerDescription.get(0).sendKeys('Special feature 1');
        specialFeaturesPage.save.click();
        expect(specialFeaturesPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');

        browser.refresh();

        expect(specialFeaturesPage.customerDescription.count()).toEqual(1);

        expect(specialFeaturesPage.customerDescription.get(0).getAttribute('value')).toEqual('Special feature 1');

        specialFeaturesPage.addSpecialFeature.click();
        expect(specialFeaturesPage.customerDescription.count()).toEqual(2);

        specialFeaturesPage.customerDescription.get(1).sendKeys('Special feature 2');

        specialFeaturesPage.save.click();
        expect(specialFeaturesPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');

        browser.refresh();

        expect(specialFeaturesPage.customerDescription.count()).toEqual(2);

        expect(specialFeaturesPage.customerDescription.get(0).getAttribute('value')).toEqual('Special feature 1');
        expect(specialFeaturesPage.customerDescription.get(1).getAttribute('value')).toEqual('Special feature 2');

        specialFeaturesPage.remove.get(0).click();
        expect(specialFeaturesPage.customerDescription.count()).toEqual(1);
        expect(specialFeaturesPage.customerDescription.get(0).getAttribute('value')).toEqual('Special feature 2');

        specialFeaturesPage.save.click();
        expect(specialFeaturesPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');

        browser.refresh();

        expect(specialFeaturesPage.customerDescription.count()).toEqual(1);
        expect(specialFeaturesPage.customerDescription.get(0).getAttribute('value')).toEqual('Special feature 2');
    }));

    it('Move Order to Approved State', common.restoreDatabase('base', () => {
        const orderId = 88;
        common.login('admin');
        const featuresPage = new orders.FeaturesPage(orderId);

        featuresPage.load();
        featuresPage.plumbing.panel.click();
        featuresPage.plumbing.toiletDropdown.click();
        featuresPage.plumbing.toiletDropdown.element(by.cssContainingText('li', 'Toilet - Ceramic')).click();

        expect(featuresPage.plumbing.toiletUnselected.isPresent()).toBeFalsy();
        featuresPage.save.click();
        featuresPage.requestToPlaceOrder.click();
        featuresPage.placeOrder.click();
        featuresPage.placeOrderPopup.modal.waitForOpen();
        featuresPage.placeOrderPopup.placeOrderButton.click();
        featuresPage.placeOrderPopup.modal.waitForClose();

        protractor.promise.controlFlow().execute(() => common.saveDatabase('saveorder.010.quote_88_to_order'));

    }));

    it('Can correctly make adjustments', common.restoreDatabase('saveorder.010.quote_88_to_order', () => {
        const orderId = 88;

        common.login('dealerrep');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();
        featuresPage.displayTotalsBtn.click();
        featuresPage.displayTotals.modal.waitForOpen();

        // dealer reps only have retail header
        expect(featuresPage.displayTotals.panel.headers.count()).toEqual(2);
        expect(featuresPage.displayTotals.panel.headers.get(1).getAttribute('innerHTML')).toContain('Retail');

        common.login('dealerprincipal');

        featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();
        featuresPage.displayTotalsBtn.click();
        featuresPage.displayTotals.modal.waitForOpen();

        // dealer principal can input overrides
        // must enter a comment if you override the wholesale price
        expect(featuresPage.displayTotals.panel.getAttribute('innerHTML')).toContain('input');
        featuresPage.displayTotals.adjustmentRetail.sendKeys('10');
        expect(featuresPage.displayTotals.adjustmentWholesaleCommentError.isPresent()).toBeFalsy();
        featuresPage.displayTotals.adjustmentWholesale.sendKeys('1010');
        expect(featuresPage.displayTotals.adjustmentWholesaleCommentError.isPresent()).toBeTruthy();

        expect(featuresPage.displayTotals.totalWholeSale.getText()).toEqual('$50,000.00');
        expect(featuresPage.displayTotals.totalMargin.getText()).toEqual('$12,150.00');
        expect(featuresPage.displayTotals.totalRetail.getText()).toEqual('$62,150.00');

        featuresPage.displayTotals.modal.closeButton.click();
        featuresPage.displayTotals.modal.waitForClose();
        featuresPage.saveOrder.click();

        expect(featuresPage.alertContainingText('You need to enter a comment', 'danger').isPresent()).toBeTruthy();

        // Now we should be able to save correctly
        featuresPage.displayTotalsBtn.click();
        featuresPage.displayTotals.modal.waitForOpen();
        expect(featuresPage.displayTotals.adjustmentWholesaleCommentError.isPresent()).toBeTruthy();
        featuresPage.displayTotals.adjustmentWholesaleComment.sendKeys('Friendly customer discount');
        expect(featuresPage.displayTotals.adjustmentWholesaleCommentError.isPresent()).toBeFalsy();

        featuresPage.displayTotals.modal.closeButton.click();
        featuresPage.displayTotals.modal.waitForClose();
        featuresPage.saveOrder.click();

        expect(featuresPage.alertDetailsSaved.isPresent()).toBeTruthy();
    }));

    it('Can set conditions', common.restoreDatabase('saveorder.010.quote_88_to_order', () => {
        const orderId = 88;

        common.login('dealerprincipal');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        expect(featuresPage.subjectToBtn.getAttribute('outerHTML')).toContain('btn-default');

        featuresPage.subjectToBtn.click();
        featuresPage.subjectTo.modal.waitForOpen();

        expect(featuresPage.subjectTo.panel.getAttribute('innerHTML')).toContain('input');
        featuresPage.subjectTo.conditionText.sendKeys('some weird conditions');
        featuresPage.subjectTo.close.click();
        featuresPage.subjectTo.modal.waitForClose();

        expect(featuresPage.subjectToBtn.getAttribute('outerHTML')).toContain('btn-warning');
        featuresPage.saveOrder.click();
        expect(featuresPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');

        browser.refresh();

        expect(featuresPage.subjectToBtn.getAttribute('outerHTML')).toContain('btn-warning');
        featuresPage.subjectToBtn.click();
        featuresPage.subjectTo.modal.waitForOpen();

        expect(featuresPage.subjectTo.conditionText.getAttribute('value')).toContain('some weird conditions');
        featuresPage.subjectTo.close.click();
        featuresPage.subjectTo.modal.waitForClose();

        let orderListPage = new orders.OrderListPage();
        orderListPage.loadUsingMenuLink();
        orderListPage.filterListHeader.click();

        browser.wait(() => element(by.css('.panel-collapse.collapse.in')).isPresent(), 500, 'Long wait for filter dialog');

        orderListPage.filterUnmetConditions.click();
        orderListPage.filterUnmetConditions.element(by.cssContainingText('option','Yes')).click();
        orderListPage.filterSubmit.click();

        expect(orderListPage.recordCount.getText()).toEqual('Total Records: 1');

        featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();
        expect(featuresPage.subjectToBtn.getAttribute('outerHTML')).toContain('btn-warning');
        featuresPage.subjectToBtn.click();
        featuresPage.subjectTo.modal.waitForOpen();
        featuresPage.subjectTo.conditionMet.click();
        featuresPage.subjectTo.close.click();
        featuresPage.subjectTo.modal.waitForClose();
        expect(featuresPage.subjectToBtn.getAttribute('outerHTML')).toContain('btn-success');

        featuresPage.saveOrder.click();
        expect(featuresPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');

        browser.refresh();

        expect(featuresPage.subjectToBtn.getAttribute('outerHTML')).toContain('btn-success');
        featuresPage.subjectToBtn.click();
        featuresPage.subjectTo.modal.waitForOpen();

        expect(featuresPage.subjectTo.conditionText.getAttribute('value')).toContain('some weird conditions');


    }));

    it('Can set after-market notes', common.restoreDatabase('saveorder.010.quote_88_to_order', () => {
        const orderId = 88;

        common.login('dealerprincipal');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        featuresPage.afterMarketBtn.click();
        featuresPage.afterMarket.modal.waitForOpen();

        expect(featuresPage.afterMarket.panel.getAttribute('innerHTML')).toContain('textarea');
        featuresPage.afterMarket.noteText.sendKeys('some weird conditions');
        featuresPage.afterMarket.close.click();
        featuresPage.afterMarket.modal.waitForClose();

        featuresPage.saveOrder.click();
        expect(featuresPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');

        featuresPage.afterMarketBtn.click();
        featuresPage.afterMarket.modal.waitForOpen();

        expect(featuresPage.afterMarket.noteText.getAttribute('value')).toContain('some weird conditions');
    }));

    xit('Can set show special [FIXME] [failing due to same show presenting multiple times]', common.restoreDatabase('base', () => {
        const orderId = 77;

        common.login('dealerrep');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        // browser.sleep(500);
        featuresPage.showSpecialBtn.click();
        featuresPage.showSpecial.modal.waitForOpen();

        // Issue - If special features in Admin have 2 feature rules and if both of them are valid in the order,
        // Then the same special offer is displayed twice. Its a Bug in the code.
        // However In staging server this issue was not found ( when tested - Looks like)

        // Levi 2017-04-07; the featuresPage.showSpecial.apply is present multiple times, this appears to be a bug
        expect(element.all(by.buttonText('Apply this special')).count()).toBe(1, 'Should be exactly 1 button per show');

        featuresPage.showSpecial.apply.click();
        featuresPage.showSpecial.close.click();
        featuresPage.showSpecial.modal.waitForClose();

        featuresPage.displayTotalsBtn.click();
        featuresPage.displayTotals.modal.waitForOpen();

        // TODO: Is totalShowSpecial defined correctly?
        expect(featuresPage.displayTotals.totalShowSpecial.getText()).toEqual('-$170.00');

    }));

    it('Choosing an upgrade reflect on total price', common.restoreDatabase('base', () => {
        const orderId = 90;

        common.login('dealerprincipal');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        expect(featuresPage.totalCharge.getText()).toEqual('$64,440.00');
        expect(featuresPage.chassis.firstItem.isDisplayed()).toBeFalsy();

        featuresPage.chassis.panel.click();
        expect(featuresPage.chassis.firstItem.isDisplayed()).toBeTruthy();

        featuresPage.chassis.aFrame.click();
        featuresPage.chassis.aFrame.element(by.cssContainingText('li', 'A-Frame 6"')).click();
        featuresPage.save.click();
        expect(featuresPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');
        browser.refresh();
        expect(featuresPage.totalCharge.getText()).toEqual('$64,837.50');

    }));

    it('Generates the correct error when price is invalid', common.restoreDatabase('base', () => {
        const orderId = 90;
        common.login('admin');
        let specialFeaturesPage = new orders.SpecialFeaturesPage(orderId);
        specialFeaturesPage.load();

        specialFeaturesPage.wholesalePrice.sendKeys('n/c');
        specialFeaturesPage.save.click();
        expect(element(by.css('div.alert.alert-danger')).getText()).toContain("1- 'n/c' value must be a decimal number.");
    }));

    it('Dealer pricipal able to add retail price, wholesale dealer load price, wholesale trade in writeback and comments to a finalised order ', common.restoreDatabase('base', () => {
        const orderId = 92;
        const retailPrice = '90';
        const dealerLoadPrice = '200';
        const tradeInPrice = '250';
        const comments = 'This is a test comment';

        common.login('dealerprincipal');
        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        featuresPage.displayTotalsBtn.click();
        browser.wait(protractor.ExpectedConditions.elementToBeClickable(featuresPage.displayTotals.adjustmentRetail));
        featuresPage.displayTotals.adjustmentRetail.clear().sendKeys(retailPrice);
        featuresPage.displayTotals.dealerLoadPrice.clear().sendKeys(dealerLoadPrice);
        featuresPage.displayTotals.tradeinWriteback.clear().sendKeys(tradeInPrice);
        featuresPage.displayTotals.otherComments.sendKeys(comments);
        featuresPage.displayTotals.saveBtn.click();

        featuresPage.displayTotalsBtn.click();
        browser.wait(protractor.ExpectedConditions.elementToBeClickable(featuresPage.displayTotals.adjustmentRetail));

        expect(featuresPage.displayTotals.adjustmentRetail.getAttribute('value')).toEqual(retailPrice);
        expect(featuresPage.displayTotals.dealerLoadPrice.getAttribute('value')).toEqual(dealerLoadPrice);
        expect(featuresPage.displayTotals.tradeinWriteback.getAttribute('value')).toEqual(tradeInPrice);
        expect(featuresPage.displayTotals.otherComments.getAttribute('value')).toEqual(comments);

        protractor.promise.controlFlow().execute(() => common.saveDatabase('saveorder.020.order_92_addetailprice'));

    }));

    it('Retail price adjustment is saving successfully when changed to zero ', common.restoreDatabase('saveorder.020.order_92_addetailprice', () => {
        const orderId = 92;
        common.login('dealerprincipal');
        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        featuresPage.displayTotalsBtn.click();
        browser.wait(protractor.ExpectedConditions.elementToBeClickable(featuresPage.displayTotals.adjustmentRetail));
        featuresPage.displayTotals.adjustmentRetail.clear().sendKeys('0');
        featuresPage.displayTotals.saveBtn.click();
        featuresPage.displayTotalsBtn.click();
        browser.wait(protractor.ExpectedConditions.elementToBeClickable(featuresPage.displayTotals.adjustmentRetail));
        expect(featuresPage.displayTotals.totalRetail.getText()).toEqual('$60,000.00');

    }));

    it('Dealer pricipal able to add after sales wholesales, retail price and comments to a finalised order and total changes accordingly ', common.restoreDatabase('base', () => {
        const orderId = 92;
        const afterSalesWholesale = '100';
        const afterSalesretail = '150';
        const description = 'This is a test description';
        const totalWholesaleBefore = '$50,000.00';
        const totalretailBefore = '$60,000.00';
        const totalWholesaleAfter = '$50,100.00';
        const totalretailAfter = '$60,150.00';

        common.login('dealerprincipal');
        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        featuresPage.displayTotalsBtn.click();
        browser.wait(protractor.ExpectedConditions.elementToBeClickable(featuresPage.displayTotals.afterSalesWholesale));

        expect(featuresPage.displayTotals.totalWholeSale.getText()).toEqual(totalWholesaleBefore);
        expect(featuresPage.displayTotals.totalRetail.getText()).toEqual(totalretailBefore);

        featuresPage.displayTotals.afterSalesWholesale.clear().sendKeys(afterSalesWholesale);
        featuresPage.displayTotals.afterSalesRetail.clear().sendKeys(afterSalesretail);
        featuresPage.displayTotals.afterSalesDescription.sendKeys(description);
        featuresPage.displayTotals.saveBtn.click();

        featuresPage.displayTotalsBtn.click();
        browser.wait(protractor.ExpectedConditions.elementToBeClickable(featuresPage.displayTotals.afterSalesWholesale));

        expect(featuresPage.displayTotals.afterSalesWholesale.getAttribute('value')).toEqual(afterSalesWholesale);
        expect(featuresPage.displayTotals.afterSalesRetail.getAttribute('value')).toEqual(afterSalesretail);
        expect(featuresPage.displayTotals.afterSalesDescription.getAttribute('value')).toEqual(description);
        expect(featuresPage.displayTotals.totalWholeSale.getText()).toEqual(totalWholesaleAfter);
        expect(featuresPage.displayTotals.totalRetail.getText()).toEqual(totalretailAfter);

    }));

    it('Generate order history notes for After sales description and After sales amount updates ', common.restoreDatabase('base', () => {
        const orderId = 92;
        const afterSalesWholesale = '100';
        const afterSalesretail = '150';
        const description = 'This is a test description';
        const afterSalesWholesaleEdit = '200';
        const afterSalesretailEdit = '250';
        const descriptionEdit = 'This is an edited description';
        const historyAction = 'Costings';
        const wholesaleHistoryDetail = `After Sales Wholesale changed from $${afterSalesWholesale}.00 to $${afterSalesWholesaleEdit}`;
        const retailHistoryDetail = `After Sales Retail changed from $${afterSalesretail}.00 to $${afterSalesretailEdit}`;
        const Historydescription = `After Sales Description changed from [${description}] to [${descriptionEdit}]`;


        common.login('dealerprincipal');
        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        featuresPage.displayTotalsBtn.click();
        browser.wait(protractor.ExpectedConditions.elementToBeClickable(featuresPage.displayTotals.afterSalesWholesale));

        featuresPage.displayTotals.afterSalesWholesale.clear().sendKeys(afterSalesWholesale);
        featuresPage.displayTotals.afterSalesRetail.clear().sendKeys(afterSalesretail);
        featuresPage.displayTotals.afterSalesDescription.sendKeys(description);
        featuresPage.displayTotals.saveBtn.click();

        featuresPage.displayTotalsBtn.click();
        browser.wait(protractor.ExpectedConditions.elementToBeClickable(featuresPage.displayTotals.afterSalesWholesale));

        featuresPage.displayTotals.afterSalesWholesale.clear().sendKeys(afterSalesWholesaleEdit);
        featuresPage.displayTotals.afterSalesRetail.clear().sendKeys(afterSalesretailEdit);
        featuresPage.displayTotals.afterSalesDescription.clear().sendKeys(descriptionEdit);
        featuresPage.displayTotals.saveBtn.click();

        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();

        expect(statusPage.historyActionRowOne.getAttribute('innerText')).toEqual(historyAction);
        expect(statusPage.historyActionDetailsSentenceOne.getAttribute('innerText')).toEqual(wholesaleHistoryDetail);
        expect(statusPage.historyActionDetailsSentenceTwo.getAttribute('innerText')).toEqual(retailHistoryDetail);
        expect(statusPage.historyActionDetailsSentenceThree.getAttribute('innerText')).toEqual(Historydescription);

    }));

    it('Generate order history notes for trade in writeback and comments ', common.restoreDatabase('base', () => {
        const orderId = 92;
        const historyAction = 'Costings';
        const tradeInPrice = '250';
        const tradeInPriceEdit = '300';
        const tradeinWritebackUpdateHistory = `Trade-in Writeback changed from $${tradeInPrice}.00 to $${tradeInPriceEdit}`;
        const tradeinWritebackHistory = `Trade-in Writeback set to $${tradeInPrice}`;


        common.login('dealerprincipal');
        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        featuresPage.displayTotalsBtn.click();
        browser.wait(protractor.ExpectedConditions.elementToBeClickable(featuresPage.displayTotals.adjustmentRetail));
        featuresPage.displayTotals.tradeinWriteback.clear().sendKeys(tradeInPrice);
        featuresPage.displayTotals.saveBtn.click();

        featuresPage.displayTotalsBtn.click();
        browser.wait(protractor.ExpectedConditions.elementToBeClickable(featuresPage.displayTotals.adjustmentRetail));
        featuresPage.displayTotals.tradeinWriteback.clear().sendKeys(tradeInPriceEdit);
        featuresPage.displayTotals.saveBtn.click();

        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();

        expect(statusPage.historyActionRowOne.getAttribute('innerText')).toEqual(historyAction);
        expect(statusPage.historyActionDetailsRowOne.getAttribute('innerText')).toEqual(tradeinWritebackUpdateHistory);
        expect(statusPage.historyActionDetailsRowtwo.getAttribute('innerText')).toEqual(tradeinWritebackHistory);

    }));

    it('Generate history note for adding new feature', common.restoreDatabase('base', () => {
        const orderId = 88;
        const historyAction = 'Feature Added';
        const selectedFeature = 'Toilet - Ceramic';
        const historyDetail = `${selectedFeature} | St48`;

        common.login('dealerprincipal');
        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        // fill in the missing plumbing
        featuresPage.plumbing.panel.click();
        featuresPage.plumbing.toiletDropdown.click();
        featuresPage.plumbing.toiletDropdown.element(by.cssContainingText('li', selectedFeature)).click();

        featuresPage.save.click();
        expect(featuresPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');


        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();

        expect(statusPage.historyActionRowOne.getAttribute('innerText')).toEqual(historyAction);
        expect(statusPage.historyActionDetailsRowOne.getAttribute('innerText')).toEqual(historyDetail);
    }));


    it('Generate history note for set subjected to: conditions', common.restoreDatabase('saveorder.010.quote_88_to_order', () => {
        const orderId = 88;
        const subjectedToCondition = 'This is a test condition';
        const historyAction = 'Subject To Changed';
        const conditionUpdateHistory = `Subject To condition set to [${subjectedToCondition}]`;
        common.login('dealerprincipal');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        expect(featuresPage.subjectToBtn.getAttribute('outerHTML')).toContain('btn-default');

        featuresPage.subjectToBtn.click();
        featuresPage.subjectTo.modal.waitForOpen();

        expect(featuresPage.subjectTo.panel.getAttribute('innerHTML')).toContain('input');
        featuresPage.subjectTo.conditionText.sendKeys(subjectedToCondition);
        featuresPage.subjectTo.close.click();
        featuresPage.subjectTo.modal.waitForClose();

        featuresPage.saveOrder.click();
        expect(featuresPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');

        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();

        expect(statusPage.historyActionRowOne.getAttribute('innerText')).toEqual(historyAction);
        expect(statusPage.historyActionDetailsRowOne.getAttribute('innerText')).toEqual(conditionUpdateHistory);

    }));

    it('Generate history note for set after-market notes', common.restoreDatabase('saveorder.010.quote_88_to_order', () => {
        const orderId = 88;
        const marketNote = 'This is a test note';
        const historyAction = 'After Market Note';
        const conditionUpdateHistory = `After Market Note set to [${marketNote}]`;

        common.login('dealerprincipal');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        featuresPage.afterMarketBtn.click();
        featuresPage.afterMarket.modal.waitForOpen();

        expect(featuresPage.afterMarket.panel.getAttribute('innerHTML')).toContain('textarea');
        featuresPage.afterMarket.noteText.sendKeys(marketNote);
        featuresPage.afterMarket.close.click();
        featuresPage.afterMarket.modal.waitForClose();

        featuresPage.saveOrder.click();
        expect(featuresPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');

        featuresPage.afterMarketBtn.click();
        featuresPage.afterMarket.modal.waitForOpen();

        let statusPage = new orders.StatusPage(orderId);
        statusPage.load();

        expect(statusPage.historyActionRowOne.getAttribute('innerText')).toEqual(historyAction);
        expect(statusPage.historyActionDetailsRowOne.getAttribute('innerText')).toEqual(conditionUpdateHistory);
    }));

});
