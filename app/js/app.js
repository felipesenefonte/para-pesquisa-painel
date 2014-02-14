'use strict';

// Declare app level module which depends on filters, and services
angular.module('uppSocial', ['uppSocial.filters', 'uppSocial.services', 'uppSocial.directives', 'uppSocial.controllers', 'ngCookies', 'ui.date', 'angularFileUpload', 'infinite-scroll'])
	.value('api_info', api_info)
	.config(['$routeProvider', '$httpProvider', function($routeProvider, $httpProvider, $timeout) {

		// Routing
		$routeProvider.when('/', {
			templateUrl: 'partials/login.html',
			controller: 'LoginCtrl',
			mustBeLogged: false
		});
		
		$routeProvider.when('/dashboard', {
			templateUrl: 'partials/statistics.html',
			controller: 'StatisticsCtrl',
			mustBeLogged: true
		});

		$routeProvider.when('/user/logout', {
			templateUrl: 'partials/user/logout.html',
			controller: 'UserLogoutCtrl',
			mustBeLogged: true
		});

		/* Exports */
		$routeProvider.when('/exports', {
			templateUrl: 'partials/exports/list.html',
			controller: 'ExportsCtrl',
			mustBeLogged: true
		});

		/* Users */
		$routeProvider.when('/users', {
			templateUrl: 'partials/users/list.html',
			controller: 'UsersCtrl',
			mustBeLogged: true
		});

		$routeProvider.when('/users/edit/:userId', {
			templateUrl: 'partials/users/edit.html',
			controller: 'UsersEditCtrl',
			mustBeLogged: true
		});

		$routeProvider.when('/users/edit/:userId/statistics', {
			templateUrl: 'partials/statistics.html',
			controller: 'StatisticsCtrl',
			mustBeLogged: true
		});

		$routeProvider.when('/users/create', {
			templateUrl: 'partials/users/edit.html',
			controller: 'UsersEditCtrl',
			mustBeLogged: true
		});

		$routeProvider.when('/users/delete/:userId', {
			templateUrl: 'partials/users/delete.html',
			controller: 'UsersDeleteCtrl',
			mustBeLogged: true
		});

		/* configs */
		$routeProvider.when('/configs', {
			templateUrl: 'partials/configs/list.html',
			controller: 'ConfigsCtrl',
			mustBeLogged: true
		});

		/* logs */
		$routeProvider.when('/logs', {
			templateUrl: 'partials/logs/list.html',
			controller: 'LogsCtrl',
			mustBeLogged: true
		});

		/* texts */
		$routeProvider.when('/texts/edit/:textId', {
			templateUrl: 'partials/texts/edit.html',
			controller: 'TextsEditCtrl',
			mustBeLogged: true
		});

		$routeProvider.when('/texts/create', {
			templateUrl: 'partials/texts/edit.html',
			controller: 'TextsEditCtrl',
			mustBeLogged: true
		});

		$routeProvider.when('/texts/delete/:textId', {
			templateUrl: 'partials/texts/delete.html',
			controller: 'TextsDeleteCtrl',
			mustBeLogged: true
		});

		/* forms */
		$routeProvider.when('/forms', {
			templateUrl: 'partials/forms/main.html',
			controller: 'FormsCtrl',
			mustBeLogged: true
		});

		$routeProvider.when('/forms/list', {
			templateUrl: 'partials/forms/list.html',
			controller: 'FormsListCtrl',
			mustBeLogged: true
		});

		$routeProvider.when('/forms/create', {
			templateUrl: 'partials/forms/edit.html',
			controller: 'FormsEditCtrl',
			mustBeLogged: true
		});

		$routeProvider.when('/forms/edit/:formId', {
			templateUrl: 'partials/forms/edit.html',
			controller: 'FormsEditCtrl',
			mustBeLogged: true
		});

		$routeProvider.when('/forms/edit/:formId/assignments', {
			templateUrl: 'partials/forms/assignments.html',
			controller: 'FormsListAssignmentsCtrl',
			mustBeLogged: true
		});

		$routeProvider.when('/forms/edit/:formId/statistics', {
			templateUrl: 'partials/statistics.html',
			controller: 'StatisticsCtrl',
			mustBeLogged: true
		});

		$routeProvider.when('/forms/edit/:formId/users/:userId/statistics', {
			templateUrl: 'partials/statistics.html',
			controller: 'StatisticsCtrl',
			mustBeLogged: true
		});

		$routeProvider.when('/forms/edit/:formId/submissions', {
			templateUrl: 'partials/forms/submissions/list.html',
			controller: 'FormsSubmissionsListCtrl',
			mustBeLogged: true
		});

		$routeProvider.when('/forms/edit/:formId/submissions/:submissionId', {
			templateUrl: 'partials/forms/submissions/view.html',
			controller: 'FormsSubmissionsViewCtrl',
			mustBeLogged: true
		});

		$routeProvider.when('/forms/edit/:formId/submissions/user/:userId', {
			templateUrl: 'partials/forms/submissions/list.html',
			controller: 'FormsSubmissionsListCtrl',
			mustBeLogged: true
		});

		$routeProvider.when('/forms/delete/:formId', {
			templateUrl: 'partials/forms/delete.html',
			controller: 'FormsDeleteCtrl',
			mustBeLogged: true
		});

		/* others */
		$routeProvider.when('/404', {
			templateUrl: 'partials/404.html',
			controller: '404Ctrl',
			mustBeLogged: false
		});
		
		$routeProvider.otherwise({
			redirectTo: '/404'
		});

		// SHITTY CORS
		$httpProvider.defaults.useXDomain = true;
		delete $httpProvider.defaults.headers.common['X-Requested-With'];
		$httpProvider.defaults.withCredentials = true;

		// Check if server returns 401 (unvalid token)
		var interceptor = ['$location', '$q', '$cookieStore', function($location, $q, $cookieStore) {
			function success(response)
			{
				return response;
			}

			function error(response) {
				if(response.status === 403)
				{
					$cookieStore.remove('session_id');
					$cookieStore.remove('user_id');
					
					window.location.reload();
				}
				else
				{
					return $q.reject(response);
				}
			}

			return function(promise)
			{
				return promise.then(success, error);
			}
		}];

		//$httpProvider.responseInterceptors.push(interceptor);
	}])
	.run(['$rootScope', '$location', 'Auth', function ($rootScope, $location, Auth) {
		
		$rootScope.showLogin = false;
		$rootScope.showLoading = false;
		$rootScope.renderingPage = true;

		$rootScope.$on('$routeChangeStart', function (event, next, current) {
			Auth.checkCookies(function() {
				if (next.mustBeLogged == true && !Auth.isLogged())
				{
					$location.path('/');
				}

				if (Auth.isLogged() && next.controller == 'LoginCtrl')
				{
					// We have to set showLogin to false after LoginCtrl sets it to true
					$rootScope.showLogin = false;
					$location.path('/dashboard');
				}

				// Check if user role is API
				if (Auth.isLogged() && Auth.getUser().role !== 'api')
				{
					Auth.logout();
					$location.path('/404');
				}

				// When leave 404 page, hide login page layout
				if (typeof current !== 'undefined' && current.controller == '404Ctrl')
				{
					$rootScope.showLogin = false;
				}

				$rootScope.renderingPage = false;
			});

			$rootScope.$on('$routeChangeSuccess', function (event, next, current) {
				$rootScope.sidebar = null;
			});

			// Empty menus
			$rootScope.submenu = [];
			$rootScope.sidemenu = [];
		});
	}]);