'use strict';

/* Services */

angular.module('uppSocial.services', [])

.factory('Request', function($http, $cookieStore, $q, api_info) {

	var Request = function(config, remove_token) {
		if (typeof this.config == 'undefined')
		{
			this.config = {
				base_url: api_info.url + '/' + api_info.version,
				params: {}
			};
		}
		else
		{
			this.config = config;
		}
	};

	Request.prototype.getConfig = function() {
		return this.config;
	};

	// Set current request method (GET, POST, PUT, DELETE)
	Request.prototype.setMethod = function(method) {
		this.getConfig().method = method;
	};

	// Add path to current base url
	Request.prototype.path = function(path) {
		this.getConfig().url = this.getConfig().base_url + path;
	};

	Request.prototype.addToken = function(token) {
		this.getConfig().headers = { 'X-Session-ID': token };
	};

	Request.prototype.addParam = function(param_name, param) {
		this.getConfig().params[param_name] = param;
	};

	Request.prototype.setData = function(data) {
		this.getConfig().data = data;
	};

	// Get elements from page @page
	Request.prototype.fromPage = function(page) {
		this.addParam('page', page);
	};

	// Add ?created_from and ?created_to
	Request.prototype.created_between = function(options) {
		if (options[0] !== null)
		{
			this.addParam('created_from', options[0]);
		}

		if (options[1] !== null)
		{
			this.addParam('created_to', options[1]);
		}
	};

	Request.prototype.updated_between = function(options) {
		if (options[0] !== null)
		{
			this.addParam('updated_from', options[0]);
		}

		if (options[1] !== null)
		{
			this.addParam('updated_to', options[1]);
		}
	};

	/* Status callbacks */
	Request.prototype.onSuccess = function(callback) {
		this.getConfig().success = callback;
	};

	Request.prototype.onError = function(callback) {
		this.getConfig().error = callback;
	};

	Request.prototype.hasOnSuccess = function() {
		return (typeof this.getConfig().success !== 'undefined');
	};

	Request.prototype.hasOnError = function() {
		return (typeof this.getConfig().error !== 'undefined');
	};

	Request.prototype.removeToken = function() {
		this.remove_token = true;
	};

	Request.prototype.checkUnvalidToken = function(http) {
		var that = this;

		http.error(function(data, status, headers) {
			if(status === 403)
			{
				$cookieStore.remove('session_id');
				$cookieStore.remove('user_id');

				window.location.reload();

				delete that.getConfig().error;
			}
		});
	};

	Request.prototype.make = function() {
		if (this.remove_token !== true) this.addToken($cookieStore.get('session_id'));	

		var http = $http(this.getConfig());

		this.checkUnvalidToken(http);

		return http;
	};

	// Let's save it! :-D
	Request.prototype.save = function() {
		this.setMethod('PUT');

		var http = this.make(), that = this;

		if (this.hasOnSuccess())
		{
			http.success(function(data, status, headers) {
				that.getConfig().success(data, status, headers);
			})
		}

		if (this.hasOnError())
		{
			http.error(function(data, status, headers) {
				that.getConfig().error(data, status, headers);
			});
		}
	};

	Request.prototype.create = function() {
		this.setMethod('POST');

		var http = this.make(), that = this;

		if (this.hasOnSuccess())
		{
			http.success(function(data, status, headers) {
				that.getConfig().success(data, status, headers);
			})
		}

		if (this.hasOnError())
		{
			http.error(function(data, status, headers) {
				that.getConfig().error(data, status, headers);
			});
		}
	};

	Request.prototype.get = function(d) {
		this.setMethod('GET');

		var http = this.make(), that = this;

		if (this.hasOnSuccess())
		{
			http.success(function(data, status, headers) {
				that.getConfig().success(data, status, headers);
			})
		}

		if (this.hasOnError())
		{
			http.error(function(data, status, headers) {
				that.getConfig().error(data, status, headers);
			});
		}
	};

	Request.prototype.delete = function() {
		this.setMethod('DELETE');

		var http = this.make(), that = this;

		if (this.hasOnSuccess())
		{
			http.success(function(data, status, headers) {
				that.getConfig().success(data, status, headers);
			})
		}

		if (this.hasOnError())
		{
			http.error(function(data, status, headers) {
				that.getConfig().error(data, status, headers);
			});
		}
	};

	return Request;
})

.factory('rUser', function(Request) {
	var user, user_s;

	var User = function(s) {
		if (typeof s == 'object')
		{
			user = s;
			user_s = {}; // empty object, all new data will be stored here for PUT/POST
		}

		// if @s is an id, it means we need to get a specific user
		if (typeof s == 'string' || typeof s == 'number')
		{
			user = {id: s};
		}
	};

	User.prototype.fetchAll = function(options) {
		var req = new Request();

		req.path('/users');
		req.fromPage(options.page);

		if (typeof options.search !== 'undefined' && options.search !== null && options.search !== '')
		{
			req.addParam('name_like', options.search);
		}

		if (typeof options.no_pagination !== 'undefined' && options.no_pagination == true)
		{
			req.addParam('as', 'collection');
		}

		// If it is still in page 1, it's not a "scrolling" request
		if (options.infiniteScrolling === true && options.page == 1)
		{
			options.infiniteScrolling = false;
		}

		req.onSuccess(function(data, status, headers) {
			if (options.infiniteScrolling !== true)
			{
				options.success(data.response);
			}
			else
			{
				if (data.pagination.next == null) {
					options.infiniteScrollingSuccess(data.response, true);

					return;
				}
				
				options.infiniteScrollingSuccess(data.response);
			}
		});

		req.onError(function() {
			alert('error! :-(');
		});

		req.get();
	};

	User.prototype.delete = function(options) {
		var req = new Request();

		req.path('/users/' + user.id);

		req.onSuccess(function(data, status, headers) {
			options.success(data.response);
		});

		req.onError(function() {
			alert('error! :-(');
		});

		req.delete();
	};

	return User;
})

.factory('rSubmissions', function(Request) {

	var submission, submission_s;

	var Submission = function(s, f) {
		if (typeof s == 'object')
		{
			submission = s;
			submission_s = {}; // empty object, all new data will be stored here for PUT/POST
		}

		// if @s is an id, it means we need to get a specific submission
		if (typeof s == 'string')
		{
			submission = {id: s, form_id: f};
		}
	};

	Submission.prototype.fetch = function(options) {
		var req = new Request();

		req.path('/forms/' + options.form + '/submissions');
		req.fromPage(options.page);

		if (typeof options.search !== 'undefined' && options.search !== null && options.search !== '')
		{
			req.addParam('identifier_like', options.search);
		}

		if (typeof options.user !== 'undefined' && options.user !== null)
		{
			req.path('/forms/' + options.form + '/users/' + options.user + '/submissions');
			req.addParam('as', 'paginated_collection');
		}

		if (typeof options.status !== 'undefined' && options.status !== null)
		{
			req.addParam('by_status', options.status);
		}

		if (typeof options.updated_between !== 'undefined')
		{
			req.updated_between(options.updated_between);
		}

		// If it is still in page 1, it's not a "scrolling" request
		if (options.infiniteScrolling === true && options.page == 1)
		{
			options.infiniteScrolling = false;
		}

		req.onSuccess(function(data, status, headers) {
			if (options.infiniteScrolling !== true)
			{
				options.success(data.response, data.pagination.count);
			}
			else
			{
				if (data.pagination.next == null) {
					options.infiniteScrollingSuccess(data.response, true, data.pagination.count);

					return;
				}
				
				options.infiniteScrollingSuccess(data.response, false, data.pagination.count);
			}
		});

		req.onError(function() {
			alert('error! :-(');
		});

		req.get();
	};

	Submission.prototype.get = function(options) {
		var req = new Request();

		req.path('/forms/' + submission.form_id + '/submissions/' + submission.id);

		req.onSuccess(function(data, status, headers) {
			options.success(data.response);
		});

		req.get();
	};

	Submission.prototype.set = function(key, value) {
		submission_s[key] = value;
	};

	Submission.prototype.save = function(success) {
		var req = new Request();

		req.path('/forms/' + submission.form_id + '/submissions/' + submission.id);
		req.setData(submission_s);

		req.onSuccess(function(data, status, headers) {
			success(data.response);
		});

		req.save();
	};

	Submission.prototype.delete = function(options) {
		var req = new Request();

		req.path('/submissions/' + submission.id);

		req.onSuccess(function(data, status, headers) {
			options.success(data.response);
		});

		req.delete();
	};

	Submission.prototype.reset = function(success) {
		var req = new Request();

		req.path('/forms/' + submission.form_id + '/submissions/' + submission.id + '/reset');
		req.setMethod('POST');

		var http = req.make();

		http.success(function(data, status, headers) {
			success(data.response);
		});
	};

	Submission.prototype.transfer = function(options) {
		var req = new Request();

		req.path('/forms/' + submission.form_id + '/submissions/transfer');
		req.setData({
			user_id_from: options.from,
			user_id_to: options.to
		});

		req.onSuccess(function(data, status, headers) {
			options.success(data.response);
		});

		req.create();
	};

	return Submission;
})

.factory('Statistics', function(Request) {

	var statistics;

	var Statistics = function(s) {
		if (typeof s == 'object')
		{
			statistics = s;
		}
	};

	Statistics.prototype.fetchGlobal = function(options) {
		var req = new Request();

		req.path('/statistics');

		req.onSuccess(function(data, status, headers) {
			options.success(data.response);
		});

		req.get();
	};

	Statistics.prototype.fetchForm = function(options) {
		var req = new Request();

		req.path('/forms/' + statistics.form_id + '/statistics');

		req.onSuccess(function(data, status, headers) {
			options.success(data.response);
		});

		req.get();
	};

	Statistics.prototype.fetchUser = function(options) {
		var req = new Request();

		req.path('/users/' + statistics.user_id + '/statistics');

		req.onSuccess(function(data, status, headers) {
			options.success(data.response);
		});

		req.get();
	};

	Statistics.prototype.fetchFormUser = function(options) {
		var req = new Request();

		req.path('/forms/' + statistics.form_id + '/users/' + statistics.user_id + '/statistics');

		req.onSuccess(function(data, status, headers) {
			options.success(data.response);
		});

		req.get();
	};

	return Statistics;
})

.factory('Logs', function(Request) {

	var log;

	var Logs = function(s) {
		if (typeof s == 'object')
		{
			log = s;
		}
	};

	Logs.prototype.fetchAll = function(options) {
		var req = new Request();

		req.path('/logs');
		req.fromPage(options.page);

		if (typeof options.updated_between !== 'undefined')
		{
			req.updated_between(options.updated_between);
		}

		if (typeof options.user !== 'undefined' && options.user !== null)
		{
			req.path('/users/' + options.user + '/logs');
			req.addParam('as', 'paginated_collection');
		}

		// If it is still in page 1, it's not a "scrolling" request
		if (options.infiniteScrolling === true && options.page == 1)
		{
			options.infiniteScrolling = false;
		}

		req.onSuccess(function(data, status, headers) {
			if (options.infiniteScrolling !== true)
			{
				options.success(data.response, data.count);
			}
			else
			{
				if (data.pagination.next == null) {
					options.infiniteScrollingSuccess(data.response, data.count, true);

					return;
				}
				
				options.infiniteScrollingSuccess(data.response, data.count);
			}
		});

		req.onError(function() {
			alert('error! :-(');
		});

		req.get();
	};

	return Logs;
})

.factory('Assignment', function(Request) {
	var assignment, assignment_s;

	var Assignment = function() {};

	Assignment.prototype.fetchAll = function(options) {
		var req = new Request();

		req.path('/forms/' + options.form_id + '/assignments');
		req.fromPage(options.page);

		// If it is still in page 1, it's not a "scrolling" request
		if (options.infiniteScrolling === true && options.page == 1)
		{
			options.infiniteScrolling = false;
		}

		req.onSuccess(function(data, status, headers) {
			if (options.infiniteScrolling !== true)
			{
				options.success(data.response);
			}
			else
			{
				if (data.pagination.next == null) {
					options.infiniteScrollingSuccess(data.response, true);

					return;
				}
				
				options.infiniteScrollingSuccess(data.response);
			}
		});

		req.onError(function() {
			alert('error! :-(');
		});

		req.get();
	};

	return Assignment;
})

.factory('Exports', function(Request) {

	var _export;

	var Export = function(s) {
		// if @s is an id, it means we need to get a specific submission
		if (typeof s == 'string')
		{
			_export = {id: s};
		}
	};

	Export.prototype.fetch = function(options) {
		var req = new Request();

		req.path('/exports');

		req.onSuccess(function(data, status, headers) {
			options.success(data.response);
		});

		req.onError(function() {
			alert('error! :-(');
		});

		req.get();
	};

	Export.prototype.getProgress = function(options) {
		var req = new Request();

		req.path('/export/progress/' + options.job_id);

		req.onSuccess(function(data, status, headers) {
			options.success(data.response);
		});

		req.onError(function() {
			console.log('Não foi possível buscar o progresso da exportação. Por favor, tente novamente.');
			options.error();
		});

		req.get();
	};

	Export.prototype.create = function(options) {
		var req = new Request();

		var data = {};

		switch (options.method)
		{
			case 'users':
				req.path('/users/export/csv');

				if (typeof options.role !== 'undefined' && options.role !== null)
				{
					data.by_role = options.role;
				}
			break;

			case 'forms':
				req.path('/forms/export/csv');
			break;

			case 'fields':
				req.path('/fields/export/csv');
			break;

			case 'submissions':
				req.path('/forms/' + options.form_id + '/submissions/export/csv');

				if (typeof options.status !== 'undefined' && options.status !== null)
				{
					data.by_status = options.status;
				}

				if (typeof options.updated_between !== 'undefined')
				{
					if (options.updated_between[0] !== null)
					{
						data.updated_from = options.updated_between[0];
					}

					if (options.updated_between[1] !== null)
					{
						data.updated_to = options.updated_between[1];
					}
				}
			break;

			case 'answers':
				req.path('/forms/' + options.form_id + '/submissions/answers/export/csv');

				if (typeof options.status !== 'undefined' && options.status !== null)
				{
					data.by_status = options.status;
				}

				if (typeof options.updated_between !== 'undefined')
				{
					if (options.updated_between[0] !== null)
					{
						data.updated_from = options.updated_between[0];
					}

					if (options.updated_between[1] !== null)
					{
						data.updated_to = options.updated_between[1];
					}
				}
			break;
		}

		if (typeof options.include_header !== 'undefined' && options.include_header !== null)
		{
			data.include_header = options.include_header;
		}

		req.setData(data);

		req.onSuccess(function(data, status, headers) {
			options.success(data.response.job_id);
		});

		req.onError(function(data, status, headers) {
			options.error();
		});

		req.create();
	};

	Export.prototype.delete = function(options) {
		var req = new Request();

		req.path('/exports/' + _export.id);

		req.onSuccess(function(data, status, headers) {
			options.success(data.response);
		});

		req.delete();
	};

	return Export;
})

/* To-do: refactor code below */
.factory('API', function($http, $cookieStore, api_info) {
	return function(method, url, pass_token, data, file_upload) {
		var config = {
			method: method,
			url: api_info.url + '/' + api_info.version + url,
			params: {ver: Math.random()}
		};

		if(typeof pass_token == "undefined" || pass_token === true) {
			config.headers = { 'X-Session-ID': $cookieStore.get('session_id') };
		}

		if(typeof data !== "undefined") {
			config.data = data;
		}

		return $http(config);
	};
})
.factory('Auth', function(API, $cookieStore, $rootScope, $location) {
	var user = {
		id: null,
		logged: false
	};

	var session_id_cookie = $cookieStore.get('session_id'), user_id_cookie = $cookieStore.get('user_id');

	return {
		login: function(userData, success, error) {
			var that = this;

			API('POST', '/session', false, userData).success(function(data, status, headers) {
				$cookieStore.put('session_id', data.response.session_id);
				$cookieStore.put('user_id', data.response.user_id);

				session_id_cookie = data.response.session_id;
				user_id_cookie = data.response.user_id;

				that.getUserInfo(function() {
					success();
				}, function() {
					console.log('error data validation');
				});
			}).error(function() {
				error();
			});
		},

		isLogged: function() {
			return this.getUser().logged;
		},

		getUser: function() {
			return user;
		},

		checkCookies: function(callback) {
			if (typeof (session_id_cookie) !== "undefined" && typeof (user_id_cookie) !== "undefined" && this.getUser().id == null)
			{
				this.getUserInfo(function() {
					callback();
				}, function() {
					callback();
				});
			}
			else
			{
				callback();
			}
		},

		getUserInfo: function(success, error) {
			API('GET', '/users/' + user_id_cookie).success(function(data, status, headers) {
				
				// Set basic user data
				user = data.response;
				user.logged = true;


				console.log(user);

				$rootScope.user = user;

				success(data);
			}).error(function() {
				error();
			});
		},

		logout: function(success) {
			API('DELETE', '/session/').success(function(data, status, headers) {
				$cookieStore.remove('session_id');
				$cookieStore.remove('user_id');
				session_id_cookie = undefined;
				user_id_cookie = undefined;

				// Reset user
				user = {
					id: null,
					access: 0,
					logged: false
				};

				if (typeof success !== 'undefined') success();
			}).error(function() {
				// :(
			});
		}
	}
})
.factory('Users', function(API) {
	return {
		getAll: function(success, error) {
			API('GET', '/users?as=collection').success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error();
			});
		},

		get: function(id, success, error) {
			API('GET', '/users/' + id).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error();
			});
		},

		create: function(data, success, error) {
			API('POST', '/users', true, data).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error(data);
			});
		},

		update: function(id, data, success, error) {
			API('PUT', '/users/' + id, true, data).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error(data);
			});
		},

		delete: function(id, success, error) {
			API('DELETE', '/users/' + id).success(function(data, status, headers) {
				success();
			}).error(function() {
				error();
			});
		}
	}
})
.factory('Application', function(API) {
	return {
		fetch: function(success, error) {
			API('GET', '/application').success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error();
			});
		},

		update: function(data, success, error) {
			API('PUT', '/application', true, data).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error(data);
			});
		},
	}
})
.factory('Texts', function(API) {
	return {
		getAll: function(success, error) {
			API('GET', '/texts').success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error();
			});
		},

		get: function(id, success, error) {
			API('GET', '/texts/' + id).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error();
			});
		},

		create: function(data, success, error) {
			API('POST', '/texts', true, data).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error(data);
			});
		},

		update: function(id, data, success, error) {
			API('PUT', '/texts/' + id, true, data).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error(data);
			});
		},

		delete: function(id, data, success, error) {
			API('DELETE', '/texts/' + id).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				success(data);
			});
		}
	}
})
.factory('Forms', function(API) {
	
	var available_inputs = {
		TextField: {
			name: 'Texto',
			can_edit_options: false,
			available_layouts: [
				{name: 'Pequeno', type: 'small'},
				{name: 'Médio', type: 'medium'},
				{name: 'Grande', type: 'big'},
			],
			available_validations: []
		},

		DatetimeField: {
			name: 'Data',
			can_edit_options: false,
			available_layouts: [
				{name: 'Pequeno', type: 'small'},
				{name: 'Médio', type: 'medium'},
				{name: 'Grande', type: 'big'},
			],
			available_validations: []
		},

		CpfField: {
			name: 'CPF',
			can_edit_options: false,
			available_layouts: [
				{name: 'Pequeno', type: 'small'},
				{name: 'Médio', type: 'medium'},
				{name: 'Grande', type: 'big'},
			],
			available_validations: []
		},

		CheckboxField: {
			name: 'Múltipla escolha',
			can_edit_options: true,
			available_layouts: [
				{name: 'Coluna única', type: 'single_column'},
				{name: 'Múltiplas colunas', type: 'multiple_columns'},
			],
			available_validations: []
		},

		EmailField: {
			name: 'E-mail',
			can_edit_options: false,
			available_layouts: [
				{name: 'Pequeno', type: 'small'},
				{name: 'Médio', type: 'medium'},
				{name: 'Grande', type: 'big'},
			],
			available_validations: []
		},

		PrivateField: {
			name: 'Privado',
			can_edit_options: false,
			available_layouts: [
				{name: 'Pequeno', type: 'small'},
				{name: 'Médio', type: 'medium'},
				{name: 'Grande', type: 'big'},
			],
			available_validations: []
		},

		NumberField: {
			name: 'Somente número',
			can_edit_options: false,
			available_layouts: [
				{name: 'Pequeno', type: 'small'},
				{name: 'Médio', type: 'medium'},
				{name: 'Grande', type: 'big'},
			],
			available_validations: []
		},

		OrderedlistField: {
			name: 'Lista ordenada',
			can_edit_options: true,
			available_layouts: [
			],
			available_validations: []
		},

		RadioField: {
			name: 'Opção',
			can_edit_options: true,
			available_layouts: [
				{name: 'Coluna única', type: 'single_column'},
				{name: 'Múltiplas colunas', type: 'multiple_columns'},
			],
			available_validations: []
		},

		UrlField: {
			name: 'URL',
			can_edit_options: false,
			available_layouts: [
				{name: 'Pequeno', type: 'small'},
				{name: 'Médio', type: 'medium'},
				{name: 'Grande', type: 'big'},
			],
			available_validations: []
		},

		SelectField: {
			name: 'Lista',
			can_edit_options: true,
			available_layouts: [],
			available_validations: []
		},

		LabelField: {
			name: 'Subtexto',
			can_edit_options: false,
			available_layouts: [
			],
			available_validations: []
		},

		DinheiroField: {
			name: 'Valor (R$)',
			can_edit_options: false,
			available_layouts: [],
			available_validations: []
		}
	};

	return {
		getAll: function(success, error) {
			API('GET', '/forms?as=collection').success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error();
			});
		},

		get: function(id, success, error) {
			API('GET', '/forms/' + id).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error();
			});
		},

		create: function(data, success, error) {
			API('POST', '/forms', true, data).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error(data);
			});
		},

		update: function(id, data, success, error) {
			API('PUT', '/forms/' + id, true, data).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error(data);
			});
		},

		delete: function(id, success, error) {
			API('DELETE', '/forms/' + id).success(function(data, status, headers) {
				success();
			}).error(function() {
				error();
			});
		},

		/* assignments */
		get_all_assignments: function(id, success, error) {
			API('GET', '/forms/' + id + '/assignments?as=collection').success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error();
			});
		},

		create_assignment: function(form_id, data, success, error) {
			API('POST', '/forms/' + form_id + '/assignments', true, data).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error(data);
			});
		},

		update_assignment: function(form_id, id, data, success, error) {
			API('PUT', '/forms/' + form_id + '/assignments/' + id, true, data).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error(data);
			});
		},

		delete_assignment: function(form_id, id, success, error) {
			API('DELETE', '/forms/' + form_id + '/assignments/' + id).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error(data);
			});
		},

		/* stop reasons */
		create_reason: function(form_id, data, success, error) {
			API('POST', '/forms/' + form_id + '/stop_reasons', true, data).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error(data);
			});
		},

		delete_reason: function(form_id, id, success, error) {
			API('DELETE', '/forms/' + form_id + '/stop_reasons/' + id).success(function(data, status, headers) {
				success();
			}).error(function(data, status, headers) {
				error();
			});
		},

		/* form sessions */
		update_sections: function(form_id, data, success, error) {
			API('PUT', '/forms/' + form_id + '/sections', true, data).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error(data);
			});
		},

		create_section: function(form_id, data, success, error) {
			API('POST', '/forms/' + form_id + '/sections', true, data).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error(data);
			});
		},

		update_section: function(form_id, id, data, success, error) {
			API('PUT', '/forms/' + form_id + '/sections/' + id, true, data).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error(data);
			});
		},

		delete_section: function(form_id, id, success, error) {
			API('DELETE', '/forms/' + form_id + '/sections/' + id).success(function(data, status, headers) {
				success();
			}).error(function(data, status, headers) {
				error();
			});
		},

		/* form fields inside sections */
		update_section_fields: function(form_id, section_id, data, success, error) {
			API('PUT', '/forms/' + form_id + '/sections/' + section_id + '/fields', true, data).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error(data);
			});
		},

		create_section_field: function(form_id, section_id, data, success, error) {
			API('POST', '/forms/' + form_id + '/sections/' +  section_id + '/fields', true, data).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error(data);
			});
		},

		update_section_field: function(form_id, section_id, id, data, success, error) {
			API('PUT', '/forms/' + form_id + '/sections/' + section_id + '/fields/' + id, true, data).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error(data);
			});
		},

		delete_section_field: function(form_id, section_id, id, success, error) {
			API('DELETE', '/forms/' + form_id + '/sections/' + section_id + '/fields/' + id).success(function(data, status, headers) {
				success();
			}).error(function(data, status, headers) {
				error();
			});
		},

		import_csv: function(form_id, job_id, data, success, error) {
			API('POST', '/forms/' + form_id + '/import_csv/' +  job_id, true, data).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error(data);
			});
		},

		getAvailableInputs: function() {
			return available_inputs;
		},
	}
})
.factory('Submissions', function(API) {
	return {
		getPage: function(page, form_id, success, error) {
			API('GET', '/forms/' + form_id + '/submissions?page=' + page).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error();
			});
		},

		get: function(form_id, id, success, error) {
			API('GET', '/forms/' + form_id + '/submissions/' + id).success(function(data, status, headers) {
				success(data);
			}).error(function() {
				error(data);
			});
		},
	}
})
.factory('Options', function(API) {
	var available_texts_for_inject = {
		br_states: [
			'Acre',
			'Alagoas',
			'Amazonas',
			'Amapá',
			'Bahia',
			'Ceará',
			'Distrito Federal',
			'Espírito Santo',
			'Goiás',
			'Maranhão',
			'Minas Gerais',
			'Mato Grosso do Sul',
			'Mato Grosso',
			'Pará',
			'Paraíba',
			'Pernambuco',
			'Piauí',
			'Paraná',
			'Rio de Janeiro',
			'Rio Grande do Norte',
			'Rondônia',
			'Roraima',
			'Rio Grande do Sul',
			'Santa Catarina',
			'Sergipe',
			'São Paulo',
			'Tocantins'
		]
	};

	return {
		getOptionsForInject: function(var_name)
		{
			return available_texts_for_inject[var_name];
		}
	}
});
