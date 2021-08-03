export default app => {

    app.directive('topBar', function () {
        return {
            restrict: 'E',
            transclude: true,
            template: require('./partials/top-bar.html'),
        };
    });

    app.directive('requiredField', function () {
        return {
            restrict: 'E',
            scope: {
                form: '=',
                name: '=',
                label: '@'
            },
            template: `
                <div ng-messages="name.$error" ng-if="form.$submitted && form.$invalid">
                    <p ng-message="required">{{label}} is required</p>
                </div>
            `
        };
    });

    app.directive('dateDropdowns', function () {
        return {
            restrict: 'AE',
            require: 'ngModel',
            scope: {
                prefixDirective: '=',
                model: '=ngModel',
                futureOnly: '=',
            },
            template: require('./partials/date.html'),
            replace: true,
            link: function (scope, element, attr, ngModel) {

                scope.days = [];
                scope.months = [];
                scope.years = [];

                let now = new Date();
                for (let i = 1; i <= 31; i++) {
                    scope.days.push(i);
                }
                const month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                for (let i = 0; i < 12; i++) {
                    scope.months.push([i, month_names[i]]);
                }
                for (let i = 0; i <= 20; i++) {
                    scope.years.push(now.getFullYear() + i);
                }

                const isFuture = () => {
                    let today = new Date();
                    today.setHours(0);
                    today.setMinutes(0);
                    today.setSeconds(0);
                    if ((new Date(scope.year, scope.month, scope.day).getTime()) < today.getTime()) {
                        return false;
                    }
                    return true;
                };

                const isValid = () => {
                    if (typeof scope.day === 'undefined' || scope.day === null ||
                        typeof scope.month === 'undefined' || scope.month === null ||
                        typeof scope.year === 'undefined' || scope.year === null) {
                        return false;
                    }
                    return true;
                };

                ngModel.$validators.validDate = isValid;
                ngModel.$validators.futureDate = isFuture;

                scope.$watch('model',  value => {
                    if (value) {
                        let [year, month, day] = (value || "").split('-');
                        scope.day = parseInt(day);
                        scope.month = parseInt(month) - 1;
                        scope.year = parseInt(year);
                        scope.onDateChange();
                    }
                });

                scope.onDateChange = () => {
                    let valid = isValid();
                    ngModel.$setValidity('validDate', valid);
                    if (valid && scope.futureOnly) {
                        valid = isFuture();
                        ngModel.$setValidity('futureDate', valid);
                    }
                    if (!valid) {
                        scope.model = null;
                        return;
                    }
                    scope.model = [scope.year, scope.month + 1, scope.day].join("-");
                };
            }
        };
    });

    app.directive('redStar', function () {
        return {
            restrict: 'E',
            template: '<span class="red-star">*</span>'
        };
    });

    app.directive('onFinishRender', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, element, attr) {
                console.log(attr.onFinishRender);
                if (scope.$last === true) {
                    $timeout(function () {
                        scope.$emit(attr.onFinishRender);
                    });
                }
            }
        };
    });

    app.directive('lookup', function ($timeout, ApiService) {
        return {
            restrict: 'E',
            scope: {
                result: '=',
                onSelect: '=',
                placeholder: '@',
                type: '@',
                getExtraData:'=',
                minLength: '=',
                minWait: '=',
                url: '@',
                ngDisabled: '=',
            },
            template: `
                <div class="form-group has-feedback lookup">
                <i class="glyphicon glyphicon-search form-control-feedback" ng-show="!loading"></i>
                <img class="form-control-feedback" src="/static/newage/images/rolling.gif" ng-show="loading">
                <input type="text" autocomplete="off"
                                ng-model="result"
                                ng-disabled="{{ngDisabled}}"
                                placeholder="{{placeholder}}"
                                uib-typeahead="result.id as result.title for result in lookup($viewValue)"
                                typeahead-loading="loading"
                                typeahead-no-results="no_results"
                                typeahead-min-length="minLength"
                                typeahead-wait-ms="minWait"
                                typeahead-on-select="lookupSelect($item)"
                                class="form-control lookup">
                                <div ng-show="no_results"><i class="glyphicon glyphicon-remove"></i> No Results Found</div>
                </div>
            `,
            link: function (scope) {
                scope.loading = false;
                scope.no_results = false;
                if (scope.url === undefined) {
                    scope.url = 'common/';
                }

                scope.lookup = text => {
                    let data  = {};
                    if (typeof scope.getExtraData === 'function') {
                        data = scope.getExtraData();
                    }
                    data.type = scope.type;
                    data.filter = text;
                    scope.loading = true;
                    scope.no_results = false;
                    return ApiService.post(scope.url, data).then(r => {
                            scope.loading = false;
                            if (r.data.list.length) {
                                return r.data.list;
                            }
                            scope.no_results = true;
                        }
                    );
                };

                scope.lookupSelect = item => {
                    scope.result = item;
                    if (typeof scope.onSelect === 'function') {
                        scope.onSelect(item);
                    }
                };
            }
        };
    });


    app.directive('chassisLookup', function ($timeout, ApiService) {
        return {
            restrict: 'E',
            scope: {
                order: '=',
                onSelect: '=',
            },
            template: `<input id="chassisLookup" type="text"
                                ng-model="order"
                                placeholder="Chassis"
                                uib-typeahead="result.id as result.title for result in lookupChassis($viewValue)"
                                typeahead-loading="loading"
                                typeahead-no-results="no_results"
                                typeahead-on-select="onChassisSelect($item, $model, $label)"
                                class="form-control">
                                <bar-spinner ng-show="loading"></bar-spinner>
                                <div ng-show="no_results"><i class="glyphicon glyphicon-remove"></i> No Results Found</div>`,
            link: function (scope) {
                scope.loading = false;
                scope.no_results = false;

                scope.lookupChassis = text => {
                    scope.loading = true;
                    scope.no_results = false;

                    return ApiService.post('common/', {
                        type: 'chassis_lookup',
                        chassis_string: text
                    }).then(r => {
                            scope.loading = false;
                            if (r.data.list.length) {
                                return r.data.list;
                            }
                            scope.no_results = true;
                        }
                    );
                };

                scope.onChassisSelect = item => {
                    scope.order = item;
                    if (typeof scope.onSelect === 'function') {
                        scope.onSelect(item);
                    }
                };
            }
        };
    });

    app.directive('barSpinner', function () {
        return {
            restrict: 'E',
            template: `
                <div class="spinner">
                    <div class="rect1"></div>
                    <div class="rect2"></div>
                    <div class="rect3"></div>
                    <div class="rect4"></div>
                    <div class="rect5"></div>
                </div>`
        };
    });

    app.directive('formAutofillFix', function() {
        return function(scope, elem, attrs) {
        // Fixes Chrome bug: https://groups.google.com/forum/#!topic/angular/6NlucSskQjY
        elem.prop('method', 'POST');

        // Fix autofill issues where Angular doesn't know about autofilled inputs
        if(attrs.ngSubmit) {
          setTimeout(function() {
            elem.unbind('submit').submit(function(e) {
              e.preventDefault();
              elem.find('input, textarea, select').trigger('input').trigger('change').trigger('keydown');
              scope.$apply(attrs.ngSubmit);
            });
          }, 0);
        }
      };
    });


    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    function sameOrigin(url) {
        // test that a given url is a same-origin URL
        // url could be relative or scheme relative or absolute
        var host = document.location.host; // host + port
        var protocol = document.location.protocol;
        var sr_origin = '//' + host;
        var origin = protocol + sr_origin;
        // Allow absolute or scheme relative URLs to same origin
        return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
            (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
                // or any other URL that isn't scheme relative or absolute i.e relative.
            !(/^(\/\/|http:|https:).*/.test(url));
    }

    var csrftoken = getCookie('csrftoken');

    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!csrfSafeMethod(settings.type) && sameOrigin(settings.url)) {
                // Send the token to same-origin, relative URLs only.
                // Send the token only if the method warrants CSRF protection
                // Using the CSRFToken value acquired earlier
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    app.directive('ajaxDataTable', function ($timeout) {
        return {
            restrict: 'E',
            template: `
            <table class="table">
            <thead>
            </thead>
            </table>`,
            scope: {
                config: '=',
                options: '=',
                table: '=',
                onDraw: '=',
            },
            link: function (scope, element, attr) {

                let config = {
                    ajax: {
                        url: scope.config.url,
                        dataSrc: scope.config.dataSrc,
                        data: scope.config.data,
                        type: 'POST',
                    },
                    columns: scope.config.columns,
                };

                if (scope.options != undefined) {
                    for (let key of
                    Object.keys(scope.options)
                    )
                    {
                        config[key] = scope.options[key];
                    }
            }

                scope.table = $(element).find('table').DataTable(config);

                scope.table.on('draw.dt', () => {
                    if (typeof scope.onDraw === 'function') {
                        scope.onDraw(scope.table);
                    }
                });
            }
        };
    });

    app.directive('stringToNumber', function() {
        return {
            require: 'ngModel',
            link: function(scope, element, attrs, ngModel) {
                ngModel.$parsers.push(function(value) {
                    if (value === null) {
                        return null;
                    }
                    return '' + value;
                });
                ngModel.$formatters.push(function(value) {
                    return parseFloat(value, 10);
                });
            }
        };
    });

    app.directive('noDirtyCheck', function() {
        // Interacting with input elements having this directive won't cause the
        // form to be marked dirty.
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, elm, attrs, ctrl) {
                elm.focus(function () {
                    ctrl.$pristine = false;
                });
            }
        }
    });

    app.directive('messages', () => {
       return {
           restrict: 'E',
           template: `  <span id="message-anchor"></span>
                        <div class="messages">
                            <div ng-if="errorMessages.length > 0" class="alert alert-danger">
                                <div ng-repeat="text in errorMessages">{{ text }}</div>
                            </div>
                            <br />
                            <div ng-if="successMessages.length > 0" class="alert alert-success">
                                <div ng-repeat="text in successMessages">{{ text }}</div>
                            </div>
                        </div>`,
       }
    });

    app.directive('focusMe', function($timeout) {
        return {
            scope: { trigger: '@focusMe' },
            link: function(scope, element) {
                scope.$watch('trigger', (value) => {
                    if (value) {
                        $timeout(() => { element[0].focus(); });
                    }
                });
            }
        };
    });

    app.directive('truncate', function() {
        return {
            restrict: 'A',
            scope: {
                truncateTitle: '=',
            },
            link: function(scope, element, attrs) {
                element.addClass('truncate');
                scope.$watch(
                    function() {
                        return element.text();
                    },
                    function(value) {
                        if (element.innerWidth() < element.prop('scrollWidth')) {
                            element.attr('title', scope.truncateTitle);
                        } else {
                            element.removeAttr('title');
                        }
                    }
                );
            }
        }
    });
}
