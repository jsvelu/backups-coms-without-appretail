import * as common from '../../../test-e2e/common';
import * as newage from '../../../nac/newage/protractor/newage.pages';


//---------------------------------------------------------------------------

class SchedulePage extends newage.MenuPage {
    constructor() {
        super();
        this.isAngular = true;
        this.urlPath = '/newage/schedule/';

        this.save = element(by.buttonText('Save Quote'));

        this.linkDashboard = element(by.linkText('Dashboard'));
        this.linkCapacity = element(by.linkText('Production Capacity'));
        this.linkPlanner = element(by.linkText('Schedule Planner'));
    }
}

//---------------------------------------------------------------------------
class DashboardPage extends SchedulePage {
    constructor() {
        super();
        this.urlHashRedirect = '/dashboard';
        this.menuLinkText = 'Dashboard';

        this.enterMonth = element(by.id('chosen_month_show'));
        this.monthSelector = element(by.model('currentMonth'));
        this.filter = element(by.model('searchStr'));
        this.assignDates = element(by.buttonText('Assign production dates'));
        this.table = element(by.css('.content > table'));
        this.tableRows = this.table.all(by.repeater('order in orderList'));

        this.moveOrdersBtn = element(by.buttonText("Move Orders"));
        this.moveOrders = {};
        this.moveOrders.modal = this.modal('#moveOrderModal');
        this.moveOrders.panel = element(by.css('div#moveOrderModal'));
        this.moveOrders.moveBtn = this.moveOrders.panel.element(by.buttonText('Move'));
        this.moveOrders.close = this.moveOrders.panel.element(by.buttonText('Close'));

        this.moveOrders.monthSelector = this.moveOrders.panel.element(by.model('move_month'));
        this.moveOrders.orderPosition = this.moveOrders.panel.element(by.css('input'));

        this.lockOrdersBtn = element(by.buttonText("Lock Orders"));
    }
}

module.exports.DashboardPage = DashboardPage;

