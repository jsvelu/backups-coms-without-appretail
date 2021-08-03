import _ from 'lodash';

export default app => {

    app.factory('ApiService', (
        $filter,
        $http,
        $log,
        $q,
        AppSettings,
        debounce
    ) => {
        var debounceDeferred = {};
        /**
         * @param method: HTTP method
         * @param endpoint: site-relative URL
         * @param options:
         *  params - GET parameters
         *  data - HTTP request body data
         *  debounceKey - dictionary key to use for debouncing requests. Only valid for GET requests.
         *      if true, will use the endpoint as the key
         *  returnData - if true, will resolve with the response body data rather than the whole response request
         * @param ajax request promise
         */
        var wrappedHttp = (method, endpoint, {params=null, data='', debounceKey=false, debounceTimeout=1000, returnData=false} = {}) => {
            endpoint = '/api/' + endpoint;
            if (debounceKey === true) {
                if (params && (!_.isObject(params) || !_.isEmpty(params))) {    // {} needs to not match
                    alert('ERROR: Automatic debounceKey can only be used if empty params');
                    debounceKey = false;
                } else {
                    debounceKey = endpoint;
                }
            } else if (debounceKey && method != 'get') {
                alert('ERROR: Can only debounce GET requests');
                debounceKey = false;
            }

            $log.debug(method, endpoint, 'params:', params, 'data:', data, 'debounce?', debounceKey, debounceTimeout, 'return?', returnData);

            //if (['get', 'patch', 'post', 'put'].indexOf(method.toLowerCase()) == -1) {
            //    $log.error('Unexpected $http method type', method);
            //}

            const getAjaxPromise = () => $http({
                method: method.toUpperCase(),
                url: endpoint,
                params: params,
                data: data,
            });

            if (debounceKey) {
                if (!debounceDeferred[debounceKey]) {
                    let defer = $q.defer();

                    debounceDeferred[debounceKey] = {
                        defer: defer,
                        debouncedTriggeAjaxCall: debounce(debounceTimeout, () => {
                            return getAjaxPromise()
                                .finally(() => {
                                    // we want to hide the existing promise immediately away else
                                    // any invocations triggered by the current request will be
                                    // part of the current invocation and will immediately resolve
                                    // without doing anything
                                    delete debounceDeferred[debounceKey];
                                })
                                .then(
                                    (x) => {
                                        defer.resolve(x);
                                    },
                                    (x) => {
                                        defer.reject(x);
                                    },
                                    (x) => {
                                        defer.notify(x);
                                    }
                                );
                        }),
                    };
                }

                debounceDeferred[debounceKey].debouncedTriggeAjaxCall();
                //$log.debug('debounceDeferred', debounceDeferred[debounceKey]);
                var promise = debounceDeferred[debounceKey].defer.promise;
            } else {
                var promise = getAjaxPromise();
            }

            if (returnData) {
                promise = promise.then(value => value.data);
            }
            //$log.debug('promise', promise);
            return promise;
        };

        var f = () => alert('ApiService has changed; please use get() or post() explicitly');

        // The *Data() versions resolve with response.data rather than response
        f.getData   = (endpoint, params, options={}) => wrappedHttp('get', endpoint, _.assign({params: params, returnData: true}, options));
        f.get       = (endpoint, params) => wrappedHttp('get', endpoint, {params: params});
        f.patchData = (endpoint, data) => wrappedHttp('patch', endpoint, {data: data, returnData: true});
        f.patch     = (endpoint, data) => wrappedHttp('patch', endpoint, {data: data});
        f.postData  = (endpoint, data) => wrappedHttp('post', endpoint, {data: data, returnData: true});
        f.post      = (endpoint, data) => wrappedHttp('post', endpoint, {data: data});
        f.putData   = (endpoint, data) => wrappedHttp('put', endpoint, {data: data, returnData: true});
        f.put       = (endpoint, data) => wrappedHttp('put', endpoint, {data: data});

        // format a date for use in API calls
        f.formatDate = (date) => $filter('date')(date, AppSettings.FORMAT_DATE_ISO_JS);

        /**
         * Convert data coming in from an API into a date
         *
         * If data is not recognised, will return null
         * If data is already a Date will return the same object (you can call this multiple times on the
         *  same value and it won't cause problems)
         */
        f.parseDate = (val) => {
            if (_.isString(val)) {
                let x = Date.parse(val);
                return isNaN(x) ? null : new Date(x);
            }
            return val instanceof Date ? val : null;
        };

        /**
         * Helper function to convert dates returned from an API call into javascript dates
         *
         * Will modify the object properties in-place
         *
         * @param object API results object to convert
         * @param datePaths array of lodash paths to convert (simple property names are fine)
         *
         * @return object The original object
         */
        f.convertIncomingDates = (object, datePaths) => {
            for (let path of datePaths) {
                _.set(object, path, f.parseDate(_.get(object, path)));
            }
            return object;
        };

        return f;
    });

};