// proper ES6 exports
import angular from "angular";
import ngFileUpload from 'ng-file-upload';
import ngMessages from 'angular-messages';
import ngSanitize from 'angular-sanitize';  // for ui-select
import ngTouch from 'angular-touch';        // for angular-carousel
import ngCookies from 'angular-cookies';
import uiRouter from "angular-ui-router";
import uiRouterTabs from "angular-ui-router-tabs";


// no commonjs wrapper
import angularCarousel from 'angular-carousel';
import debounce from 'angular-debounce';
import uiBootstrap from "angular-ui-bootstrap/ui-bootstrap-tpls";
import uiSortable from "angular-ui-sortable";
import uiSelect from "ui-select";

var dependencies = [
    ngFileUpload,
    ngMessages,
    ngSanitize,
    ngTouch,
    ngCookies,
    uiRouter,
    uiRouterTabs,
    'angular-carousel',
    'rt.debounce',
    'ui.bootstrap',
    'ui.select',
    'ui.sortable',
];

var app = angular.module('NewAge', dependencies);

app.config((
    $httpProvider,
    $logProvider,
    $stateProvider,
    AppSettings
) => {
    $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';

    // Common routes between entry modules
    $stateProvider
        .state("denied", {
            url: "/denied",
            template: "Permission Denied",
        });

    $logProvider.debugEnabled(AppSettings.DEBUG);

    $httpProvider.interceptors.push( ($anchorScroll, $q, $rootScope, $timeout) => {
        return {
            'responseError': (response) => {

                let messageList = 'An error occurred.';
                if (response.data.message) {
                    messageList = response.data.message;
                }
                else if (response.status == 400 && response.data) {
                    messageList = response.data;
                }

                if (typeof(messageList) == typeof('')) {
                    messageList = [messageList];
                }

                // Adding an index because Angular repeater can't have duplicates
                if ($rootScope.message && $rootScope.message.type == 'alert-danger') {
                    // If a message is already being displayed, append the new message to the list

                    let start = $rootScope.message.message_list.length; // Starting index at list's current length
                    messageList = messageList.map( (message, index) => {return (index + 1 + start) + '- ' + message;});

                    $rootScope.message.message_list = $rootScope.message.message_list.concat(messageList);

                } else {

                    messageList = messageList.map( (message, index) => {return (index + 1) + '- ' + message;});

                    $rootScope.message = {type: 'alert-danger', message_list: messageList};
                }

                $anchorScroll('message-anchor');

                return $q.reject(response);
            }
        };
    });
});

app.run(function(
    $location,
    $rootScope,
    $state,
    $timeout,
    ApiService,
    AppSettings
) {
    /**
     * Get a field of the state object. Inherits values from parent states - child states take precedence.
     * @param stateName
     * @param fieldName
     * @returns {Object}
     */
    function getStateFieldInherited(stateName, fieldName) {
        let data = {};
        let parts = stateName.split('.');
        while (parts.length) {
            const stateData = $state.get(parts.join('.'));
            if (stateData && stateData[fieldName]) {
                data = angular.extend(angular.copy(stateData[fieldName]), data);
            }
            parts.pop();
        }
        return data;
    }

    $rootScope.$on('$stateChangeStart', function (event, toState) {
        if (toState.hasOwnProperty('require') && toState.require.hasOwnProperty('auth')) {
            ApiService.post('auth/', {url: '/newage/' + toState.require.auth}).then(response => {
                if (!response.data.permitted) {
                    event.preventDefault();
                    return $state.go('denied');
                }
            });
        }
        if (toState.hasOwnProperty('require') && toState.require.hasOwnProperty('default_sub_route')) {
            const default_route = toState.require.default_sub_route;
            if (toState.name == default_route[0]) {
                $timeout(()=>{$state.go(default_route[1]);});
            }
        }
    });

    $rootScope.AppSettings = AppSettings;  // required to access this constant from templates

    /**
    $rootScope.$on('$stateChangeStart',function(event, toState, toParams, fromState, fromParams){
      console.log('$stateChangeStart to '+toState.to+'- fired when the transition begins. toState,toParams : \n',toState, toParams);
        console.log('current url',  $location.$$path);

    });
    $rootScope.$on('$stateChangeError',function(event, toState, toParams, fromState, fromParams, error){
      console.log('$stateChangeError - fired when an error occurs during transition.');
      console.log(arguments);
    });
    $rootScope.$on('$stateChangeSuccess',function(event, toState, toParams, fromState, fromParams){
      console.log('$stateChangeSuccess to '+toState.name+'- fired once the state transition is complete.');
    });
    // $rootScope.$on('$viewContentLoading',function(event, viewConfig){
    //   // runs on individual scopes, so putting it in "run" doesn't work.
    //   console.log('$viewContentLoading - view begins loading - dom not rendered',viewConfig);
    // });
    $rootScope.$on('$viewContentLoaded',function(event){
      console.log('$viewContentLoaded - fired after dom rendered',event, $location);
    });
    $rootScope.$on('$stateNotFound',function(event, unfoundState, fromState, fromParams){
      console.log('$stateNotFound '+unfoundState.to+'  - fired when a state cannot be found by its name.');
      console.log(unfoundState, fromState, fromParams);
    });
     **/
});


require('./apps/shared/services')(app);
require('./apps/shared/directives')(app);
require('./apps/shared/filters')(app);

require('./apps/shared/debugWatchCount')(app);

module.exports = app;
