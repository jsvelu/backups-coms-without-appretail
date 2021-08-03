import * as common from '../../../test-e2e/common';
import * as newage from '../../../nac/newage/protractor/newage.pages';


//---------------------------------------------------------------------------

class ModelManagementPage extends newage.MenuPage {
    constructor() {
        super();
        this.isAngular = true;
        this.urlPath = '/newage/models/';
        this.menuLinkText = 'Manage Specifications';

        this.commandoTab = element(by.cssContainingText('ul.nav.nav-tabs > li > a', 'Commando'));

        this.chassisLink = element(by.cssContainingText('a.accordion-toggle > span > div', 'CHASSIS'));
        this.departmentWithArchivedItemLink = element(by.cssContainingText('a.accordion-toggle > span > div', 'Lino Colour'));
        this.archivedDepartmentLink = element(by.cssContainingText('a.accordion-toggle > span > div', 'New archived department'));

        this.archivedItem = element(by.cssContainingText('div.panel-open a', 'Lino - Tweed Silver Dark (STD)'));
    }
}

module.exports.ModelManagementPage = ModelManagementPage;

