// Taken from https://github.com/bennadel/Bookmarklet-Get-Watch-Count
export default (app) => {

	// Taken from http://stackoverflow.com/a/18526757
	var watchCount1 = () => {
		var root = angular.element(document.getElementsByTagName('body'));

		var watchers = [];

		var f = function (element) {
			angular.forEach(['$scope', '$isolateScope'], function (scopeProperty) {
				if (element.data() && element.data().hasOwnProperty(scopeProperty)) {
					angular.forEach(element.data()[scopeProperty].$$watchers, function (watcher) {
						watchers.push(watcher);
					});
				}
			});

			angular.forEach(element.children(), function (childElement) {
				f(angular.element(childElement));
			});
		};

		f(root);

		// Remove duplicate watchers
		var watchersWithoutDuplicates = [];
		angular.forEach(watchers, function(item) {
			if(watchersWithoutDuplicates.indexOf(item) < 0) {
				 watchersWithoutDuplicates.push(item);
			}
		});

		return watchersWithoutDuplicates.length;
	};


	// Taken from https://github.com/bennadel/Bookmarklet-Get-Watch-Count
	// I return the count of watchers on the current page.
	var watchCount2 = () => {

		// Keep track of the total number of watch bindings on the page.
		var total = 0;

		// There are cases in which two different ng-scope markers will actually be referencing
		// the same scope, such as with transclusion into an existing scope (ie, cloning a node
		// and then linking it with an existing scope, not a new one). As such, we need to make
		// sure that we don't double-count scopes.
		var scopeIds = {};

		// AngularJS denotes new scopes in the HTML markup by appending the classes "ng-scope"
		// and "ng-isolate-scope" to appropriate elements. As such, rather than attempting to
		// navigate the hierarchical Scope tree, we can simply query the DOM for the individual
		// scopes. Then, we can pluck the watcher-count from each scope.
		// --
		// NOTE: Ordinarily, it would be a HUGE SIN for an AngularJS service to access the DOM
		// (Document Object Model). But, in this case, we're not really building a true AngularJS
		// service, so we can break the rules a bit.
		angular.forEach(
			document.querySelectorAll(".ng-scope , .ng-isolate-scope"),
			countWatchersInNode
		);

		return ( total );


		// ---
		// PRIVATE METHODS.
		// ---


		// I count the $watchers in to the scopes (regular and isolate) associated with the given
		// element node, and add the count to the running total.
		function countWatchersInNode(node) {

			// Get the current, wrapped element.
			var element = angular.element(node);

			// It seems that in earlier versions of AngularJS, the separation between the regular
			// scope and the isolate scope where not as strong. The element was flagged as having
			// an isolate scope (using the ng-isolate-scope class); but, there was no .isolateScope()
			// method before AngularJS 1.2. As such, in earlier versions of AngularJS, we have to
			// fall back to using the .scope() method for both regular and isolate scopes.
			if (element.hasClass("ng-isolate-scope") && element.isolateScope) {

				countWatchersInScope(element.isolateScope());

			}

			// This class denotes a non-isolate scope in later versions of AngularJS; but,
			// possibly an isolate-scope in earlier versions of AngularJS (1.0.8).
			if (element.hasClass("ng-scope")) {

				countWatchersInScope(element.scope());

			}

		}


		// I count the $$watchers in the given scope and add the count to the running total.
		function countWatchersInScope(scope) {

			// Make sure we're not double-counting this scope.
			if (scopeIds.hasOwnProperty(scope.$id)) {

				return;

			}

			scopeIds[scope.$id] = true;

			// The $$watchers value starts out as NULL until the first watcher is bound. As such,
			// the $$watchers collection may not exist yet on this scope.
			if (scope.$$watchers) {

				total += scope.$$watchers.length;

			}

		}
	};

	window.debugWatchCount = () => {
		return [watchCount1(), watchCount2()];
	};
};