import * as assert from 'assert';
import * as _ from 'lodash';

import * as common from '../../../test-e2e/common';
import * as newage from '../../../nac/newage/protractor/newage.pages';
import * as orders from '../../../nac/orders/protractor/orders.pages';

describe('Test permissions', () => {

    const orderId = 88;

    // we don't iterate through keys because we want to
    // catch if there are any missing expected outputs
    const visibilityFields = [
        'customerDetailsCaptured',
        'caravanDetailsSaved',
        'orderRequested',
        'depositPaidRow',
        'orderPlacedRow',
        'specialFeatureRow',
        'finalizedRow',
        'chassisAppointedRow',
        'drafterAppointedRow',
        'customerPlanRow',
        'customerPlanApprovalRow',
        'factoryPlanRow',
        'chassisPlanRow',
        'qcDatePlannedRow',
        'qcDateActualRow',
        'vinNumberRow',
        'weightsRow',
        'dispatchDatePlannedRow',
        'dispatchDateActualRow',
        'handoverToDriverRow',
        'receivedDateDealershipRow',
        'handoverToDealershipRow',
        'customerDeliveryDateRow',
    ];

    const usersDetails = {

        'admin': {
            statusListCount: 25,

            customerDetailsCaptured:true,
            caravanDetailsSaved:    true,
            orderRequested:         true,
            depositPaidRow:         true,
            orderPlacedRow:         true,
            specialFeatureRow:      true,
            finalizedRow:           true,
            chassisAppointedRow:    true,
            drafterAppointedRow:    true,
            customerPlanRow:        true,
            customerPlanApprovalRow:false,
            factoryPlanRow:         true,
            chassisPlanRow:         true,
            qcDatePlannedRow:       true,
            qcDateActualRow:        true,
            vinNumberRow:           true,
            weightsRow:             true,
            dispatchDatePlannedRow: true,
            dispatchDateActualRow:  true,
            handoverToDriverRow:    true,
            receivedDateDealershipRow:  true,
            handoverToDealershipRow:    true,
            customerDeliveryDateRow:    true,
        },

        'dealerprincipal': {
            statusListCount: 14,

            customerDetailsCaptured:true,
            caravanDetailsSaved:    true,
            orderRequested:         true,
            orderPlacedRow:         true,
            specialFeatureRow:      true,
            depositPaidRow:         true,
            finalizedRow:           true,
            chassisAppointedRow:    false,
            drafterAppointedRow:    false,
            customerPlanRow:        true,
            customerPlanApprovalRow:false,
            factoryPlanRow:         false,
            chassisPlanRow:         false,
            qcDatePlannedRow:       false,
            qcDateActualRow:        false,
            vinNumberRow:           false,
            weightsRow:             false,
            dispatchDatePlannedRow: false,
            dispatchDateActualRow:  false,
            handoverToDriverRow:    false,
            receivedDateDealershipRow:  true,
            handoverToDealershipRow:    true,
            customerDeliveryDateRow:    true,
        },

        'dealerrep': {
            statusListCount: 14,

            customerDetailsCaptured:true,
            caravanDetailsSaved:    true,
            orderRequested:         true,
            orderPlacedRow:         true,
            specialFeatureRow:      true,
            depositPaidRow:         true,
            finalizedRow:           true,
            chassisAppointedRow:    false,
            drafterAppointedRow:    false,
            customerPlanRow:        true,
            customerPlanApprovalRow:false,
            factoryPlanRow:         false,
            chassisPlanRow:         false,
            qcDatePlannedRow:       false,
            qcDateActualRow:        false,
            vinNumberRow:           false,
            weightsRow:             false,
            dispatchDatePlannedRow: false,
            dispatchDateActualRow:  false,
            handoverToDriverRow:    false,
            receivedDateDealershipRow:  true,
            handoverToDealershipRow:    true,
            customerDeliveryDateRow:    true,
        },

        'drafter': {
            statusListCount: 9,

            customerDetailsCaptured:false,
            caravanDetailsSaved:    false,
            orderRequested:         false,
            orderPlacedRow:         false,
            specialFeatureRow:      true,
            depositPaidRow:         false,
            finalizedRow:           true,
            chassisAppointedRow:    true,
            drafterAppointedRow:    true,
            customerPlanRow:        true,
            customerPlanApprovalRow:false,
            factoryPlanRow:         true,
            chassisPlanRow:         true,
            qcDatePlannedRow:       false,
            qcDateActualRow:        false,
            vinNumberRow:           false,
            weightsRow:             false,
            dispatchDatePlannedRow: false,
            dispatchDateActualRow:  false,
            handoverToDriverRow:    false,
            receivedDateDealershipRow:  false,
            handoverToDealershipRow:    false,
            customerDeliveryDateRow:    false,
        },

        'nationalsales': {
            statusListCount: 10,

            customerDetailsCaptured:true,
            caravanDetailsSaved:    true,
            orderRequested:         true,
            orderPlacedRow:         true,
            specialFeatureRow:      true,
            depositPaidRow:         true,
            finalizedRow:           true,
            chassisAppointedRow:    false,
            drafterAppointedRow:    false,
            customerPlanRow:        true,
            customerPlanApprovalRow:false,
            factoryPlanRow:         false,
            chassisPlanRow:         false,
            qcDatePlannedRow:       false,
            qcDateActualRow:        false,
            vinNumberRow:           false,
            weightsRow:             false,
            dispatchDatePlannedRow: false,
            dispatchDateActualRow:  false,
            handoverToDriverRow:    false,
            receivedDateDealershipRow:  false,
            handoverToDealershipRow:    false,
            customerDeliveryDateRow:    false,
        },

        'schedulemanager': {
            statusListCount: 10,

            customerDetailsCaptured:false,
            caravanDetailsSaved:    false,
            orderRequested:         false,
            orderPlacedRow:         true,
            specialFeatureRow:      true,
            depositPaidRow:         false,
            finalizedRow:           true,
            chassisAppointedRow:    true,
            drafterAppointedRow:    true,
            customerPlanRow:        true,
            customerPlanApprovalRow:false,
            factoryPlanRow:         true,
            chassisPlanRow:         true,
            qcDatePlannedRow:       false,
            qcDateActualRow:        false,
            vinNumberRow:           false,
            weightsRow:             false,
            dispatchDatePlannedRow: false,
            dispatchDateActualRow:  false,
            handoverToDriverRow:    false,
            receivedDateDealershipRow:  false,
            handoverToDealershipRow:    false,
            customerDeliveryDateRow:    false,
        },

        'transport': {
            statusListCount: 11,

            customerDetailsCaptured:false,
            caravanDetailsSaved:    false,
            orderRequested:         false,
            orderPlacedRow:         false,
            specialFeatureRow:      false,
            depositPaidRow:         false,
            finalizedRow:           false,
            chassisAppointedRow:    false,
            drafterAppointedRow:    false,
            customerPlanRow:        false,
            customerPlanApprovalRow:false,
            factoryPlanRow:         false,
            chassisPlanRow:         false,
            qcDatePlannedRow:       true,
            qcDateActualRow:        true,
            vinNumberRow:           true,
            weightsRow:             true,
            dispatchDatePlannedRow: true,
            dispatchDateActualRow:  true,
            handoverToDriverRow:    true,
            receivedDateDealershipRow:  true,
            handoverToDealershipRow:    true,
            customerDeliveryDateRow:    true,
        },

        'vin': {
            statusListCount: 11,

            customerDetailsCaptured:false,
            caravanDetailsSaved:    false,
            orderRequested:         false,
            orderPlacedRow:         false,
            specialFeatureRow:      false,
            depositPaidRow:         false,
            finalizedRow:           false,
            chassisAppointedRow:    false,
            drafterAppointedRow:    false,
            customerPlanRow:        false,
            customerPlanApprovalRow:false,
            factoryPlanRow:         false,
            chassisPlanRow:         false,
            qcDatePlannedRow:       true,
            qcDateActualRow:        true,
            vinNumberRow:           true,
            weightsRow:             true,
            dispatchDatePlannedRow: true,
            dispatchDateActualRow:  true,
            handoverToDriverRow:    true,
            receivedDateDealershipRow:  true,
            handoverToDealershipRow:    true,
            customerDeliveryDateRow:    true,
        },
    };

    _.forEach(usersDetails, (userDetails, username) => {
        describe(`for user ${username}, status page`, () => {

            it('has correct field visibility', common.restoreDatabase('base', () => {
                const statusPage = new orders.StatusPage(orderId);
                common.login(username);
                statusPage.load();
                expect(statusPage.statusList.count()).toEqual(userDetails.statusListCount, 'status row count');

                for (let field of visibilityFields) {
                    let el = statusPage[field];
                    let expected = userDetails[field];

                    // test data sanity checks
                    expect(el).toBeDefined(`missing definition for ${field}`);
                    expect(expected).toBeDefined(`missing outcome for ${field}`);

                    // check field visibility
                    expect(el.isPresent()).toBe(expected, `Visibility: ${field}`);
                }
            }));
        });
    });
});
