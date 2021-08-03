import * as common from '../../../test-e2e/common';

//---------------------------------------------------------------------------
class LoginElements {
    constructor() {
        // currently logged in user details
        this.currentUserDetails = $('#currentUserDisplayName');
        this.currentUsername = () => this.currentUserDetails.getAttribute('data-username');
        this.currentUserCompany = $('#currentUserCompany');

        // hijack user details
        this.stopHijackLink = element(by.linkText('Stop Impersonating'));
        this.hijackNotice = element(by.id('hijacked-warning'));
    }
}

module.exports.LoginElements = LoginElements;


//---------------------------------------------------------------------------
class LoginPage extends common.Page {
    constructor() {
        super();
        this.isAngular = false;
        this.urlPath = '/newage/login/';
        // if already logged in, will be redirected to homepage
        // this.urlPathRedirect = new Regex('^(/newage/login/|/home/)$');

        this.usernameInput = $('#id_username');
        this.passwordInput = $('#id_password');
        this.submit = $('.form-signin input[type="submit"]');
    }
}

module.exports.LoginPage = LoginPage;


//---------------------------------------------------------------------------
class LogoutPage extends common.Page {
    constructor() {
        super();
        this.isAngular = false;
        this.urlPath = '/newage/logout/';

        // redirect page will depend on whether you were already logged in or not
        this.urlPathRedirect = new RegExp('^/newage/(login/\\?next=.*|logout/)');
        LogoutPage.title = null;
    }

    validate() {
        super.validate();

        var loginElementFound = protractor.promise.all([
            element(by.linkText('Log in again')).isPresent(),   // if just logged out
            element(by.id('login-form')).isPresent(),           // if not logged in to begin with
        ]).then((isPresent) => isPresent.some(Boolean));
        expect(loginElementFound).toBe(true);
    }
}

module.exports.LogoutPage = LogoutPage;


//---------------------------------------------------------------------------
class MenuPage extends common.Page {
    constructor() {
        super();
        this.showMenuBar = $('#slidingNavButton');
        this.menuBar = $('#slidingNavContainer.open');

        // This will only be present in dev (not for CI)
        this.sideBarHideLink = $('#djHideToolBarButton');
    }

    load() {
        super.load();
        this.hideSideBar();
    }

    loadUsingMenuLink() {
        this.navigateToMenuLink();
        this.init();
    }

    navigateToMenuLink() {
        this.openMenuBar();
        this.getMenuLink(this.menuLinkText).click();
        this.load();  // Triggers protractor internal page load
    }

    openMenuBar() {
        this.showMenuBar.click();

        browser.wait( () => {
            return this.menuBar.isPresent();
        }, 30000);

        // Wait for the open animation to finish. Animation takes 200ms, allowing an extra 100ms.
        browser.sleep(300);
    }

    hideSideBar() {
        $('body').getAttribute('class').then(cls => {
            const isDev = cls.search(/\benv-dev\b/) != -1;
            if (isDev) {
                this.sideBarHideLink.isDisplayed().then((displayed) => {
                    if (displayed) this.sideBarHideLink.click();
                });
            }
        });
    }

    getMenuLink(linkText) {
        return element(by.linkText(linkText));
    }
}

module.exports.MenuPage = MenuPage;


//---------------------------------------------------------------------------
class HomePage extends MenuPage {
    constructor() {
        super();
        this.isAngular = false;
        this.urlPath = '/home/';

        this.h1Title = 'Home';

        this.todoItems = element(by.css("#todo-items"));
        this.todoItems.getRowsForOrder = (orderId) => {
            return this.todoItems.all(by.cssContainingText('tr', `#${orderId}`));
        };
        this.todoItems.getCellsForOrder = (orderId, cls, text='') => {
            return this.todoItems
                .getRowsForOrder(orderId)
                .all(by.cssContainingText(`td.${cls}`, text));
        };
    }
}

module.exports.HomePage = HomePage;


//---------------------------------------------------------------------------
class AdminPage extends MenuPage {
    constructor() {
        super();
        this.isAngular = false;
        this.urlPath = '/admin/';
        this.menuLinkText = 'Admin';

        this.usersLink = element(by.linkText('Users'));
    }
}

module.exports.AdminPage = AdminPage;


//---------------------------------------------------------------------------
class AdminUsersPage extends MenuPage {
    constructor() {
        super();
        this.isAngular = false;
        this.urlPath = '/admin/authtools/user/';
    }

    impersonateLink(username) {
        return element(by.linkText(username))
            .element(by.xpath('ancestor::tr'))
            .element(by.linkText('Impersonate'));
    }
}

module.exports.AdminUsersPage = AdminUsersPage;


//---------------------------------------------------------------------------
class AdminSeriesPage extends MenuPage {
    constructor() {
        super();
        this.isAngular = false;
        this.urlPath = '/admin/caravans/series/';

        this.seriesTable = {};
        this.seriesTable.table = element(by.id('result_list'));
        this.seriesTable.selectSeries = this.seriesTable.table.element(by.linkText('MR19E'));

        this.costPrice = element(by.id('id_cost_price'));
        this.wholesalePrice = element(by.id('id_wholesale_price'));
        this.retailPrice = element(by.id('id_retail_price'));

        this.saveBtn = element(by.buttonText('Save'));
    }

}

module.exports.AdminSeriesPage = AdminSeriesPage;

