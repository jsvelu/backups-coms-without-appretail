import _ from 'lodash';

export default app => {

    app.factory('OrderApiService', (ApiService) => {

        class OrderApi {

            getFeatures(seriesId, orderId) {

                return ApiService.getData('orders/series-items', {
                    series_id: seriesId,
                    order_id: orderId,
                });
            }

        }

        return new OrderApi();
    });
};