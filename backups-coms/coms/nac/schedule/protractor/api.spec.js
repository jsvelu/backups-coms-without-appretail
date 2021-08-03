'use strict';

import * as common from '../../../test-e2e/common';
import * as schedule from './schedule.pages'
import * as orders from '../../orders/protractor/orders.pages';

describe('Test schedule page', () => {

    it('Move Orders to Approved State', common.restoreDatabase('base', () => {
        // Move to required state. Lets have atleast 2 orders in the schedule dashboard
        common.login('admin');
        const orderIdList = [88, 87];
        for (var index in orderIdList)
        {
            let featuresPage = new orders.FeaturesPage(orderIdList[index]);
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
        }

        protractor.promise.controlFlow().execute(() => common.saveDatabase('apispec.010.quote_88_to_order'));

    }));

    it('Has the right month label', common.restoreDatabase('apispec.010.quote_88_to_order', () => {

        common.login('admin');

        let dashboardPage = new schedule.DashboardPage();
        dashboardPage.loadUsingMenuLink();

        dashboardPage.enterMonth.clear().sendKeys('Sep 2016');
        browser.actions().sendKeys(protractor.Key.ENTER).perform();

        expect(dashboardPage.tableRows.get(0).getText()).toContain('September 2016 Available: 16 Taken: 2 Capacity: 18 ');
        expect(dashboardPage.tableRows.get(3).getText()).toContain('October 2016 Available: 16 Taken: 2 Capacity: 18');
    }));

    it('Can change month', common.restoreDatabase('apispec.010.quote_88_to_order', () => {

        common.login('admin');

        let dashboardPage = new schedule.DashboardPage();
        dashboardPage.loadUsingMenuLink();

        dashboardPage.enterMonth.clear().sendKeys('Sep 2016');
        browser.actions().sendKeys(protractor.Key.ENTER).perform();
        browser.sleep(1000)

        expect(dashboardPage.tableRows.all(by.cssContainingText('td', 'September 2016')).count()).toBe(1);
        expect(dashboardPage.tableRows.all(by.cssContainingText('td', 'October 2016')).count()).toBe(1);

        dashboardPage.enterMonth.clear().sendKeys('Dec 2016');
        browser.actions().sendKeys(protractor.Key.ENTER).perform();
        browser.sleep(1000)
        expect(dashboardPage.tableRows.all(by.cssContainingText('td', 'December 2016')).count()).toBe(0);
        expect(dashboardPage.tableRows.all(by.cssContainingText('td', 'January 2017')).count()).toBe(0);
        browser.refresh();
        expect(dashboardPage.tableRows.all(by.cssContainingText('td', 'December 2016')).count()).toBe(0);
        expect(dashboardPage.tableRows.all(by.cssContainingText('td', 'January 2017')).count()).toBe(0);

    }));

    it('Can update comments', common.restoreDatabase('apispec.010.quote_88_to_order', () => {

        common.login('admin');

        let dashboardPage = new schedule.DashboardPage();
        dashboardPage.loadUsingMenuLink();

        dashboardPage.enterMonth.clear().sendKeys('Sep 2016');
        browser.actions().sendKeys(protractor.Key.ENTER).perform();

        dashboardPage.tableRows.get(1).element(by.model('order.schedule_comments')).sendKeys('Commenting order 1');
        dashboardPage.tableRows.get(2).element(by.model('order.schedule_comments')).click();
        expect(dashboardPage.tableRows.get(1).element(by.model('order.schedule_comments')).getAttribute('value')).toEqual('Commenting order 1');

        browser.refresh();
        expect(dashboardPage.tableRows.get(1).element(by.model('order.schedule_comments')).getAttribute('value')).toEqual('Commenting order 1');
    }));

    xit('Can sort orders', common.restoreDatabase('base', () => {
        // TODO: Drag and drop is not working at the moment

        common.login('admin');

        let dashboardPage = new schedule.DashboardPage();
        dashboardPage.loadUsingMenuLink();

        expect(dashboardPage.monthSelector.$$('option').count()).toEqual(36);

        dashboardPage.monthSelector.element(by.cssContainingText('option', 'Sep 2016')).click();

        let monthRow = dashboardPage.tableRows.get(0);
        let firstOrderTds = dashboardPage.tableRows.get(1).$$('td');
        let secondOrderTds = dashboardPage.tableRows.get(2).$$('td');

        expect(firstOrderTds.get(1).getText()).toEqual('1');
        expect(firstOrderTds.get(3).getText()).toEqual('NA0001');
        expect(secondOrderTds.get(1).getText()).toEqual('2');
        expect(secondOrderTds.get(3).getText()).toEqual('Order #88');

        browser.actions()
            .mouseDown(secondOrderTds.get(0))
            .mouseMove(monthRow)
            .mouseUp()
            .perform();

        expect(firstOrderTds.get(1).getText()).toEqual('1');
        expect(firstOrderTds.get(3).getText()).toEqual('Order #88');
        expect(secondOrderTds.get(1).getText()).toEqual('2');
        expect(secondOrderTds.get(3).getText()).toEqual('NA0001');
    }));

    it('Can assign production dates', common.restoreDatabase('apispec.010.quote_88_to_order', () => {

        common.login('admin');

        let dashboardPage = new schedule.DashboardPage();
        dashboardPage.loadUsingMenuLink();

        dashboardPage.enterMonth.clear().sendKeys('Sep 2016');
        browser.actions().sendKeys(protractor.Key.ENTER).perform();

        dashboardPage.assignDates.click();

        expect(dashboardPage.tableRows.get(1).$$('td').get(2).getText()).toEqual('Wed 20-07-2016');
        expect(dashboardPage.tableRows.get(2).$$('td').get(2).getText()).toEqual('Wed 20-07-2016');
        expect(dashboardPage.tableRows.get(4).$$('td').get(2).getText()).toEqual('');
    }));

    it('Can assign new month', common.restoreDatabase('apispec.010.quote_88_to_order', () => {

        common.login('admin');

        let dashboardPage = new schedule.DashboardPage();
        dashboardPage.loadUsingMenuLink();

        dashboardPage.enterMonth.clear().sendKeys('Sep 2016');
        browser.actions().sendKeys(protractor.Key.ENTER).perform();

        let firstOrderTds = dashboardPage.tableRows.get(1).$$('td');
        let secondOrderTds = dashboardPage.tableRows.get(2).$$('td');
        // getText in protractor loops is broken; Using innerHtml
        // https://github.com/angular/protractor/issues/1794

        expect(firstOrderTds.get(1).getAttribute('innerHTML')).toContain('1');
        expect(firstOrderTds.get(3).getText()).toEqual('NA0001');

        expect(secondOrderTds.get(1).getAttribute('innerHTML')).toContain('2');
        expect(secondOrderTds.get(4).getText()).toEqual('#88');

        firstOrderTds.get(12).click();

        dashboardPage.moveOrdersBtn.click();
        dashboardPage.moveOrders.modal.waitForOpen();
        dashboardPage.moveOrders.orderPosition.sendKeys('1');
        dashboardPage.moveOrders.monthSelector.click();
        dashboardPage.moveOrders.monthSelector.element(by.cssContainingText('option','Nov 2016')).click();
        dashboardPage.moveOrders.moveBtn.click();
        dashboardPage.moveOrders.modal.waitForClose();

        dashboardPage.enterMonth.clear().sendKeys('Nov 2016');
        browser.actions().sendKeys(protractor.Key.ENTER).perform();
        browser.sleep(1000)

        expect(firstOrderTds.get(1).getAttribute('innerHTML')).toContain('1');
        expect(firstOrderTds.get(4).getText()).toEqual('#87');

        expect(firstOrderTds.get(1).getAttribute('innerHTML')).toContain('1');
        expect(firstOrderTds.get(3).getText()).toEqual('NA0001');

    }));

    it('Ineligible orders can not finalised using Lock Order button', common.restoreDatabase('apispec.010.quote_88_to_order', () => {

        common.login('admin');

        let dashboardPage = new schedule.DashboardPage();
        dashboardPage.loadUsingMenuLink();

        dashboardPage.enterMonth.clear().sendKeys('Sep 2016');
        browser.actions().sendKeys(protractor.Key.ENTER).perform();

        let ineligibleOrd = dashboardPage.tableRows.get(2).$$('td');
        ineligibleOrd.get(12).click();
        dashboardPage.lockOrdersBtn.click();

        expect(ineligibleOrd.get(4).getText()).toEqual('#88');

    }));
});
