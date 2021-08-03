import * as common from '../../../test-e2e/common';
import * as orders from './orders.pages';
import * as showroom from './showroom.pages';

describe('Test new orders page', () => {
    const modelList = ['Select Model', 'Commando', 'Manta Ray', 'Oz Classic', 'Wallaby'];
    const seriesList = ['Select Series', '18FT MANTA RAY (MR18ES2)', '18FT MANTA RAY REAR DOOR (MR18ER)', '19FT MANTA RAY ENSUITE (MR19E)'];
    const seriesUnselected = [ 'Select Series' ];

    const selectedModel = 'Manta Ray';
    const selectedModelValue = 'number:2';
    const selectedSeries = '19FT MANTA RAY ENSUITE (MR19E)';
    const selectedSeriesValue = 'number:15';
    const selectedStockValue = 'number:1';

    const selectedModel2 = 'Commando';
    const selectedSeries2 = "18' Ensuite (CM18E)";

    const createAndSelectInitalOrderItems = (orderCreated = false) => {
         // Order creation
        if (!orderCreated) {
            let createOrderPage = new orders.NewOrderPage();
            createOrderPage.loadUsingMenuLink();

            expect(createOrderPage.dealershipForStock.$$('option').count()).toEqual(2);

            expect(createOrderPage.dealershipForStock.getAttribute('value')).toEqual(selectedStockValue);
            createOrderPage.stockFormSubmit.click();
        }
        // Choosing model and series
        let modelSeriesPage = new orders.ModelSeriesPage();
        modelSeriesPage.init();

        expect(modelSeriesPage.model.$$('option').getText()).toEqual(modelList);
        expect(modelSeriesPage.series.$$('option').getText()).toEqual(seriesUnselected);
        modelSeriesPage.model.element(by.cssContainingText('option', selectedModel)).click();

        expect(modelSeriesPage.model.getAttribute('value')).toEqual(selectedModelValue);
        expect(modelSeriesPage.series.$$('option').getText()).toEqual(seriesList);
        modelSeriesPage.series.element(by.cssContainingText('option', selectedSeries)).click();

        expect(modelSeriesPage.series.getAttribute('value')).toEqual(selectedSeriesValue);
        modelSeriesPage.formSubmit.click();

        // Weight and size
        let weightSizePage = new orders.WeightAndSizePage();
        weightSizePage.init();
        weightSizePage.formSubmit.click();

        // Features
        new orders.FeaturesPage().init();

    };

    it('Can create new dealership order as dealerrep', common.restoreDatabase('base', () => {
        common.login('dealerrep');
        createAndSelectInitalOrderItems();
    }));

    it('Can create new dealership order as dealerprincipal', common.restoreDatabase('base', () => {
        common.login('dealerprincipal');
       createAndSelectInitalOrderItems();
    }));

    it('Can create new customer order as dealerrep', common.restoreDatabase('base', () => {

        common.login('dealerrep');

        // Order creation
        let createOrderPage = new orders.NewOrderPage();
        createOrderPage.loadUsingMenuLink();

        expect(createOrderPage.dealershipForCustomer.$$('option').count()).toEqual(2);
        expect(createOrderPage.dealershipForCustomer.getAttribute('value')).toEqual('number:1');

        createOrderPage.customerFirstname.sendKeys('Test user firstname 01');
        createOrderPage.customerLastname.sendKeys('Test user lastname 01');
        createOrderPage.customerEmail.sendKeys('testuser01@example.com');
        createOrderPage.customerMailingList.click();
        createOrderPage.customerPhone.sendKeys('0198765432');
        createOrderPage.customerPartnerName.sendKeys('Test user partner 01');
        createOrderPage.customerTowVehicle.sendKeys('Test user car 01');
        createOrderPage.customerSourceOfAwareness.element(by.cssContainingText('option', 'Caravan World Magazine')).click();
        createOrderPage.customerAcquisitionSource.element(by.cssContainingText('option', 'TV Commercial')).click();
        createOrderPage.customerAddressName.sendKeys('Test user name 01');
        createOrderPage.customerAddressStreet.sendKeys('01 Testuser St');
        createOrderPage.customerAddressSuburb.sendKeys('NUNAWADING');
        createOrderPage.customerAddressState.element(by.cssContainingText('option', 'Victoria')).click();
        createOrderPage.customerAddressPostCode.sendKeys('3131');

        createOrderPage.customerFormSubmit.click();

        createAndSelectInitalOrderItems(true);
    }));

    it('Can create new customer order as dealerprincipal', common.restoreDatabase('base', () => {

        common.login('dealerprincipal');

        // Order creation
        let createOrderPage = new orders.NewOrderPage();
        createOrderPage.loadUsingMenuLink();

        expect(createOrderPage.dealershipForCustomer.$$('option').count()).toEqual(2);
        expect(createOrderPage.dealershipForCustomer.getAttribute('value')).toEqual('number:1');

        createOrderPage.customerFirstname.sendKeys('Test user firstname 02');
        createOrderPage.customerLastname.sendKeys('Test user lastname 02');
        createOrderPage.customerEmail.sendKeys('testuser02@example.com');
        createOrderPage.customerMailingList.click();
        createOrderPage.customerPhone.sendKeys('0298765432');
        createOrderPage.customerPartnerName.sendKeys('Test user partner 02');
        createOrderPage.customerTowVehicle.sendKeys('Test user car 02');
        createOrderPage.customerSourceOfAwareness.element(by.cssContainingText('option', 'Caravan World Magazine')).click();
        createOrderPage.customerAcquisitionSource.element(by.cssContainingText('option', 'TV Commercial')).click();
        createOrderPage.customerAddressName.sendKeys('Test user name 02');
        createOrderPage.customerAddressStreet.sendKeys('02 Testuser St');
        createOrderPage.customerAddressSuburb.sendKeys('NUNAWADING');
        createOrderPage.customerAddressState.element(by.cssContainingText('option', 'Victoria')).click();
        createOrderPage.customerAddressPostCode.sendKeys('3131');

        createOrderPage.customerFormSubmit.click();

        createAndSelectInitalOrderItems(true);

    }));

    it('Can create new showroom order as dealerrep', common.restoreDatabase('base', () => {

        common.login('dealerrep');

        // Showroom start
        let showroomStartPage = new showroom.ShowroomStartPage();
        showroomStartPage.loadUsingMenuLink();
        showroomStartPage.continue.click();


        // Entering customer details
        let showroomCustomerPage = new showroom.ShowroomCustomerPage();
        showroomCustomerPage.init();

        showroomCustomerPage.customerFirstname.sendKeys('Test user firstname 03');
        showroomCustomerPage.customerLastname.sendKeys('Test user lastname 03');
        showroomCustomerPage.customerEmail.sendKeys('testuser03@example.com');
        showroomCustomerPage.customerMailingList.click();
        showroomCustomerPage.customerPhone.sendKeys('0398765432');
        showroomCustomerPage.customerPartnerName.sendKeys('Test user partner 03');
        showroomCustomerPage.customerTowVehicle.sendKeys('Test user car 03');
        showroomCustomerPage.customerSourceOfAwareness.element(by.cssContainingText('option', 'Caravan World Magazine')).click();
        showroomCustomerPage.customerAcquisitionSource.element(by.cssContainingText('option', 'TV Commercial')).click();
        showroomCustomerPage.customerAddressName.sendKeys('Test user name 03');
        showroomCustomerPage.customerAddressStreet.sendKeys('03 Testuser St');
        showroomCustomerPage.customerAddressSuburb.sendKeys('NUNAWADING');
        showroomCustomerPage.customerAddressState.element(by.cssContainingText('option', 'Victoria')).click();
        showroomCustomerPage.customerAddressPostCode.sendKeys('3131');

        showroomCustomerPage.customerFormSubmit.click();


        // Selecting model
        let showroomModelPage = new showroom.ShowroomModelPage();
        showroomModelPage.init();

        expect(showroomModelPage.modelImages.count()).toEqual(4);
        showroomModelPage.modelImages.get(1).click();


        // Selecting series
        let showroomSeriesPage = new showroom.ShowroomSeriesPage();
        showroomSeriesPage.init();

        expect(showroomSeriesPage.seriesStartQuoteButtons.count()).toEqual(3);
        browser.sleep(100); // Temporisation to avoid race condition
        showroomSeriesPage.seriesStartQuoteButtons.get(2).click();


        // Features
        let featuresPage = new orders.FeaturesPage();
        featuresPage.init();
    }));

    it('Can create new showroom order as dealerprincipal', common.restoreDatabase('base', () => {

        common.login('dealerprincipal');

        // Showroom start
        let showroomStartPage = new showroom.ShowroomStartPage();
        showroomStartPage.loadUsingMenuLink();
        showroomStartPage.continue.click();


        // Entering customer details
        let showroomCustomerPage = new showroom.ShowroomCustomerPage();
        showroomCustomerPage.init();

        showroomCustomerPage.customerFirstname.sendKeys('Test user firstname 04');
        showroomCustomerPage.customerLastname.sendKeys('Test user lastname 04');
        showroomCustomerPage.customerEmail.sendKeys('testuser04@example.com');
        showroomCustomerPage.customerMailingList.click();
        showroomCustomerPage.customerPhone.sendKeys('0498765432');
        showroomCustomerPage.customerPartnerName.sendKeys('Test user partner 04');
        showroomCustomerPage.customerTowVehicle.sendKeys('Test user car 04');
        showroomCustomerPage.customerSourceOfAwareness.element(by.cssContainingText('option', 'Caravan World Magazine')).click();
        showroomCustomerPage.customerAcquisitionSource.element(by.cssContainingText('option', 'TV Commercial')).click();
        showroomCustomerPage.customerAddressName.sendKeys('Test user name 04');
        showroomCustomerPage.customerAddressStreet.sendKeys('04 Testuser St');
        showroomCustomerPage.customerAddressSuburb.sendKeys('NUNAWADING');
        showroomCustomerPage.customerAddressState.element(by.cssContainingText('option', 'Victoria')).click();
        showroomCustomerPage.customerAddressPostCode.sendKeys('3131');

        showroomCustomerPage.customerFormSubmit.click();


        // Selecting model
        let showroomModelPage = new showroom.ShowroomModelPage();
        showroomModelPage.init();

        expect(showroomModelPage.modelImages.count()).toEqual(4);
        showroomModelPage.modelImages.get(1).click();


        // Selecting series
        let showroomSeriesPage = new showroom.ShowroomSeriesPage();
        showroomSeriesPage.init();

        expect(showroomSeriesPage.seriesStartQuoteButtons.count()).toEqual(3);
        browser.sleep(100); // Temporisation to avoid race condition
        showroomSeriesPage.seriesStartQuoteButtons.get(2).click();


        // Features
        let featuresPage = new orders.FeaturesPage();
        featuresPage.init();
    }));

    it('Can create new customer order use existing customer', common.restoreDatabase('base', () => {

        common.login('dealerrep');

        // Order creation
        let createOrderPage = new orders.NewOrderPage();
        createOrderPage.loadUsingMenuLink();

        expect(createOrderPage.dealershipForCustomer.$$('option').count()).toEqual(2);
        expect(createOrderPage.dealershipForCustomer.getAttribute('value')).toEqual('number:1');

        createOrderPage.customerLookupInput.sendKeys('test');
        createOrderPage.customerLookupLists.get(0).click();

        // Check that the data entered for the selected customer is correct
        expect(createOrderPage.customerFirstname.getAttribute('value')).toEqual('Checktest');
        // Check that the customer information is not editable
        expect(createOrderPage.customerFirstname.isEnabled()).toBeFalsy();

        createOrderPage.customerFormSubmit.click();

        createAndSelectInitalOrderItems(true);
    }));

    it('Can assign order to closed month as admin', common.restoreDatabase('base', () => {
        common.login('admin');

        let createOrderPage = new orders.NewOrderPage();
        createOrderPage.loadUsingMenuLink();

        expect(createOrderPage.desiredDeliveryMonth.getAttribute('innerHTML')).toContain('Sep 2016 *');
        expect(createOrderPage.desiredDeliveryMonth.getAttribute('innerHTML')).toContain('Oct 2016');

        common.login('dealerrep');

        createOrderPage = new orders.NewOrderPage();
        createOrderPage.loadUsingMenuLink();

        expect(createOrderPage.desiredDeliveryMonth.getAttribute('innerHTML')).not.toContain('Sep 2016 *');
        expect(createOrderPage.desiredDeliveryMonth.getAttribute('innerHTML')).toContain('Oct 2016');

    }));

    it('Can create new dealership order with show special selectable with target dealership', common.restoreDatabase('base', () => {

        common.login('admin');

        // Order creation
        let createOrderPage = new orders.NewOrderPage();
        createOrderPage.loadUsingMenuLink();

        createOrderPage.dealershipForStock.click();
        createOrderPage.dealershipForStock.element(by.cssContainingText('option','Test / Training Dealer 1')).click();
        createOrderPage.stockFormSubmit.click();


        // Choosing model and series
        let modelSeriesPage = new orders.ModelSeriesPage();
        modelSeriesPage.init();

        modelSeriesPage.model.element(by.cssContainingText('option', selectedModel2)).click();
        modelSeriesPage.series.element(by.cssContainingText('option', selectedSeries2)).click();
        modelSeriesPage.formSubmit.click();

        // Weight and size
        let weightSizePage = new orders.WeightAndSizePage();
        weightSizePage.init();
        weightSizePage.formSubmit.click();

        // Features
        let featuresPage = new orders.FeaturesPage();
        featuresPage.init();

        expect(featuresPage.showSpecialBtn.isPresent()).toBeTruthy();
    }));


    it('Can not create new dealership order with show special selectable with non-target dealership', common.restoreDatabase('base', () => {

        common.login('dealer2rep');

        // Order creation
        let createOrderPage = new orders.NewOrderPage();
        createOrderPage.loadUsingMenuLink();

        createOrderPage.dealershipForStock.click();
        createOrderPage.dealershipForStock.element(by.cssContainingText('option','Test / Training Dealer 2')).click();
        createOrderPage.stockFormSubmit.click();


        // Choosing model and series
        let modelSeriesPage = new orders.ModelSeriesPage();
        modelSeriesPage.init();

        modelSeriesPage.model.element(by.cssContainingText('option', selectedModel2)).click();
        modelSeriesPage.series.element(by.cssContainingText('option', selectedSeries2)).click();
        modelSeriesPage.formSubmit.click();

        // Weight and size
        let weightSizePage = new orders.WeightAndSizePage();
        weightSizePage.init();
        weightSizePage.formSubmit.click();

        // Features
        let featuresPage = new orders.FeaturesPage();
        featuresPage.init();

        expect(featuresPage.showSpecialBtn.isPresent()).toBeFalsy();
    }));


    it('Can create new dealership order for non-target dealership with show special selectable as admin',common.restoreDatabase('base', () => {
        // Admin can apply any show special, even for another dealership

        common.login('admin');

        // Order creation
        let createOrderPage = new orders.NewOrderPage();
        createOrderPage.loadUsingMenuLink();

        createOrderPage.dealershipForStock.click();
        createOrderPage.dealershipForStock.element(by.cssContainingText('option','Test / Training Dealer 2')).click();
        createOrderPage.stockFormSubmit.click();


        // Choosing model and series
        let modelSeriesPage = new orders.ModelSeriesPage();
        modelSeriesPage.init();

        modelSeriesPage.model.element(by.cssContainingText('option', selectedModel2)).click();
        modelSeriesPage.series.element(by.cssContainingText('option', selectedSeries2)).click();
        modelSeriesPage.formSubmit.click();

        // Weight and size
        let weightSizePage = new orders.WeightAndSizePage();
        weightSizePage.init();
        weightSizePage.formSubmit.click();

        // Features
        let featuresPage = new orders.FeaturesPage();
        featuresPage.init();

        expect(featuresPage.showSpecialBtn.isPresent()).toBeTruthy();
    }));



    it('Can create new dealership order with show special selectable with target model', common.restoreDatabase('base', () => {

        common.login('admin');

        // Order creation
        let createOrderPage = new orders.NewOrderPage();
        createOrderPage.loadUsingMenuLink();

        createOrderPage.dealershipForStock.click();
        createOrderPage.dealershipForStock.element(by.cssContainingText('option','Test / Training Dealer 1')).click();
        createOrderPage.stockFormSubmit.click();


        // Choosing model and series
        let modelSeriesPage = new orders.ModelSeriesPage();
        modelSeriesPage.init();

        modelSeriesPage.model.element(by.cssContainingText('option', selectedModel2)).click();
        modelSeriesPage.series.element(by.cssContainingText('option', selectedSeries2)).click();
        modelSeriesPage.formSubmit.click();

        // Weight and size
        let weightSizePage = new orders.WeightAndSizePage();
        weightSizePage.init();
        weightSizePage.formSubmit.click();

        // Features
        let featuresPage = new orders.FeaturesPage();
        featuresPage.init();

        expect(featuresPage.showSpecialBtn.isPresent()).toBeTruthy();
    }));


    it('Can not create new dealership order with show special selectable with non-target model', common.restoreDatabase('base', () => {

        common.login('admin');

        // Order creation
        let createOrderPage = new orders.NewOrderPage();
        createOrderPage.loadUsingMenuLink();

        createOrderPage.dealershipForStock.click();
        createOrderPage.dealershipForStock.element(by.cssContainingText('option','Test / Training Dealer 1')).click();
        createOrderPage.stockFormSubmit.click();

        createAndSelectInitalOrderItems(true);
        // Features
        let featuresPage = new orders.FeaturesPage();
        featuresPage.init();

        expect(featuresPage.showSpecialBtn.isPresent()).toBeFalsy();
    }));


    xit('Can clone existing order on creating orders [FIXME]', common.restoreDatabase('base', () => {

        common.login('dealerprincipal');

        // Order creation
        let createOrderPage = new orders.NewOrderPage();
        createOrderPage.loadUsingMenuLink();

        expect(createOrderPage.dealershipForStock.$$('option').count()).toEqual(2);

        expect(createOrderPage.dealershipForStock.getAttribute('value')).toEqual('number:1');
        createOrderPage.stockFormSubmit.click();

        // attempts to clone an existing order
        let modelSeriesPage = new orders.ModelSeriesPage();
        modelSeriesPage.init();

        modelSeriesPage.customerLookupInput.sendKeys('NA0002');
        expect(modelSeriesPage.customerLookupLists.count()).toBe(1);
        modelSeriesPage.customerLookupLists.get(0).click();

        // Check that the data entered for the selected customer is correct
        expect(modelSeriesPage.customerLookupInput.getAttribute('value')).toContain('Order 90');

// http://localhost:8000/newage/orders/#/95/caravan/model-and-series
// Fails here when you click on "Continue with items from selected order" because it changes the type from stock
// to customer but there is no customer assigned
// Possible due to commit 36cf03d14
browser.pause();
        modelSeriesPage.cloneSubmit.click();

        let weightSizePage = new orders.WeightAndSizePage();

        expect(weightSizePage.formSubmit.isPresent()).toBeTruthy();

        // navigates to the features page and check for matching features.
        weightSizePage.formSubmit.click();
        let featuresPage = new orders.FeaturesPage();
        featuresPage.init();

        expect(featuresPage.modelDescription.getAttribute('innerHTML')).toContain('(MR18ES2)');
        expect(featuresPage.totalCost.getText()).toEqual('$61,990.00');
        expect(featuresPage.chassis.panel.getAttribute('innerHTML')).toContain('Lino - Timber Naturel ');

    }));

     it('Create an order with a show assigned', common.restoreDatabase('base', () => {
        const orderId = 88;
        common.login('admin');

        //complete seletions
        const featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();
        featuresPage.plumbing.panel.click();
        featuresPage.plumbing.toiletDropdown.click();
        featuresPage.plumbing.toiletDropdown.element(by.cssContainingText('li', 'Toilet - Ceramic')).click();

        expect(featuresPage.plumbing.toiletUnselected.isPresent()).toBeFalsy();
        featuresPage.save.click();
        browser.wait(protractor.ExpectedConditions.elementToBeClickable(featuresPage.alertDetailsSaved));

        //assign a show
        const StatusPage = new orders.StatusPage(orderId);
        StatusPage.load();
        StatusPage.linkCustomerDetails.click();
        StatusPage.show.element(by.cssContainingText('option', 'New Show')).click();
        StatusPage.save.click();
        browser.wait(protractor.ExpectedConditions.elementToBeClickable(StatusPage.alertDetailsSaved));

        //remove special features and finalise
        const SpecialFeaturesPage = new orders.SpecialFeaturesPage(orderId);
        SpecialFeaturesPage.load()
        SpecialFeaturesPage.remove.click();
        SpecialFeaturesPage.save.click();
        browser.wait(protractor.ExpectedConditions.elementToBeClickable(featuresPage.alertDetailsSaved));
        expect(featuresPage.alertDetailsSaved.isPresent()).toBeTruthy('Order Saved feedback message present');
        featuresPage.requestToPlaceOrder.click();
        featuresPage.placeOrder.click();
        featuresPage.placeOrderPopup.modal.waitForOpen();
        featuresPage.placeOrderPopup.placeOrderButton.click();
        featuresPage.placeOrderPopup.modal.waitForClose();
        SpecialFeaturesPage.finalizeOrder.click();
        protractor.promise.controlFlow().execute(() => common.saveDatabase('saveorder.020.order_88_with_show'));


    }));

    it('Can create new quote from existing order without copying show details ', common.restoreDatabase('saveorder.020.order_88_with_show', () => {
        common.login('dealerprincipal');

        // Order creation
        let createOrderPage = new orders.NewOrderPage();
        createOrderPage.loadUsingMenuLink();

        createOrderPage.customerFirstname.sendKeys('Test user firstname 02');
        createOrderPage.customerLastname.sendKeys('Test user lastname 02');
        createOrderPage.customerEmail.sendKeys('testuser02@example.com');
        createOrderPage.customerMailingList.click();
        createOrderPage.customerPhone.sendKeys('0198765432');
        createOrderPage.customerPartnerName.sendKeys('Test user partner 02');
        createOrderPage.desiredDeliveryMonth.element(by.cssContainingText('option', 'Nov 2016')).click();
        createOrderPage.customerTowVehicle.sendKeys('Test user car 02');
        createOrderPage.customerSourceOfAwareness.element(by.cssContainingText('option', 'Caravan World Magazine')).click();
        createOrderPage.customerAcquisitionSource.element(by.cssContainingText('option', 'TV Commercial')).click();
        createOrderPage.customerAddressName.sendKeys('Test user name 01');
        createOrderPage.customerAddressStreet.sendKeys('02 Testuser St');
        createOrderPage.customerAddressSuburb.sendKeys('NUNAWADING');
        createOrderPage.customerAddressState.element(by.cssContainingText('option', 'Victoria')).click();
        createOrderPage.customerAddressPostCode.sendKeys('3131');

        createOrderPage.customerFormSubmit.click();

        // clone an existing order with show
        let modelSeriesPage = new orders.ModelSeriesPage();
        modelSeriesPage.init();

        modelSeriesPage.customerLookupInput.sendKeys('NA0005');
        expect(modelSeriesPage.customerLookupLists.count()).toBe(1);
        modelSeriesPage.customerLookupLists.get(0).click();
        modelSeriesPage.cloneSubmit.click();

        let weightSizePage = new orders.WeightAndSizePage();
        weightSizePage.formSubmit.click();

        let featuresPage = new orders.FeaturesPage();
        featuresPage.save.click();
        featuresPage.linkCustomerDetails.click();
        expect(featuresPage.show.getAttribute('value')).toEqual('');
    }));

    it('Can clone existing customer order on creating dealership orders without copying customer details', common.restoreDatabase('base', () => {
        const orderId = 95;
        common.login('dealerprincipal');

        // Order creation
        let createOrderPage = new orders.NewOrderPage();
        createOrderPage.loadUsingMenuLink();
        createOrderPage.stockFormSubmit.click();

        // attempts to clone an existing order
        let modelSeriesPage = new orders.ModelSeriesPage();
        modelSeriesPage.init();

        modelSeriesPage.customerLookupInput.sendKeys('NA0002');
        modelSeriesPage.customerLookupLists.get(0).click();

        modelSeriesPage.cloneSubmit.click();

        let weightSizePage = new orders.WeightAndSizePage();

        weightSizePage.formSubmit.click();

        let featuresPage = new orders.FeaturesPage();
        featuresPage.init();
        featuresPage.save.click();

        // navigates to the customer details page and check customer details.
        featuresPage.linkCustomerDetails.click();
        let customerDetails = new orders.CustomerDetailsPage(orderId);
        expect(customerDetails.customerFirstname.getAttribute('value')).toEqual('');

    }));


    it('Can clone existing customer order on creating new customer order without copying existing customer details ', common.restoreDatabase('base', () => {
        const orderId = 95;
        common.login('dealerprincipal');

        // Order creation
        let createOrderPage = new orders.NewOrderPage();
        createOrderPage.loadUsingMenuLink();

        createOrderPage.customerFirstname.sendKeys('Test user firstname 02');
        createOrderPage.customerLastname.sendKeys('Test user lastname 02');
        createOrderPage.customerEmail.sendKeys('testuser02@example.com');
        createOrderPage.customerMailingList.click();
        createOrderPage.customerPhone.sendKeys('0198765432');
        createOrderPage.customerPartnerName.sendKeys('Test user partner 02');
        createOrderPage.desiredDeliveryMonth.element(by.cssContainingText('option', 'Nov 2016')).click();
        createOrderPage.customerTowVehicle.sendKeys('Test user car 02');
        createOrderPage.customerSourceOfAwareness.element(by.cssContainingText('option', 'Caravan World Magazine')).click();
        createOrderPage.customerAcquisitionSource.element(by.cssContainingText('option', 'TV Commercial')).click();
        createOrderPage.customerAddressName.sendKeys('Test user name 01');
        createOrderPage.customerAddressStreet.sendKeys('02 Testuser St');
        createOrderPage.customerAddressSuburb.sendKeys('NUNAWADING');
        createOrderPage.customerAddressState.element(by.cssContainingText('option', 'Victoria')).click();
        createOrderPage.customerAddressPostCode.sendKeys('3131');

        createOrderPage.customerFormSubmit.click();

        // clone an existing order
        let modelSeriesPage = new orders.ModelSeriesPage();
        modelSeriesPage.init();

        modelSeriesPage.customerLookupInput.sendKeys('NA0002');
        expect(modelSeriesPage.customerLookupLists.count()).toBe(1);
        modelSeriesPage.customerLookupLists.get(0).click();
        modelSeriesPage.cloneSubmit.click();

        let weightSizePage = new orders.WeightAndSizePage();
        weightSizePage.formSubmit.click();

        // navigates to the customer details page and check customer details.
        let featuresPage = new orders.FeaturesPage();
        featuresPage.save.click();
        featuresPage.linkCustomerDetails.click();
        let customerDetails = new orders.CustomerDetailsPage(orderId);
        expect(customerDetails.customerFirstname.getAttribute('value')).toEqual('Test user firstname 02');
    }));

    it('Convert customer order to a dealership order', common.restoreDatabase('base', () => {
        // This test is added to create a dealership order inorder to test cloning dealership orders
        const orderId = 92;
        common.login('admin');


        let featuresPage = new orders.FeaturesPage(orderId);
        featuresPage.load();

        featuresPage.linkCustomerDetails.click();

        let customerDetailsPage = new orders.CustomerDetailsPage(orderId);
        customerDetailsPage.convertDelaershipBtn.click();
        customerDetailsPage.saveOrder.click();
        protractor.promise.controlFlow().execute(() => common.saveDatabase('saveorder.030.order_92_as_stock_order'));

    }));

    it('Can clone existing dealership order on creating new customer order ', common.restoreDatabase('saveorder.030.order_92_as_stock_order', () => {
        const orderId = 95;
        common.login('dealerprincipal');

        // Order creation
        let createOrderPage = new orders.NewOrderPage();
        createOrderPage.loadUsingMenuLink();

        createOrderPage.customerFirstname.sendKeys('Test user firstname 02');
        createOrderPage.customerLastname.sendKeys('Test user lastname 02');
        createOrderPage.customerEmail.sendKeys('testuser02@example.com');
        createOrderPage.customerMailingList.click();
        createOrderPage.customerPhone.sendKeys('0198765432');
        createOrderPage.customerPartnerName.sendKeys('Test user partner 02');
        createOrderPage.desiredDeliveryMonth.element(by.cssContainingText('option', 'Nov 2016')).click();
        createOrderPage.customerTowVehicle.sendKeys('Test user car 02');
        createOrderPage.customerSourceOfAwareness.element(by.cssContainingText('option', 'Caravan World Magazine')).click();
        createOrderPage.customerAcquisitionSource.element(by.cssContainingText('option', 'TV Commercial')).click();
        createOrderPage.customerAddressName.sendKeys('Test user name 01');
        createOrderPage.customerAddressStreet.sendKeys('02 Testuser St');
        createOrderPage.customerAddressSuburb.sendKeys('NUNAWADING');
        createOrderPage.customerAddressState.element(by.cssContainingText('option', 'Victoria')).click();
        createOrderPage.customerAddressPostCode.sendKeys('3131');

        createOrderPage.customerFormSubmit.click();

        // clone an existing stock order
        let modelSeriesPage = new orders.ModelSeriesPage();
        modelSeriesPage.init();

        modelSeriesPage.customerLookupInput.sendKeys('NA0004');
        expect(modelSeriesPage.customerLookupLists.count()).toBe(1);
        modelSeriesPage.customerLookupLists.get(0).click();
        modelSeriesPage.cloneSubmit.click();

        let weightSizePage = new orders.WeightAndSizePage();
        weightSizePage.formSubmit.click();

        let featuresPage = new orders.FeaturesPage();
        featuresPage.save.click();
        featuresPage.linkCustomerDetails.click();
        let customerDetails = new orders.CustomerDetailsPage(orderId);
        expect(customerDetails.customerFirstname.getAttribute('value')).toEqual('Test user firstname 02');
    }));

});
