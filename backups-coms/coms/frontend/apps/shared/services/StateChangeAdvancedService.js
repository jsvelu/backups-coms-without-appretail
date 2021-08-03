import _ from 'lodash';

export default app => {

    app.factory('StateChangeAdvancedService', (/*$urlRouterProvider*/) => {
        var self = {};

        self.go = ($state, $stateParams, newArgs) => {
            $state.go($state.current,
                newArgs
                //{ location: 'replace' }
            );
        };

        self.goNoReload = ($state, $stateParams, newArgs) => {
            /**
             * Change parameters & URL for the current state without actually reloading
             *
             * see https://github.com/angular-ui/ui-router/issues/64
             *
             * Obvious limitations apply since controllers are not reloaded
             * (ie must share data between nested scopes by using angoNoReload object,
             * not a scalar)
             *
             * At present this is pretty unreliable, in particular it seems to not
             * let nested routes know about scope changes from the parent
             *
             */
            if (!newArgs) return;
            _.assign($stateParams, newArgs);
            $state.go($state.current,
                newArgs,
                {notify: false, reload: false, location: 'replace'}
            );
        };

        return self;
    });
};