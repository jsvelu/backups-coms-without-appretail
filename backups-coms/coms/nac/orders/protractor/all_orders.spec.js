import * as common from '../../../test-e2e/common';
import * as orders from './orders.pages';

describe('Test all orders page', () => {

    it('displays the right columns', common.restoreDatabase('base', () => {
        common.login('admin');

        const orderListPage = new orders.OrderListPage();
        orderListPage.loadUsingMenuLink();

        expect(orderListPage.tableHeaders.count()).toEqual(11);

        const headers = [
            'Stage / Chassis',
            'First Name',
            'Last Name',
            'Dealership',
            'Customer Manager',
            'Series',
            'Created On',
            'Delivery',
            'Schedule',
            '',
            'Model',
        ];

        headers.forEach((title, i) => {
            expect(orderListPage.tableHeaders.get(i).getAttribute('class')).toContain('orderable', `Column header ${i} has class orderable`);
            expect(orderListPage.tableHeaders.get(i).element(by.linkText(title)).isPresent()).toBeTruthy(`Column header ${i} has link text "${title}"`);
        });
    }));
});
