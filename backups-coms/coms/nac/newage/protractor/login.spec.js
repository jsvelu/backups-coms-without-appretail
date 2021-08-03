import * as common from '../../../test-e2e/common';
import * as newage from './newage.pages';

describe('User Login', () => {

    const users = [
        'admin',
        'nationalsales',
        'dealerprincipal',
        'dealerrep',
    ];

    it('Can reset DB', common.restoreDatabase('base', () => { }));

    for (const user of users) {
        const userDetails = browser.params.userDetails[user];

        it('Can Login as ' + user, () => {
            common.logout();

            const loginPage = new newage.LoginPage();
            loginPage.load();
            loginPage.usernameInput.sendKeys(userDetails.username);
            loginPage.passwordInput.sendKeys(userDetails.password);
            loginPage.submit.submit();

            common.waitForUrlPathQuery('/home/');
        });

        it('Can Login to admin as ' + user, () => {
            const adminPage = new newage.AdminPage();
            const loginElements = new newage.LoginElements();
            adminPage.loadNoValidate();
            if (userDetails.isStaff) {
                common.waitForUrlPathQuery('/admin/');
                expect(loginElements.currentUserDetails.getText()).toEqual(userDetails.displayName);
                expect(loginElements.currentUsername()).toEqual(user);
                expect(loginElements.currentUserCompany.getText()).toEqual(userDetails.company);
            } else {
                common.waitForUrlPath('/admin/login/');
            }
        });
    }

    const impersonateUsers = [
        ['useradmin', true],
        ['nationalsales', false],
    ];

    for (const [username, canViewUserAdmin] of impersonateUsers) {
        it(`Admin can hijack ${username}`, () => {
            const userDetails = browser.params.userDetails;
            const loginElements = new newage.LoginElements();
            const adminPage = new newage.AdminPage();
            const adminUsersPage = new newage.AdminUsersPage();
            const homePage = new newage.HomePage();

            common.login('admin', false);
            expect(loginElements.hijackNotice.isPresent()).toBeFalsy();

            adminPage.loadUsingMenuLink();
            adminPage.usersLink.click();

            adminUsersPage.init();
            adminUsersPage.impersonateLink(username).click();

            // now useradmin
            homePage.init();
            expect(loginElements.hijackNotice.isDisplayed()).toBeTruthy();
            expect(loginElements.currentUserDetails.getText()).toEqual(userDetails[username].displayName);
            expect(loginElements.currentUsername()).toEqual(username);

            // user should still have access to user admin screen?
            adminPage.loadUsingMenuLink();
            if (canViewUserAdmin) {
                adminPage.usersLink.click();
                adminUsersPage.init();

                // but no way to impersonate another user
                expect(adminUsersPage.impersonateLink(username).isPresent()).toBeFalsy();
            } else {
                expect(adminPage.usersLink.isPresent()).toBeFalsy();
            }

            // now revert to admin
            loginElements.stopHijackLink.click();
            homePage.init();
            expect(loginElements.hijackNotice.isPresent()).toBeFalsy();
            expect(loginElements.currentUserDetails.getText()).toEqual(userDetails['admin'].displayName);
            expect(loginElements.currentUsername()).toEqual('admin');

            // confirm we have old admin permissions back
            adminPage.loadUsingMenuLink();
            adminPage.usersLink.click();

            adminUsersPage.init();
        });
    }


});
