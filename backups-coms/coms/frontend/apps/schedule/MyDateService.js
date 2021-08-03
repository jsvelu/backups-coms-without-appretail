export default app => {

    app.factory('MyDateService', () => {

        class MyDateService1 {

            getCurrent() {
                date1 = new Date();
                return date1;
            }

            containsCaseInsensitive(str, substr) {
                return str.toLowerCase().indexOf(substr.toLowerCase()) != -1;
            }

        }

        return new ScheduleDashboard();
    });
};