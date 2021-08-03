import * as common from '../../../test-e2e/common';
import * as caravans from './caravans.pages';
import * as orders from '../../../nac/orders/protractor/orders.pages';
import * as newage from '../../../nac/newage/protractor/newage.pages';

describe('Test model management', () => {

    it('Doesn\'t show archived item anywhere except on finalised order', common.restoreDatabase('base', () => {

        // Checking model management screen
        common.login('admin');

        let modelManagementPage = new caravans.ModelManagementPage();
        modelManagementPage.loadUsingMenuLink();

        modelManagementPage.commandoTab.click();
        modelManagementPage.chassisLink.click();
        expect(modelManagementPage.departmentWithArchivedItemLink.isPresent()).toBeTruthy();
        expect(modelManagementPage.archivedDepartmentLink.isPresent()).toBeFalsy();

        modelManagementPage.departmentWithArchivedItemLink.click();
        expect(modelManagementPage.archivedItem.isPresent()).toBeFalsy();

        // ------------------------------------------------------------------------------------
        // Checking existing non-finalised order
        let orderId = 31;

        common.login('dealerprincipal');

        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();
        featuresPage.hideSideBar();

        featuresPage.chassis.panel.click();
        expect(featuresPage.chassis.firstItem.isDisplayed()).toBeTruthy();

        expect(featuresPage.chassis.archivedItem.isPresent()).toBeFalsy();


        // ------------------------------------------------------------------------------------
        // Checking finalised order including the item
        orderId = 92;

        featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();
        featuresPage.hideSideBar();

        featuresPage.chassis.panel.click();
        expect(featuresPage.chassis.firstItem.isDisplayed()).toBeTruthy();

        expect(featuresPage.chassis.archivedItem.isPresent()).toBeTruthy();
    }));

});
