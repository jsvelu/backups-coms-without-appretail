import * as common from '../../../test-e2e/common';
import * as newage from '../../../nac/newage/protractor/newage.pages';


//---------------------------------------------------------------------------
class ShowroomStartPage extends newage.MenuPage {
    constructor() {
        super();
        this.isAngular = false;
        this.urlPath = '/orders/showroom/';
        this.menuLinkText = 'Showroom';

        this.continue = element(by.linkText('Create Quote'));
    }
}

module.exports.ShowroomStartPage = ShowroomStartPage;


//---------------------------------------------------------------------------
class ShowroomCustomerPage extends newage.MenuPage {
    constructor() {
        super();
        this.isAngular = true;
        this.urlPath = '/newage/orders/';
        this.urlHashRedirect = '/showroom/customer';

        this.customerForm = element(by.css('[name="customer_form"]'));
        this.customerFirstname =            this.customerForm.element(by.model('order.customer.first_name'));
        this.customerLastname =             this.customerForm.element(by.model('order.customer.last_name'));
        this.customerEmail =                this.customerForm.element(by.model('order.customer.email'));
        this.customerMailingList =          this.customerForm.element(by.model('order.customer.mailing_list'));
        this.customerPhone =                this.customerForm.element(by.model('order.customer.phone1'));
        this.customerPartnerName =          this.customerForm.element(by.model('order.customer.partner_name'));
        this.customerTowVehicle =           this.customerForm.element(by.model('order.customer.tow_vehicle'));
        this.customerSourceOfAwareness =    this.customerForm.element(by.model('order.customer.source_of_awareness'));
        this.customerAcquisitionSource =    this.customerForm.element(by.model('order.customer.acquisition_source'));
        this.customerAddressName =          this.customerForm.element(by.model('order.customer.physical_address.name'));
        this.customerAddressStreet =        this.customerForm.element(by.model('order.customer.physical_address.address'));
        this.customerAddressSuburb =        this.customerForm.element(by.css('input[name="suburb"]')); // Model is used by the lookup as well, so `by.model()` would return 2 results.
        this.customerAddressState =         this.customerForm.element(by.model('order.customer.physical_address.suburb.post_code.state.code'));
        this.customerAddressPostCode =      this.customerForm.element(by.model('order.customer.physical_address.suburb.post_code.number'));
        this.customerFormSubmit =           this.customerForm.element(by.css('[type="submit"]'));
    }

    validate() {
        super.validate();

        expect(this.customerSourceOfAwareness.$$('option').getText()).toEqual(['Select an option', 'At a show', ' Australian Caravan Club Advert', 'Caravan and Motorhome Email Advert', 'Caravan World Magazine']);
        expect(this.customerAcquisitionSource.$$('option').getText()).toEqual(['Select an option', 'Word of Mouth', 'Trade Show', 'Friend', 'Google Ad', 'TV Commercial', 'Other']);
        expect(this.customerAddressState.$$('option').getText()).toEqual(['Select State', 'Australia Capital Territory', 'Norther Territory', 'Western Australia', 'New South Wales', 'Victoria', 'Queensland', 'Southern Australia', 'Tasmania']);
    }
}

module.exports.ShowroomCustomerPage = ShowroomCustomerPage;


//---------------------------------------------------------------------------
class ShowroomModelPage extends newage.MenuPage {
    constructor() {
        super();
        this.isAngular = true;
        this.urlPath = '/newage/orders/';
        this.urlHashRedirect = '/showroom/model';

        this.modelImages = element.all(by.repeater('choices.model_series'));
    }
}

module.exports.ShowroomModelPage = ShowroomModelPage;


//---------------------------------------------------------------------------
class ShowroomSeriesPage extends newage.MenuPage {
    constructor() {
        super();
        this.isAngular = true;
        this.urlPath = '/newage/orders/';
        this.urlHashRedirect = '/showroom/series';

        this.seriesStartQuoteButtons = element.all(by.buttonText('Start a quote'));
    }
}

module.exports.ShowroomSeriesPage = ShowroomSeriesPage;
