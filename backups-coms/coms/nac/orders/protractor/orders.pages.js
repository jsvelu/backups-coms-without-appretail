import * as common from '../../../test-e2e/common';
import * as newage from '../../../nac/newage/protractor/newage.pages';


//---------------------------------------------------------------------------

class OrderPage extends newage.MenuPage {
    constructor() {
        super();
        this.isAngular = true;
        this.urlPath = '/newage/orders/';

        this.save = element(by.buttonText('Save Quote'));
        this.saveOrder = element(by.buttonText('Save Order'));
        this.requestToPlaceOrder = element(by.buttonText('Request to Place Order'));
        this.placeOrder = element(by.buttonText('Place Order'));
        this.cancelOrder = element(by.buttonText('Cancel Order'));

        this.placeOrderPopup = {};
        this.placeOrderPopup.modal = this.modal('#place_order');
        this.placeOrderPopup.panel = element(by.css('div#place_order'));
        this.placeOrderPopup.placeOrderButton = this.placeOrderPopup.panel.element(by.buttonText('Place Order'));

        this.cancelOrderPopup = {};
        this.cancelOrderPopup.modal = this.modal('#cancel_order');
        this.cancelOrderPopup.panel = element(by.css('div#cancel_order'));
        this.cancelOrderPopup.cancelOrderButton = this.cancelOrderPopup.panel.element(by.buttonText('Cancel Order'));

        this.cancelOrderLockPopup = {};
        this.cancelOrderLockPopup.modal = this.modal('#order_finalization_cancel_reason');
        this.cancelOrderLockPopup.panel = element(by.css('div#order_finalization_cancel_reason'));
        this.cancelOrderLockPopup.cancelOrderLockReason = element(by.model('order_finalization_cancel_reason'));
        this.cancelOrderLockPopup.cancelOrderLockButton = this.cancelOrderLockPopup.panel.element(by.buttonText('Cancel Order Lock'));

        this.finalizeOrder = element(by.buttonText('Lock Order'));
        this.modelDescription = element(by.cssContainingText('#ngApp div.top-bar div.row.top-bar-info div', 'Model'));
        this.totalCharge = element(by.css('[name="order_retailprice"]'));
        this.currentStage = element(by.css('[name="order_stage"]'));

        this.linkCustomerDetails = element(by.linkText('Customer Details'));
        this.linkStatus = element(by.linkText('Status / Documents / History'));
        this.linkSpecialFeatures = element(by.linkText('Special Features'));

        this.alertDetailsSaved = this.alertContainingText('Details Saved.');
        this.linkCustomerDetails = element(by.linkText('Customer Details'));
        this.show = element(by.model('order.show_id'));
    }
}


//---------------------------------------------------------------------------
class NewOrderPage extends OrderPage {
    constructor() {
        super();
        this.urlHashRedirect = '/new/customer/';
        this.menuLinkText = 'Create Order';

        this.dealershipForStock = element.all(by.model('order.dealership')).get(0);
        this.dealershipForCustomer = element.all(by.model('order.dealership')).get(1);
        this.desiredDeliveryMonth = element.all(by.model('order.delivery_date')).get(0);
        this.stockForm = element(by.css('[name="stock_form"]'));
        this.stockFormSubmit = this.stockForm.element(by.css('[type="submit"]'));
        this.saveStockOrder = element(by.buttonText('Create Dealership Order'));

        this.customerForm = element(by.css('[name="customer_form"]'));

        const customerLookup = this.customerForm.element(by.css('lookup[result="search.customer"]'));
        this.customerLookupInput = customerLookup.element(by.css('input'));
        this.customerLookupLists = customerLookup.all(by.repeater('match in matches'));

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

module.exports.NewOrderPage = NewOrderPage;


//---------------------------------------------------------------------------
class CustomerDetailsPage extends NewOrderPage {
    constructor(orderId) {
        super();

        this.urlHashRedirect = /\/\d+\/customer/;
        this.menuLinkText = '';

        if (orderId) {
            this.urlHashRedirect = this.urlHash = `/${orderId}/customer`;
        }

        this.form = element(by.css('[name="stock_form"]'));
        this.convertDelaershipBtn = this.form.element(by.buttonText('Convert to Dealership Order'));
        this.saveOrder = element(by.buttonText('Save Order'));

        this.customerForm = element(by.css('[name="customer_form"]'));
        const customerLookup = this.customerForm.element(by.css('lookup[result="search.customer"]'));
        this.customerLookupInput = customerLookup.element(by.css('input'));
        this.customerLookupLists = customerLookup.all(by.repeater('match in matches'));
        this.customerFormSubmit = this.customerForm.element(by.css('[type="submit"]'));
        this.customerFirstname = this.customerForm.element(by.model('order.customer.first_name'));

        //this.saveProceedBtn = this.form.element(by.buttonText('Save and Proceed'));
    }
}

module.exports.CustomerDetailsPage = CustomerDetailsPage;


//---------------------------------------------------------------------------

class CaravanDetailsPage extends OrderPage {
    constructor() {
        super();

        this.linkModelSeries = element(by.linkText('Model & Series'));
        this.linkWeightSize = element(by.linkText('Weight & Size'));
        this.linkFeatures = element(by.linkText('Features'));
    }
}

//---------------------------------------------------------------------------

class ModelSeriesPage extends CaravanDetailsPage {
    constructor(orderId) {
        super();
        this.urlHashRedirect = /\/\d+\/caravan\/model-and-series/;
        if (orderId) {
            this.urlHashRedirect = this.urlHash = `/${orderId}/caravan/model-and-series`;
        }

        this.model = element(by.model('order.modelSelection'));
        this.series = element(by.model('order.seriesSelection'));

        this.form = element(by.css('[name="modelseries_form"]'));
        this.formSubmit = this.form.element(by.buttonText('Continue with this Series'));

        const customerLookup = this.form.element(by.css('lookup[result="order_lookup_result"]'));
        this.customerLookupInput = customerLookup.element(by.css('input'));
        this.customerLookupLists = customerLookup.all(by.repeater('match in matches'));
        this.cloneSubmit = this.form.element(by.buttonText('Continue with items from selected order'));

    }
}

module.exports.ModelSeriesPage = ModelSeriesPage;


//---------------------------------------------------------------------------

class WeightAndSizePage extends CaravanDetailsPage {
    constructor(orderId) {
        super();
        this.urlHashRedirect = /\/\d+\/caravan\/weight-and-size/;
        if (orderId) {
            this.urlHashRedirect = this.urlHash = `/${orderId}/caravan/weight-and-size`;
        }

        this.form = element(by.css('[name="weightsize_form"]'));
        this.formSubmit = this.form.element(by.buttonText('Save and proceed'));
    }
}

module.exports.WeightAndSizePage = WeightAndSizePage;


//---------------------------------------------------------------------------

class FeaturesPage extends CaravanDetailsPage {
    constructor(orderId) {
        super();
        this.urlHashRedirect = /\/\d+\/caravan\/features/;
        if (orderId) {
            this.urlHashRedirect = this.urlHash = `/${orderId}/caravan/features`;
        }

        this.totalCost = $('span.series-cost');

        this.optionsModal = this.modal('#options');

        this.chassis = {};
        this.chassis.panel = element(by.cssContainingText('uib-accordion div.panel', 'CHASSIS'));

        this.chassis.items = this.chassis.panel.all(by.css('div.item-group-panel'));
        this.chassis.firstItem = this.chassis.items.first();

        this.chassis.linoColourDropdown = this.chassis.items.get(15);
        this.chassis.linoColourUnselected = this.chassis.linoColourDropdown.element(by.cssContainingText('b', 'Lino Colour'));
        this.chassis.linoColourCurrent = this.chassis.linoColourDropdown.element(by.css('div.item-name'));

        this.chassis.aFrame = this.chassis.items.get(2);

        this.chassis.archivedItem = this.chassis.items.filter(el => el.getText().then(text => text === 'New Archived Item')).first();

        this.chassis.addExtra = this.chassis.panel.element(by.buttonText('+ Add Optional Extra'));
        this.chassis.extraModal = $('#options');
        this.chassis.extraModalClose = this.chassis.extraModal.element(by.css('button.close'));
        this.chassis.extraItems = this.chassis.extraModal.all(by.css('.option-panel'));
        this.chassis.removeExtra = this.chassis.panel.element(by.css('.glyphicon-remove'));

        this.furniture = {};
        this.furniture.panel = element(by.cssContainingText('uib-accordion div.panel', 'FURNITURE'));
        this.furniture.items = this.furniture.panel.all(by.css('div.item-group-panel'));
        this.furniture.firstItem = this.furniture.items.first();

        this.furniture.bedDropdown = this.furniture.items.get(0);
        this.furniture.bedUnselected = this.furniture.bedDropdown.element(by.cssContainingText('b', 'Bed Queen (BEDQ)'));
        this.furniture.bedCurrent = this.furniture.bedDropdown.element(by.css('div.item-name'));

        this.furniture.laminexColourDropdown = this.furniture.items.get(5);
        this.furniture.laminexColourUnselected = this.furniture.laminexColourDropdown.element(by.cssContainingText('b', 'Laminex Colour'));
        this.furniture.laminexColourCurrent = this.furniture.laminexColourDropdown.element(by.css('div.item-name'));

        this.furniture.panelColourBaseDropdown = this.furniture.items.get(6);
        this.furniture.panelColourBaseUnselected = this.furniture.panelColourBaseDropdown.element(by.cssContainingText('b', 'Panel Colour (Base)'));
        this.furniture.panelColourBaseCurrent = this.furniture.panelColourBaseDropdown.element(by.css('div.item-name'));

        this.furniture.panelColourOverheadDropdown = this.furniture.items.get(7);
        this.furniture.panelColourOverheadUnselected = this.furniture.panelColourOverheadDropdown.element(by.cssContainingText('b', 'Panel Colour Overhead Colours (OHC)'));
        this.furniture.panelColourOverheadCurrent = this.furniture.panelColourOverheadDropdown.element(by.css('div.item-name'));

        this.furniture.splashbackColourDropdown = this.furniture.items.get(8);
        this.furniture.splashbackColourUnselected = this.furniture.splashbackColourDropdown.element(by.cssContainingText('b', 'Splashback Colour'));
        this.furniture.splashbackColourCurrent = this.furniture.splashbackColourDropdown.element(by.css('div.item-name'));

        this.plumbing = {};
        this.plumbing.panel = element(by.cssContainingText('uib-accordion div.panel', 'PLUMBING'));
        this.plumbing.items = this.plumbing.panel.all(by.css('div.item-group-panel'));

        this.plumbing.toiletDropdown = this.plumbing.items.get(7);
        this.plumbing.toiletUnselected = this.plumbing.toiletDropdown.element(by.cssContainingText('b', 'Toilet - Ceramic'));
        this.plumbing.toiletCurrent = this.plumbing.toiletDropdown.element(by.css('div.item-name'));

        this.printMenuBtn = element(by.buttonText("Print Menu"));
        this.printMenu = {};
        this.printMenu.panel = element(by.css('ul#print-menu'));
        this.printMenu.specs = this.printMenu.panel.element(by.linkText('Print Specs'));
        this.printMenu.brochure = this.printMenu.panel.element(by.linkText('Print Brochure'));
        this.printMenu.invoice = this.printMenu.panel.element(by.linkText('Print Invoice'));
        this.printMenu.autocad = this.printMenu.panel.element(by.linkText('Print for AutoCAD (PDF)'));

        this.displayTotalsBtn = element(by.buttonText("Display Totals"));
        this.displayTotals = {};
        this.displayTotals.modal = this.modal('#totals');
        this.displayTotals.panel = element(by.css('div.totals-modal'));
        this.displayTotals.panel.headers = this.displayTotals.panel.all(by.css('thead th'));
        this.displayTotals.numbers = this.displayTotals.panel.all(by.css('tr'));

        this.displayTotals.adjustmentWholesale = this.displayTotals.panel.element(by.model('order.price_adjustments.wholesale'));
        this.displayTotals.adjustmentWholesaleComment = this.displayTotals.panel.element(by.model('order.price_adjustments.wholesale_comment'));
        this.displayTotals.adjustmentWholesaleCommentError = this.displayTotals.panel.all(by.css('#wholesale_comment-error'));
        this.displayTotals.adjustmentRetail = this.displayTotals.panel.element(by.model('order.price_adjustments.retail'));

        this.displayTotals.afterSalesWholesale = this.displayTotals.panel.element(by.model('order.after_sales.wholesale'));
        this.displayTotals.afterSalesRetail = this.displayTotals.panel.element(by.model('order.after_sales.retail'));
        this.displayTotals.afterSalesDescription = this.displayTotals.panel.element(by.model('order.after_sales.description'));

        this.displayTotals.dealerLoadPrice = this.displayTotals.panel.element(by.model('order.dealer_load'));
        this.displayTotals.tradeinWriteback = this.displayTotals.panel.element(by.model('order.trade_in_write_back'));
        this.displayTotals.afterSalesretail = this.displayTotals.panel.element(by.model('order.trade_in_write_back'));

        this.displayTotals.otherComments = this.displayTotals.panel.element(by.model('order.price_comment'));

        this.displayTotals.grandTotals = this.displayTotals.panel.all(by.css('#totals--grand-totals'));
        this.displayTotals.totalWholeSale = this.displayTotals.grandTotals.all(by.css('td')).get(1);
        this.displayTotals.totalMargin = this.displayTotals.grandTotals.all(by.css('td')).get(2);
        this.displayTotals.totalRetail = this.displayTotals.grandTotals.all(by.css('td')).get(3);
        this.displayTotals.grandTotalsRetail = this.displayTotals.grandTotals.all(by.css('td')).get(5);
        this.displayTotals.totalShowSpecial = this.displayTotals.numbers.get(5).all(by.css('td')).get(1);

        this.displayTotals.basicCaravan = this.displayTotals.panel.all(by.css('tr')).get(2);
        this.displayTotals.retailBasicCaravan = this.displayTotals.basicCaravan.all(by.css('td')).get(1);

        this.displayTotals.optionalExtra = this.displayTotals.panel.all(by.css('tr')).get(3);
        this.displayTotals.retailoptionalExtras = this.displayTotals.optionalExtra.all(by.css('td')).get(1);


        this.displayTotals.saveBtn = element(by.buttonText('Save Prices'));

        this.subjectToBtn = element(by.buttonText("Subject To..."));
        this.subjectTo = {};
        this.subjectTo.modal = this.modal('#order_conditions');
        this.subjectTo.panel = element(by.css('div#order_conditions'));
        this.subjectTo.save = this.subjectTo.panel.element(by.buttonText('Save'));
        this.subjectTo.close = this.subjectTo.panel.element(by.buttonText('Close'));
        this.subjectTo.conditionText = this.subjectTo.panel.element(by.css('textarea'));
        this.subjectTo.conditionMet = this.subjectTo.panel.element(by.css('input'));


        this.afterMarketBtn = element(by.buttonText("After-market note"));
        this.afterMarket = {};
        this.afterMarket.modal = this.modal('#after_market_note');
        this.afterMarket.panel = element(by.css('div#after_market_note'));
        this.afterMarket.close = this.afterMarket.panel.element(by.buttonText('Close'));
        this.afterMarket.noteText = this.afterMarket.panel.element(by.css('textarea'));


        this.showSpecialBtn = element(by.buttonText("Special Offers and Packs"));
        this.showSpecial = {};
        this.showSpecial.modal = this.modal('#specials');
        this.showSpecial.panel = element(by.css('div.modal.specials'));
        this.showSpecial.apply = this.showSpecial.panel.element(by.buttonText('Apply this special'));
        this.showSpecial.close = this.showSpecial.panel.all(by.css('button')).last();
   }
}

module.exports.FeaturesPage = FeaturesPage;


class SpecialFeaturesPage extends OrderPage {
    constructor(orderId) {
        super();
        this.urlHashRedirect = /\/\d+\/special_features/;
        if (orderId) {
            this.urlHashRedirect = this.urlHash = `/${orderId}/special_features`;
        }

        this.customSeriesName = element(by.model('order.custom_series_name'));
        this.customSeriesCode = element(by.model('order.custom_series_code'));

        this.addSpecialFeature = element(by.css('button.add-special-feature'));

        this.customerDescription = element.all(by.model('feature.customer_description'));
        this.retailPrice = element.all(by.model('feature.retail_price'));
        this.wholesalePrice = element.all(by.model('feature.wholesale_price'));
        this.factoryDescription = element.all(by.model('feature.factory_description'));
        this.category = element.all(by.model('feature.selectedCategory'));
        this.department = element.all(by.model('feature.selectedDepartment'));
        this.remove = element.all(by.css('button.btn-primary > span.glyphicon.glyphicon-minus'));
        this.approve = element.all(by.css('button.btn-success > span.glyphicon.glyphicon-ok-sign'));
        this.reject = element.all(by.css('button.btn-danger > span.glyphicon.glyphicon-remove-sign'));
        this.rejectReason = element.all(by.model('feature.reject_reason'));
        this.approvalPending = element.all(by.css('span.glyphicon.glyphicon-question-sign'));
    }
}
module.exports.SpecialFeaturesPage = SpecialFeaturesPage;


// ----------------------------------------------------------------------------------------------------------------
// Print pages
class PrintoutPage extends common.Page {
    constructor(orderId) {
        super();

        this.isAngular = false;
    }
}

class SpecificationPrintoutPage extends PrintoutPage {
    constructor(orderId) {
        super();
        this.urlPath = `/orders/spec/${orderId}/?is_html=1`;
    }
}

class BrochurePrintoutPage extends PrintoutPage {
    constructor(orderId) {
        super();
        this.urlPath = `/orders/brochure/${orderId}/?is_html=1`;
    }
}

class InvoicePrintoutPage extends PrintoutPage {
    constructor(orderId) {
        super();
        this.urlPath = `/orders/invoice/${orderId}/?is_html=1`;
    }
}

class AutoCADPrintoutPage extends PrintoutPage {
    constructor(orderId) {
        super();
        this.urlPath = `/orders/autocad/${orderId}/?is_html=1`;
    }
}

module.exports.SpecificationPrintoutPage = SpecificationPrintoutPage;
module.exports.BrochurePrintoutPage = BrochurePrintoutPage;
module.exports.InvoicePrintoutPage = InvoicePrintoutPage;
module.exports.AutoCADPrintoutPage = AutoCADPrintoutPage;

// ----------------------------------------------------------------------------------------------------------------

class StatusPage extends OrderPage {
    constructor(orderId) {
        super();
        this.urlHashRedirect = /\/\d+\/status/;
        if (orderId) {
            this.urlHashRedirect = this.urlHash = `/${orderId}/status`;
        }

        this.statusListContainer = element(by.css('div.status-container'));
        this.statusList = this.statusListContainer.all(by.css('div.task-row'));

        this.deliveryWeightModal= this.modal("#delivery_weights");
        this.customerPlanRejectReasonModal = this.modal("#customer_plan_reject_reason");

        this.changeManager = element(by.buttonText('Change Customer Manager'));
        this.changeManagerSelection = element(by.model('new_customer_manager_id'));
        this.changeManagerConfirm = element(by.buttonText('Update'));

        // Rows can be visible or not depending on permissions, cannot use index-based function to get the row item
        // TODO: Somehow use by.model()
        const getStatusListRow = (labelText) => this.statusListContainer.element(by.xpath('//status-row/div[div="'+labelText+'"]/..'));
        const getStatusListStatusElement = (labelText) => getStatusListRow(labelText).element(by.css('div.stage-badge'));
        // const getStatusListStatusElement = (labelText) => getStatusListRow(labelText).element(by.model('stage.status'));

        this.customerDetailsCaptured = getStatusListStatusElement('Customer Details Captured');
        this.caravanDetailsSaved = getStatusListStatusElement('Selections Completed');

        this.orderRequested = getStatusListStatusElement('Order Placement Requested');

        this.specialFeatureRow = getStatusListRow('Special features reviewed');
        this.specialFeature = this.specialFeatureRow.element(by.css('div.stage-badge'));

        this.orderPlacedRow = getStatusListRow('Order Placed');
        this.orderPlaced = this.orderPlacedRow.element(by.css('div.stage-badge'));

        this.depositPaidRow = getStatusListRow('Deposit Paid');
        this.depositPaid = this.depositPaidRow.element(by.css('div.stage-badge'));

        this.finalizedRow = getStatusListRow('Order Locked');
        this.finalized = this.finalizedRow.element(by.css('div.stage-badge'));
        this.cancelOrderLock = this.finalizedRow.element(by.buttonText('Cancel Order Lock'));

        this.chassisAppointedRow = getStatusListRow('Chassis Number Appointed');
        this.chassisAppointed =  this.chassisAppointedRow.element(by.css('div.stage-badge'));
        this.setChassisNumButton = element(by.buttonText('Manually Set Chassis Number'));
        this.setChassisNumField = element(by.model('status.approval.chassis_appointed.data'));
        this.confirmChassisButton = element(by.buttonText('Confirm'));
        this.errorMessages = element(by.repeater('text in message.message_list'));

        this.drafterAppointedRow = getStatusListRow('Drafter Appointed');
        this.drafterAppointed = this.drafterAppointedRow.element(by.css('div.stage-badge'));
        this.drafterSelection = this.drafterAppointedRow.element(by.model('status.approval.drafter_appointed.data'));
        this.drafterAppoint = this.drafterAppointedRow.element(by.buttonText('Appoint'));

        this.customerPlanRow = getStatusListRow('Customer Plans & Specs Produced');
        this.customerPlan = this.customerPlanRow.element(by.css('div.stage-badge'));
        this.customerPlanUploadInput = element(by.css('input[type=file][ng-model="status.approval.customer_plans_produced.file_upload"]'));
        this.customerPlanUploadButton = this.customerPlanRow.element(by.css('button[type="submit"]'));
        this.customerPlanDeleteLink = this.customerPlanRow.element(by.cssContainingText('a', 'Delete'));

        this.customerPlanApprovalRow = getStatusListRow('Customer plan approval');
        this.customerPlanApproval = this.customerPlanApprovalRow.element(by.css('div.stage-badge'));
        this.customerPlanApprovalAcknowledgeCheckbox = this.customerPlanApprovalRow.element(by.model('status.approval.customer_plan_reviewed.customer_plan_disclaimer_checked'));
        this.customerPlanApprovalEstimateCheckbox = this.customerPlanApprovalRow.element(by.model('status.approval.customer_plan_reviewed.weight_estimate_disclaimer_checked'));
        this.customerPlanApprovalApproveButton = this.customerPlanApprovalRow.element(by.buttonText('Approve Customer Plan'));
        this.customerPlanApprovalRejectButton = this.customerPlanApprovalRow.element(by.buttonText('Reject Customer Plan'));
        this.customerPlanApprovalRejectReason = element(by.model('customer_plan_reject_reason'));
        this.customerPlanApprovalRejectConfirm = element(by.cssContainingText('#customer_plan_reject_reason .modal-footer button', 'Reject'));

        this.factoryPlanRow = getStatusListRow('Factory Plans Produced');
        this.factoryPlan = this.factoryPlanRow.element(by.css('div.stage-badge'));
        this.factoryPlanUploadInput = element(by.css('input[type=file][ng-model="status.approval.factory_plans_produced.file_upload"]'));
        this.factoryPlanUploadButton = this.factoryPlanRow.element(by.css('button[type="submit"]'));
        this.factoryPlanDeleteLink = this.factoryPlanRow.element(by.cssContainingText('a', 'Delete'));
        this.factoryPlanExternal = this.factoryPlanRow.element(by.model('status.approval.factory_plans_produced.data[0].is_separated'));

        this.chassisPlanRow = getStatusListRow('Chassis Plans Produced');
        this.chassisPlan = this.chassisPlanRow.element(by.css('div.stage-badge'));
        this.chassisPlanUploadInput = element(by.css('input[type=file][ng-model="status.approval.chassis_plans_produced.file_upload"]'));
        this.chassisPlanUploadButton = this.chassisPlanRow.element(by.css('button[type="submit"]'));
        this.chassisPlanDeleteLink = this.chassisPlanRow.element(by.cssContainingText('a', 'Delete'));
        this.chassisPlanExternal = this.chassisPlanRow.element(by.model('status.approval.chassis_plans_produced.data[0].is_separated'));

        this.qcDatePlannedRow = getStatusListRow('Planned QC Date');
        this.qcDatePlanned = this.qcDatePlannedRow.element(by.css('div.stage-badge'));
        this.qcDatePlannedInput = this.qcDatePlannedRow.element(by.model('status.delivery.qc_date_planned.data'));
        this.qcDatePlannedUpdate = this.qcDatePlannedRow.element(by.buttonText('Set Date'));

        this.qcDateActualRow = getStatusListRow('Actual QC Date');
        this.qcDateActual = this.qcDateActualRow.element(by.css('div.stage-badge'));
        this.qcDateActualInput = this.qcDateActualRow.element(by.model('status.delivery.qc_date_actual.data'));
        this.qcDateActualUpdate = this.qcDateActualRow.element(by.buttonText('Set Date'));

        this.vinNumberRow = getStatusListRow('VIN Number Assigned');
        this.vinNumber = this.vinNumberRow.element(by.css('div.stage-badge'));
        this.vinNumberInput = this.vinNumberRow.element(by.model('status.delivery.vin_number.data'));
        this.vinNumberUpdate = this.vinNumberRow.element(by.buttonText('Update'));

        this.weightsRow = getStatusListRow('Weights');
        this.weights = this.weightsRow.element(by.css('div.stage-badge'));
        this.weightsOpenModal = this.weightsRow.element(by.buttonText('Set Weights'));
        this.weightsModal = element(by.css('#delivery_weights'));
        this.weightsModalTare = this.weightsModal.element(by.model('status.delivery.new_weights.data.weight_tare'));
        this.weightsModalAtm = this.weightsModal.element(by.model('status.delivery.new_weights.data.weight_atm'));
        this.weightsModalTowBall = this.weightsModal.element(by.model('status.delivery.new_weights.data.weight_tow_ball'));
        this.weightsModalTyres = this.weightsModal.element(by.model('status.delivery.new_weights.data.weight_tyres'));
        this.weightsModalChassisGtm = this.weightsModal.element(by.model('status.delivery.new_weights.data.weight_chassis_gtm'));
        this.weightsModalGasComp = this.weightsModal.element(by.model('status.delivery.new_weights.data.weight_gas_comp'));
        this.weightsModalPayload = this.weightsModal.element(by.model('status.delivery.new_weights.data.weight_payload'));
        this.weightsModalSave = this.weightsModal.element(by.buttonText('Save Weights'));

        this.dispatchDatePlannedRow = getStatusListRow('Planned Dispatch Date');
        this.dispatchDatePlanned = this.dispatchDatePlannedRow.element(by.css('div.stage-badge'));
        this.dispatchDatePlannedInput = this.dispatchDatePlannedRow.element(by.model('status.delivery.dispatch_date_planned.data'));
        this.dispatchDatePlannedUpdate = this.dispatchDatePlannedRow.element(by.buttonText('Set Date'));

        this.dispatchDateActualRow = getStatusListRow('Actual Dispatch Date');
        this.dispatchDateActual = this.dispatchDateActualRow.element(by.css('div.stage-badge'));
        this.dispatchDateActualInput = this.dispatchDateActualRow.element(by.model('status.delivery.dispatch_date_actual.data'));
        this.dispatchDateActualUpdate = this.dispatchDateActualRow.element(by.buttonText('Set Date'));

        this.handoverToDriverRow = getStatusListRow('Upload Driver Handover Form');
        this.handoverToDriver = this.handoverToDriverRow.element(by.css('div.stage-badge'));
        this.handoverToDriverUploadInput = element(by.css('input[type=file][ng-model="status.approval.handover_to_driver_form.file_upload"]'));
        this.handoverToDriverUploadButton = this.handoverToDriverRow.element(by.css('button[type="submit"]'));
        this.handoverToDriverDeleteLink = this.handoverToDriverRow.element(by.cssContainingText('a', 'Delete'));
        this.handoverToDriverExternal = this.handoverToDriverRow.element(by.model('status.approval.handover_to_driver_form.data[0].is_separated'));

        this.receivedDateDealershipRow = getStatusListRow('Van Received at Dealership');
        this.receivedDateDealership = this.receivedDateDealershipRow.element(by.css('div.stage-badge'));
        this.receivedDateDealershipInput = this.receivedDateDealershipRow.element(by.model('status.delivery.received_date_dealership.data'));
        this.receivedDateDealershipUpdate = this.receivedDateDealershipRow.element(by.buttonText('Set Date'));

        this.handoverToDealershipRow = getStatusListRow('Upload Driver Handover To Dealership Form');
        this.handoverToDealership = this.handoverToDealershipRow.element(by.css('div.stage-badge'));
        this.handoverToDealershipUploadInput = element(by.css('input[type=file][ng-model="status.approval.handover_to_dealership_form.file_upload"]'));
        this.handoverToDealershipUploadButton = this.handoverToDealershipRow.element(by.css('button[type="submit"]'));
        this.handoverToDealershipDeleteLink = this.handoverToDealershipRow.element(by.cssContainingText('a', 'Delete'));
        this.handoverToDealershipExternal = this.handoverToDealershipRow.element(by.model('status.approval.handover_to_dealership_form.data[0].is_separated'));

        this.customerDeliveryDateRow = getStatusListRow('Customer Delivery Date');
        this.customerDeliveryDate = this.customerDeliveryDateRow.element(by.css('div.stage-badge'));
        this.customerDeliveryDateInactive = this.customerDeliveryDateRow.element(by.css('div.ng-scope'));
        this.customerDeliveryDateInput = this.customerDeliveryDateRow.element(by.model('status.delivery.delivery_date_customer.data.delivery_date_customer'));
        this.customerDeliveryDateUpdate = this.customerDeliveryDateRow.element(by.buttonText('Set Date'));

        //elements to locate history actions by each row
        this.historyActionRowOne = element(by.xpath('//div/div[1]/ui-view/div/div[6]/div[2]/div[3]'));
        this.historyActionRowTwo = element(by.xpath('//div/div[1]/ui-view/div/div[6]/div[3]/div[3]'));
        this.historyActionRowThree = element(by.xpath('//div/div[1]/ui-view/div/div[6]/div[4]/div[3]'));

        //elements to locate history action details by each row
        this.historyActionDetailsRowOne = element(by.xpath('//div[3]/div/div/div[1]/ui-view/div/div[6]/div[2]/div[4]/div'));
        this.historyActionDetailsRowtwo = element(by.xpath('//div[3]/div/div/div[1]/ui-view/div/div[6]/div[3]/div[4]/div'));

        //elements to locate history action details by each row when there are more than one sentence in each row
        this.historyActionDetailsSentenceOne = element(by.xpath('//div[3]/div/div/div[1]/ui-view/div/div[6]/div[2]/div[4]/div[1]'));
        this.historyActionDetailsSentenceTwo = element(by.xpath('//div[3]/div/div/div[1]/ui-view/div/div[6]/div[2]/div[4]/div[2]'));
        this.historyActionDetailsSentenceThree = element(by.xpath('//div[3]/div/div/div[1]/ui-view/div/div[6]/div[2]/div[4]/div[3]'));

    }
}
module.exports.StatusPage = StatusPage;


//---------------------------------------------------------------------------

class OrderListPage extends newage.MenuPage {
    constructor() {
        super();
        this.isAngular = false;
        this.urlPath = '/orders/list/';
        this.menuLinkText = 'All Orders';

        this.table = element(by.css('#content .table-container table'));
        this.tableHeaders = this.table.all(by.css('tr > th'));

        this.manageLinks = element.all(by.linkText('Manage'));

        this.filterListHeader = element(by.css('div.newage-generic-filter .panel-title a'));
        this.filterUnmetConditions = element(by.css('select#id_conditions'));
        this.filterSubmit = element(by.css('input.btn-newage'));

        this.recordCount = element(by.css('span.record-count'));
    }
}

module.exports.OrderListPage = OrderListPage;

//---------------------------------------------------------------------------

