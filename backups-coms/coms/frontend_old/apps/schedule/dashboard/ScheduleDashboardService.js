export default app => {

    app.factory('ScheduleDashboardService', () => {

        class ScheduleDashboard {

            getSpecialFeatureClass(order) {
                if (order.special_feature_status == 'pending')
                    return 'glyphicon-question-sign';

                if (order.special_feature_status == 'approved')
                    return 'glyphicon-ok-sign';

                if (order.special_feature_status == 'rejected')
                    return 'glyphicon-remove-sign';

                return '';
            }

            isSameMonth(date1, date2) {
                return date1.getFullYear() == date2.getFullYear() && date1.getMonth() == date2.getMonth()
            }

            containsCaseInsensitive (str, substr) {
                return str.toLowerCase().indexOf(substr.toLowerCase()) != -1;
            }

        }

        return new ScheduleDashboard();
    });
};
