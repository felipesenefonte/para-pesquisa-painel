'use strict';

/* Controllers */

angular.module('uppSocial.controllers', [])

/** 
	@name Login page
	@url #/
*/
.controller('LoginCtrl', ['$http', '$scope', '$rootScope', '$location', 'API', 'Auth', function($http, $scope, $rootScope, $location, API, Auth) {
	$rootScope.showLogin = true;

	$scope.login = function() {
		NProgress.start();

		Auth.login({
			username: $scope.username,
			password: $scope.password
		},
		function(res) {
			NProgress.done();
			$rootScope.showLogin = false;
			$location.path('/dashboard');
		},
		function(err) {
			NProgress.done();
			$scope.loginError = true;
		});
	};

}])

/** 
	@name Logout user
	@url #/user/logout
*/
.controller('UserLogoutCtrl', ['$location', '$rootScope', 'Auth', function($location, $rootScope, Auth) {
	Auth.logout(function() {
		$rootScope.showLogin = true;
		$location.path('/');
	});
}])

/** 
	@name Statistics
	@url #/dashboard
*/
.controller('StatisticsCtrl', ['$rootScope', '$routeParams', '$scope', 'Statistics', function($rootScope, $routeParams, $scope, Statistics) {
	var form_id = $routeParams.formId, user_id = $routeParams.userId, page = 'global';

	// Let's set page based on routeParams
	if (typeof form_id !== 'undefined' && typeof user_id !== 'undefined')
	{
		page = 'form_user';
	}
	else if (typeof form_id !== 'undefined')
	{
		page = 'form';
	}
	else if (typeof user_id !== 'undefined')
	{
		page = 'user';
	}

	NProgress.start();
	$rootScope.showLoading = true;

	var options = {
		success: function(data) {
			
			$scope.waiting_approval = data.waiting_approval;
			$scope.waiting_correction = data.waiting_correction;
			$scope.approved = data.approved;
			$scope.canceled = data.canceled;
			$scope.rescheduled = data.rescheduled;
			
			var extra_data = [
				{
					name: 'Total de pesquisas',
					count: data.total,
				},

				{
					name: 'Total de pesquisas preenchidas',
					count: data.total_filled,
				},

				{
					name: 'Pesquisas não iniciadas',
					count: data.pending
				},

				{
					name: 'Número de questionários',
					count: data.form_count,
				},

				{
					name: 'Número de usuários',
					count: data.user_count,
				}
			];

			if (page == 'form_user')
			{
				$scope.title = 'do usuário "' + data.user.name + '" no questionário "' + data.form.name + '"';
			}
			else if (page == 'form')
			{
				$scope.title = 'do questionário "' + data.form.name + '"';
			}
			else if (page == 'user')
			{
				$scope.title = 'do usuário "' + data.user.name + '"" (Todos os Formulários)';
			}
			else
			{
				$scope.title = 'globais';
			}

			// Now we organize the "extra data"
			$scope.available_colors = ['', 'color2', 'color3', 'color4'];
			$scope.infos = [];
			var next_available_color = 0;

			for (var i = extra_data.length - 1; i >= 0; i--) {
				if (typeof extra_data[i].count != 'undefined')
				{
					var obj = {
						name: extra_data[i].name,
						count: extra_data[i].count,
						color: next_available_color
					};

					next_available_color++;

					$scope.infos.push(obj);
				}
			};

			// percentage
			var sizes = {
				approved_size: (parseInt(data.approved) / parseInt(data.total_filled)) * 100,
				waiting_approval_size: (parseInt(data.waiting_approval) / parseInt(data.total_filled)) * 100,
				waiting_correction_size: (parseInt(data.waiting_correction) / parseInt(data.total_filled)) * 100,
				reschdule_size: (parseInt(data.rescheduled) / parseInt(data.total_filled)) * 100,
				canceled_size: (parseInt(data.canceled) / parseInt(data.total_filled)) * 100
			};

			for (var x in sizes) {
				if (sizes[x] < 15)
				{
					sizes[x] = 20;
				}
				else
				{
					sizes[x] = sizes[x] * 2;
				}

				if (sizes[x] >= 100)
				{
					sizes[x] = 90;
				}
			};

			var objects = [
				{
					name: 'approved',
					size: sizes.approved_size,
					pos: (100 - sizes.approved_size) / 2
				},

				{
					name: 'waiting_approval',
					size: sizes.waiting_approval_size,
					pos: (100 - sizes.waiting_approval_size) / 2
				},

				{
					name: 'waiting_correction',
					size: sizes.waiting_correction_size,
					pos: (100 - sizes.waiting_correction_size) / 2
				},

				{
					name: 'reschdule',
					size: sizes.reschdule_size,
					pos: (100 - sizes.reschdule_size) / 2
				},

				{
					name: 'canceled',
					size: sizes.canceled_size,
					pos: (100 - sizes.canceled_size) / 2
				},
			];

			// Change graph's size
			
			for (var i = objects.length - 1; i >= 0; i--) {
				$('.chart.' + objects[i].name + ' .inner').css({
					width: objects[i].size,
					height: objects[i].size,
					top: objects[i].pos,
					left: objects[i].pos
				});
			};

			NProgress.done();
			$rootScope.showLoading = false;
		}
	};

	if (page == 'form_user')
	{
		var stats = new Statistics({ form_id: form_id, user_id: user_id });

		stats.fetchFormUser(options);
	}
	else if (page == 'form')
	{
		var stats = new Statistics({ form_id: form_id });

		stats.fetchForm(options);
	}
	else if (page == 'user')
	{
		var stats = new Statistics({ user_id: user_id });

		stats.fetchUser(options);
	}
	else
	{
		var stats = new Statistics();

		stats.fetchGlobal(options);
	}
}])

/** 
	@name List exports
	@url #/exports
*/
.controller('ExportsCtrl', ['$scope', '$rootScope', 'Forms', 'Exports', function($scope, $rootScope, Forms, Exports) {
	$scope.form_id = null;
	$scope.status = null;
	$scope.period = null;
	$scope.created_from = null;
	$scope.created_to = null;
	$scope.method = null;
	$scope.forms = null;
	$scope.include_header = true;
	$scope.progress = null;
	$scope.job_id = null;

	var _export = new Exports(), was_running = false;

	var update = function(was_run) {
		if (typeof was_run != 'undefined')
		{
			was_running = was_run;
		}

		_export.fetch({
			success: function(data) {
				$scope.last_answers_export = data.last_answers_export;
				$scope.last_users_export = data.last_users_export;
				$scope.last_forms_export = data.last_forms_export;
				$scope.last_fields_export = data.last_fields_export;
				$scope.last_submissions_export = data.last_submissions_export;

				$scope.job_id = data.running_job_id;
				
				if ($scope.forms == null)
				{
					Forms.getAll(function(data) {
						$scope.forms = data.response;
					}, function(err) {

					});
				}

				// Hide loading
				$rootScope.showLoading = false;
				NProgress.done();
				
				if ($scope.job_id == null)
				{
					if (was_running != false)
					{
						_export.getProgress({
							job_id: was_running,
							success: function(data) {
								$scope.progress = data;
							}
						});

						was_running = false;
					}
				}
				else
				{
					_export.getProgress({
						job_id: $scope.job_id,
						success: function(data) {
							$scope.progress = data;
							was_running = $scope.job_id;

							setTimeout(function() {
								update();
								console.log('wow');
							}, 6000);
						},
						error: function() {
							update();
							NProgress.done();
						}
					});
				}
			}
		});
	};

	// Start this shit!
	NProgress.start();
	$rootScope.showLoading = true;
	update();
	$scope.update = update;

	$scope.selectDateFilter = function(period) {
		var created_from = null, created_to = null;
		$scope.custom_date_search = false;

		var update = function(created_from, created_to) {
			if (typeof created_from != 'undefined')
			{
				$scope.created_from = created_from;
			}
			
			if (typeof created_to != 'undefined')
			{
				$scope.created_to = created_to;
			}
		};
		
		if (period == 'today')
		{
			created_from = new Date();
			created_from.setHours(0, 0, 0, 0); // midnight
			created_from = created_from.toISOString();

			// created_to not needed
			update(created_from, null);
		}

		if (period == 'this_week')
		{
			created_from = new Date();
			created_from.setHours(0, 0, 0, 0); // midnight
			created_from = new Date(created_from.setDate(created_from.getDate() - created_from.getDay())); // this week
			created_from = created_from.toISOString();

			// created_to not needed
			update(created_from, null);
		}

		if (period == 'this_month')
		{
			created_from = new Date();
			created_from.setHours(0, 0, 0, 0); // midnight
			created_from = new Date(created_from.getFullYear(), created_from.getMonth(), 1); // this month
			created_from = created_from.toISOString();

			// created_to not needed
			update(created_from, null);
		}

		if (period == 'this_year')
		{
			created_from = new Date();
			created_from.setHours(0, 0, 0, 0); // midnight
			created_from = new Date(created_from.getFullYear(), 0, 1); // this year :O
			created_from = created_from.toISOString();

			// created_to not needed
			update(created_from, null);
		}

		if (period == 'custom')
		{
			$scope.custom_date_search = true;

			// Set jQuery UI datepicker options
			$scope.dateOptions = {
				showOtherMonths: true,
				selectOtherMonths: true,
				dateFormat: 'dd/mm/yy',
				onSelect: function(dateText) {
					// Call save after selecting a date
					update();

					return;
				}
			};
		}

		$scope.period = period;
	};

	$scope.selectStatusFilter = function(status) {
		$scope.status = status;
	};

	$scope.export = function() {
		$scope.progress = null;

		var options = {method: $scope.method, include_header: $scope.include_header};

		// answers, users, forms, fields, submissions
		switch ($scope.method)
		{
			case 'users':
				options.role = $scope.role;
			break;

			case 'submissions':
				options.form_id = $scope.form_id;
				options.updated_between = [$scope.created_from, $scope.created_to];
				options.status = $scope.status;

				if (options.form_id == null)
				{
					alert('Por favor, selecione um formulário.');
					return;
				}
			break;

			case 'answers':
				options.form_id = $scope.form_id;
				options.updated_between = [$scope.created_from, $scope.created_to];
				options.status = $scope.status;

				if (options.form_id == null)
				{
					alert('Por favor, selecione um formulário.');
					return;
				}
			break;
		}

		options.success = function(job_id) {
			$scope.job_id = job_id;
			update(job_id);
		};

		options.error = function() {
			alert('Houve um erro ao iniciar a exportação. Provavelmente o sistema já está trabalhando na exportação de algum outro arquivo. Tente novamente.');
		};

		_export.create(options);

		/*
			console.log('method', $scope.method);
			console.log('form_id', $scope.form_id);
			console.log('status', $scope.status);
			console.log('created_from', $scope.created_from);
			console.log('created_to', $scope.created_to);
		*/
	};
}])

/** 
	@name Users list
	@url #/users
*/
.controller('UsersCtrl', ['$scope', '$rootScope', 'rUser', function($scope, $rootScope, rUser) {
	$rootScope.showLoading = true;
	$scope.page = 1;
	$scope.waiting = false;
	$scope.end = false;

	var user = new rUser();

	$scope.fetchUsers = function(reset) {
		if (reset === true) $scope.end = false;

		if ($scope.waiting === false && $scope.end === false)
		{
			// used when applying a filter
			if (reset === true)
			{
				$scope.page = 1;
				$rootScope.showLoading = true;
			}

			NProgress.start();
			$scope.waiting = true;

			user.fetchAll({
				page: $scope.page,
				search: $scope.q,
				infiniteScrolling: true,
				success: function(users) {
					$scope.users = users;

					$scope.page++;

					// Hide loading
					$rootScope.showLoading = false;
					NProgress.done();
					$scope.waiting = false;
				},
				infiniteScrollingSuccess: function(users, disable_infinite_scrolling) {
					// Add each new user to the list
					for (var i = 0; i < users.length; i++) {
						$scope.users.push(users[i]);
					};

					$scope.page++;

					if (disable_infinite_scrolling === true)
					{
						$scope.end = true;
					}

					// Hide loading
					NProgress.done();
					$scope.waiting = false;
				}
			});
		}
	};

	$scope.deleteUser = function() {
		NProgress.start();

		var user = new rUser($scope.delete_id);

		user.delete({
			success: function() {
				$scope.fetchUsers(true);
			}
		});
	};
}])

/** 
	@name Edit or add user
	@url #/users/(edit|create)/{id?}
*/
.controller('UsersEditCtrl', ['$scope', '$rootScope', '$routeParams', 'Users', '$http', '$cookieStore', 'api_info', function($scope, $rootScope, $routeParams, Users, $http, $cookieStore, api_info) {
	var id = $routeParams.userId, updating = true;

	if (typeof id === "undefined")
	{
		updating = false;
	}

	$scope.available_roles = [{name: 'Coordenador', value: 'mod'}, {name: 'Pesquisador', value: 'agent'}, {name: 'Administrador', value: 'api'}];
	$scope.user = {};
	$scope.updating = updating;

	if (updating === true)
	{
		$rootScope.showLoading = true;
		NProgress.start();

		Users.get(id, function(data) {
			// Hide loading
			$rootScope.showLoading = false;
			NProgress.done();

			$scope.user = data.response;
		}, function(err) {

		});
	}

	$scope.onFileSelect = function($files) {
		NProgress.start();

		for (var i = 0; i < $files.length; i++) {
			
			var $file = $files[i];
			
			$http.uploadFile({
				url: api_info.url + '/' + api_info.version +'/users/' + id + '/avatar',
				method: 'POST',
				headers: { 'X-Session-ID': $cookieStore.get('session_id') },
				data: {'avatar': $file},
			}).then(function(data, status, headers, config) {
				NProgress.done();

				$('#avatar_edit').css('background-image', 'url(' + data.data.response.avatar + ')');
			}); 
		}
	};

	$scope.send = function() {
		var formattedObj = {
			'name' : $scope.user.name,
			'username' : $scope.user.username,
			'role' : $scope.user.role,
			'email' : $scope.user.email
		};

		if (updating === false)
		{
			formattedObj.password = $scope.user.password;

			Users.create(formattedObj, function(data) {
				$scope.user.id = data.response.user_id;
				$scope.showMessage = 'success';
			}, function(data) {
				$scope.showMessage = 'error';
			});
		}
		else
		{
			if (typeof $scope.user.password !== "undefined")
			{
				formattedObj.password = $scope.user.password;
			}

			Users.update(id, formattedObj, function(data) {
				$scope.showMessage = 'success';
			}, function(data) {
				$scope.showMessage = 'error';
			});
		}
	}
}])

/** 
	@name List app configs
	@desc It gets /app/texts for editing
	@url #/users
*/
.controller('ConfigsCtrl', ['$scope', '$rootScope', 'API', 'Texts', 'Application', '$http', '$cookieStore', 'api_info', function($scope, $rootScope, API, Texts, Application, $http, $cookieStore, api_info) {
	var items_loaded = 0;

	// Show loading
	$rootScope.showLoading = true;
	NProgress.start();

	var hideLoading = function() {
		if (items_loaded !== 2) return false;

		$rootScope.showLoading = false;
		NProgress.done();
	};

	// Get application details
	Application.fetch(function(data) {
		$scope.application = data.response;

		// Set header_url as background and delete it so it will not update in a PUT request
		if (data.response.header_url !== null)
		{
			$('#header_image').css('background-image', 'url(' + api_info.url + data.response.header_url + ')');
		}
		delete $scope.application.header_url;

		items_loaded++;

		hideLoading();
	}, function(err) {

	});

	// And all the texts :D
	Texts.getAll(function(data) {
		$scope.texts = data.response;
		items_loaded++;

		hideLoading();
	}, function(err) {

	});

	// Header file upload
	$scope.onFileSelect = function($files) {
		NProgress.start();
		$('#header_image').addClass('loading');

		for (var i = 0; i < $files.length; i++) {
			
			var $file = $files[i];
			
			$http.uploadFile({
				url: api_info.url + '/' + api_info.version +'/application',
				method: 'POST',
				headers: { 'X-Session-ID': $cookieStore.get('session_id') },
				data: {'header': $file},
			}).then(function(data, status, headers, config) {

				Application.fetch(function(data) {
					// Set header_url as background and delete it so it will not update in a PUT request
					if (data.response.header_url !== null)
					{
						$('#header_image').css('background-image', 'url(' + api_info.url + data.response.header_url + ')');
					}

					NProgress.done();
					$('#header_image').removeClass('loading');
				}, function(err) {

				});

				console.log(data);
			}); 
		}
	};

	$scope.removeImage = function() {
		NProgress.start();
		$('#header_image').addClass('loading');

		Application.update({ header: null }, function(data) {
			$('#header_image').removeClass('loading');
			$('#header_image').css('background-image', '');

			NProgress.done();
		}, function(err) {
		});
	};

	$scope.updateApplication = function() {
		NProgress.start();

		Application.update($scope.application, function(data) {
			$scope.showMessage = 'success';

			NProgress.done();
		}, function(err) {
			$scope.showMessage = 'error';
		});
	};
}])

/** 
	@name Edit or add system texts
	@url #/texts/(edit|create)/{id?}
*/
.controller('TextsEditCtrl', ['$scope', '$rootScope', '$routeParams', 'Texts', function($scope, $rootScope, $routeParams, Texts) {
	var id = $routeParams.textId, updating = true;

	if (typeof id === "undefined")
	{
		updating = false;
	}

	$scope.text = {};
	$scope.updating = updating;

	tinymce.init({
		selector:'textarea',
		language: 'pt_BR',
	});

	if (updating === true)
	{
		$rootScope.showLoading = true;
		NProgress.start();

		Texts.get(id, function(data) {
			// Hide loading
			$rootScope.showLoading = false;
			NProgress.done();

			$scope.text = data.response;
			tinymce.get('inputContent').setContent($scope.text.content)
		}, function(err) {

		});
	}

	$scope.send = function() {
		var formattedObj = {
			'title' : $scope.text.title,
			'subtitle' : $scope.text.subtitle,
			'content' : tinymce.get('inputContent').getContent()
		};

		if (updating === false)
		{
			Texts.create(formattedObj, function(data) {
				$scope.text.id = data.response.text_id;
				$scope.showMessage = 'success';
			}, function(data) {
				$scope.showMessage = 'error';
			});
		}
		else
		{
			Texts.update(id, formattedObj, function(data) {
				$scope.showMessage = 'success';
			}, function(data) {
				$scope.showMessage = 'error';
			});
		}
	}
}])

/** 
	@name Delete system text
	@url #/texts/delete/{id}
*/
.controller('TextsDeleteCtrl', ['$scope', '$routeParams', 'Texts', function($scope, $routeParams, Texts) {
	var id = $routeParams.textId;

	$scope.deleteText = function() {
		Texts.delete(id, function(data) {
			$scope.showMessage = 'success';
		}, function(data) {
			$scope.showMessage = 'success';
		});
	}
}])

/** 
	@name Form action selection
	@url #/forms
*/
.controller('FormsCtrl', [function() {

}])

/** 
	@name List forms
	@url #/forms/list
*/
.controller('FormsListCtrl', ['$rootScope', '$scope', 'Forms', function($rootScope, $scope, Forms) {
	var updateForms = function() {
		Forms.getAll(function(data) {
			$scope.forms = data.response;
			
			// Hide loading
			$rootScope.showLoading = false;
			NProgress.done();
		}, function(err) {

		});
	};

	$rootScope.showLoading = true;
	NProgress.start();
	updateForms();

	$scope.deleteForm = function() {
		NProgress.start();

		Forms.delete($scope.delete_id, function(data) {
			updateForms();
		}, function(data) {
			alert('Não foi possível remover o formulário.');
		});
	};
}])

.controller('FormsListAssignmentsCtrl', ['$scope', '$rootScope', '$routeParams', 'Assignment', 'rSubmissions', function($scope, $rootScope, $routeParams, Assignment, rSubmissions) {
	var form_id = $routeParams.formId;

	$rootScope.showLoading = true;
	$scope.page = 1;
	$scope.waiting = false;
	$scope.end = false;
	$scope.form_id = form_id;

	var assignment = new Assignment();

	$scope.fetchAssignments = function(reset) {
		if (reset === true) $scope.end = false;

		if ($scope.waiting === false && $scope.end === false)
		{
			// used when applying a filter
			if (reset === true)
			{
				$scope.page = 1;
				$rootScope.showLoading = true;
			}

			NProgress.start();
			$scope.waiting = true;

			assignment.fetchAll({
				page: $scope.page,
				form_id: form_id,
				infiniteScrolling: true,
				success: function(assignments) {
					$scope.assignments = assignments;

					$scope.page++;

					// Hide loading
					$rootScope.showLoading = false;
					NProgress.done();
					$scope.waiting = false;
				},
				infiniteScrollingSuccess: function(assignments, disable_infinite_scrolling) {
					// Add each new user to the list
					for (var i = 0; i < assignments.length; i++) {
						$scope.assignments.push(assignments[i]);
					};

					$scope.page++;

					if (disable_infinite_scrolling === true)
					{
						$scope.end = true;
					}

					// Hide loading
					NProgress.done();
					$scope.waiting = false;
				}
			});
		}
	};

	$scope.transferSubmissions = function(to, callback) {
		var submission = new rSubmissions({form_id: form_id});

		submission.transfer({
			from: $scope.transfer_info.id,
			to: to,
			success: function() {
				callback();
			}
		});

		console.log(form_id, 'form');
		console.log($scope.transfer_info.id, 'from user');
		console.log(to, 'to user');

		callback();
	};
}])

/** 
	@name Create or edit form
	@url #/users/(edit|create)/{id?}
*/
.controller('FormsEditCtrl', ['$rootScope', '$routeParams', '$scope', '$timeout', 'Forms', 'API', 'api_info', '$http', '$cookieStore', function($rootScope, $routeParams, $scope, $timeout, Forms, API, api_info, $http, $cookieStore) {
	var id = $routeParams.formId, updating = true;

	// LION KING HEEEEEEEEEEEAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
	var form = {
		id: null,
		name: null,
		subtitle: null,
		pub_start: null,
		pub_end: null,
		max_reschedules: 0,
		restricted_to_users: false,
		allow_transfer: true,
		
		/*stop_reasons: [],
		users: [],
		sections: []*/
	};

	if (typeof id === "undefined")
	{
		updating = false;
	}
	else
	{
		form.id = id;
	}

	var assignments = [];

	$scope.updateForm = function() {
		NProgress.start();

		var loadedForms = false, loadedAssignments = false;

		Forms.get(form.id, function(data) {
			// Hide loading
			$rootScope.showLoading = false;
			NProgress.done();

			form = data.response;
			$scope.form = form;

			// Now let's make inputs "available"
			if (form.pub_start !== null)
			{
				$scope.publishing = true;
			}

			if (form.pub_end !== null)
			{
				$scope.end = true;
			}

		}, function(err) {

		});

		Forms.get_all_assignments(form.id, function(data) {
			assignments = data.response;
			$scope.assignments = assignments;
		}, function(err) {

		});
	};

	// Get form if is editing
	if (updating === true)
	{
		$rootScope.showLoading = true;
		$scope.updateForm();
	}

	var pages = ['page_one', 'page_two', 'page_three', 'page_four'], current_page = 0;

	var tabs = ['Padrão', 'Especial'],
		current_tab = 0,
		tab_items = [
			[
				{type: 'TextField'},
				{type: 'DatetimeField'},
				{type: 'CheckboxField'},
				{type: 'PrivateField'},
				{type: 'NumberField'},
				{type: 'OrderedlistField'},
				{type: 'RadioField'},
				{type: 'SelectField'}
			],

			[
				{type: 'CpfField'},
				{type: 'EmailField'},
				{type: 'UrlField'},
				{type: 'LabelField'},
				{type: 'DinheiroField'}
			]
		];

	$scope.form = form;
	$scope.assignments = assignments;
	$scope.current_page = pages[current_page];

	// Set jQuery UI datepicker options
	$scope.dateOptions = {
		showOtherMonths: true,
		selectOtherMonths: true,
		dateFormat: 'dd/mm/yy',
		onSelect: function(dateText) {
			// Call save after selecting a date
			$scope.saveForm();
		}
	};

	// pass default "reason" for rescheduling
	$scope.reasonReschedule = 'true';

	// do not show .csv headers options before uploading file
	$scope.showImportOptions = false;
	$scope.showImportLog = false;

	// tabs
	$scope.current_tab = current_tab;
	$scope.tabs = tabs
	$scope.tab_items = tab_items;

	// every popover available
	$scope.popovers = [];

	// simple save
	$scope.save = function() {
		return console.log(form);
	};

	$scope.saveForm = function() {
		if (form.id !== null)
		{
			NProgress.start();

			Forms.update(form.id, form, function(data) {
				NProgress.done();
			}, function(err) {

			});

			return true;
		}
		else
		{
			// If we have form.id === null, it means we need to create a new form :D
			if (form.name === null || form.name == '')
			{
				alert('Você precisa digitar um título para conseguir criar um formulário.');
				return false;
			}

			NProgress.start();

			Forms.create(form, function(data) {
				NProgress.done();

				form.id = data.response.form_id;
			}, function(err) {

			});

			return true;
		}
	};

	// page navigation
	$scope.nextPage = function() {
		if (form.name == null) {
			alert('Oops! Para prosseguir, por favor, digite um título. Ele é necessário para salvar alterações do formulário.');

			return false;
		}

		$scope.current_page = pages[current_page + 1];
		current_page++;

		// fix this
		if (current_page == 3) {
			$(window).scroll(function(e) {
				$scope.scrollableInputsList(e);
			});

			$scope.scrollableInputsList();
		}
	}

	$scope.prevPage = function() {
		$scope.current_page = pages[current_page - 1];
		current_page--;
	}

	$scope.toPage = function(page) {
		if (form.name == null) {
			alert('Oops! Para prosseguir, por favor, digite um título. Ele é necessário para salvar alterações do formulário.');

			return false;
		}

		$scope.current_page = page;
		current_page = pages.indexOf(page);

		// Fix this
		if (current_page == 3) {
			$(window).scroll(function(e) {
				$scope.scrollableInputsList(e);
			});

			$timeout(function() {
				$scope.scrollableInputsList();
			}, 200);
		}
	}


	// stop reasons modal
	$scope.showAddReasons = function() {
		var modal = $('#reasons_modal').modal('show');
	};

	$scope.addReason = function() {
		var reschedule = false;

		if ($scope.reasonReschedule == 'true')
		{
			reschedule = true;
		}

		var reason = { reason: $scope.reasonName, reschedule: reschedule };

		if (form.id !== null)
		{
			NProgress.start();

			Forms.create_reason(form.id, reason, function(data) {
				NProgress.done();

				reason.id = data.response.reason_id;

				if (typeof form.stop_reasons == 'undefined')
				{
					form.stop_reasons = [];
				}

				form.stop_reasons.push(reason);
			}, function(err) {
				alert('Não foi possível adicionar um novo motivo.');
			});

			$scope.reasonName = '';
		}
		else
		{
			alert('Você não pode adicionar motivos sem ter criado um formulário. Tente digitar um título ao formulário.');
		}
	};

	$scope.deleteReason = function(option) {
		if (form.id !== null)
		{
			NProgress.start();

			Forms.delete_reason(form.id, option.id, function() {
				NProgress.done();

				form.stop_reasons.splice(form.stop_reasons.indexOf(option), 1);
			}, function() {
				alert('Não foi possível remover o motivo.');
			});
		}
		else
		{
			alert('Você não pode remover motivos sem ter criado um formulário. Tente digitar um título ao formulário.');
		}
	};

	// Header file upload
	$scope.sendFile = function($files) {
		$scope.importing = true;
		NProgress.start();

		for (var i = 0; i < $files.length; i++) {
			
			var $file = $files[i];
			
			$http.uploadFile({
				url: api_info.url + '/' + api_info.version +'/forms/' + form.id + '/parse_csv',
				method: 'POST',
				headers: { 'X-Session-ID': $cookieStore.get('session_id') },
				data: {'file': $file},
			}).success(function(data, status, headers, config) {
				$scope.importing = false;
				NProgress.done();

				$scope.showImportOptions = true;

				$scope.csv = {
					headers: data.response.header_columns,
					job_id: data.response.job_id
				};
			}).error(function(data, status, headers, config) {
				if (status == 500)
				{
					alert('O .csv importado não está no formato correto. Por favor, altere-o para UTF-8.');
					$scope.importing = false;
					NProgress.done();
				}
			});
		}
	};

	$scope.saveCsv = function() {

		var data = {
			grouping: $scope.csv.current_grouping,
			substitution: $scope.csv.current_substitution,
			identifier: $scope.csv.current_identifier
		};

		if (typeof $scope.csv.current_grouping == 'undefined' || $scope.csv.current_grouping == null || $scope.csv.current_grouping == "")
		{
			alert('Selecione a opção 3, por favor.');
		}
		/*else if (typeof $scope.csv.identifier == 'undefined' || $scope.csv.identifier == null || $scope.csv.identifier == "")
		{
			alert('Selecione a opção 2, por favor.');
		}*/
		else
		{
			NProgress.start();

			Forms.import_csv(form.id, $scope.csv.job_id, data, function(data) {
				$scope.updateForm();

				$scope.showImportLog = true;

				$scope.failed_imports = data.response.failed_imports;
				$scope.successful_imports = data.response.successful_imports;
			});
		}

	};

	$scope.updateAssignmentQuota = function(assignment) {
		var assignment = assignments[assignments.indexOf(assignment)];

		NProgress.start();

		Forms.update_assignment(form.id, assignment.id, { 'quota': assignment.quota }, function(data) {
			NProgress.done();
		}, function(err) {
			alert('Ocorreu um erro ao tentar atualizar o limite de submissões.');
		});
	};

	$scope.deleteAssignment = function(assignment) {
		var assignment = assignments[assignments.indexOf(assignment)];

		NProgress.start();

		Forms.delete_assignment(form.id, assignment.id, function(data) {
			NProgress.done();

			assignments.splice(assignments.indexOf(assignment), 1);
		}, function(err) {

		});
	};

	// change input's list tab
	$scope.changeTab = function(tab) {
		current_tab = tabs.indexOf(tab);
		$scope.current_tab = tabs.indexOf(tab);
	};

	$scope.addSection = function() {
		var section = {
			id: null,
			name: 'Nova página sem título',
			order: null,
			fields: [],

			showSectionTitleInput: false,
			focusEditSectionTitle: false,
		};

		if (form.id !== null)
		{
			NProgress.start();

			Forms.create_section(form.id, section, function(data) {
				NProgress.done();

				section.id = data.response.section_id;

				if (typeof form.sections == 'undefined')
				{
					form.sections = [];
				}

				form.sections.push(section);
			}, function(err) {
				alert('Não foi possível criar a seção. Tente novamente, por favor.');
			});
		}
		else
		{
			alert('Você não pode remover motivos sem ter criado um formulário. Tente digitar um título ao formulário.');
		}
	};

	$scope.deleteSection = function(section) {
		if (confirm('Tem certeza que você deseja remover esta seção?'))
		{
			if (section.id !== null)
			{
				NProgress.start();

				Forms.delete_section(form.id, section.id, function() {
					NProgress.done();

					form.sections.splice(form.sections.indexOf(section), 1);
				}, function() {
					alert('Não foi possível remover o motivo.');
				});
			}
			else
			{
				alert('Você não pode atualiza uma seção sem ela ter um ID. Atualize a página.');
			}
		}
	};

	$scope.toggleEditSectionTitle = function(section) {
		if (section.showSectionTitleInput === true)
		{
			if (section.id !== null)
			{
				NProgress.start();

				Forms.update_section(form.id, section.id, section, function(data) {
					NProgress.done();
				}, function(err) {
					alert('Não foi possível editar a seção. Tente novamente, por favor.');
				});
			}
			else
			{
				alert('Você não pode atualiza uma seção sem ela ter um ID. Atualize a página.');
			}

			section.showSectionTitleInput = false;
			section.focusEditSectionTitle = false;
		}
		else
		{
			section.showSectionTitleInput = true;
			section.focusEditSectionTitle = true;
		}
	};

	// Sortable for pages
	$("#sortable_pages").sortable({
		handle: '.drag',
		update: function( event, ui ) {
			var sortedIds = $(this).sortable('toArray'), order = [];

			console.log(sortedIds);

			// Update pages objects with new order
			for (var i = 0; i < sortedIds.length; i++) {
				var id = sortedIds[i].substr(5);
				
				console.log(form.sections[id].name);
				order.push(form.sections[id].id);
			};

			for (var i = order.length - 1; i >= 0; i--) {
				for (var j = form.sections.length - 1; j >= 0; j--) {
					if (form.sections[j].id == order[i])
					{
						form.sections[j].order = i + 1;	
					}
				};
			};

			NProgress.start();

			Forms.update_sections(form.id, {order: order}, function() {
				NProgress.done();
			}, function() {
				alert('Não foi possível atualizar a ordem motivo.');
			});
		},
	});

	$('.select_user_to_group').autocomplete({
		source: function( request, response ) {
			API('GET', '/users?name_likes=' + request.term).success(function(data, status, headers) {
				response( $.map( data.response, function( item ) {
					return {
						label: item.name,
						value: item.name
					}
				}));
			}).error(function() {
				
			});
		},

		open: function(){
			$(this).autocomplete('widget').css('z-index', 2000);
			return false;
		},

		select: function (event, ui) {
			$(this).val(ui.item.label);
			return false;
		}
	});

	// Autocomplete for adding users
	$('#inputUsers').autocomplete({
		source: function( request, response ) {
			API('GET', '/users?name_like=' + request.term + '&by_role=agent').success(function(data, status, headers) {
				response( $.map( data.response, function( item ) {
					return {
						label: item.name,
						value: item.name,
						user: item
					}
				}));
			}).error(function() {
				
			});
		},

		open: function(){
			$(this).autocomplete('widget').css('z-index', 2000);
			return false;
		},

		select: function (event, ui) {
			$(this).val('');

			$timeout(function() {

				var newAssignment = {
					'user_id': ui.item.user.id,
					'mod_id': null,
					'quota': 0
				};

				NProgress.start();

				Forms.create_assignment(form.id, newAssignment, function(data) {

					// I think we should think more about this, baby
					Forms.get_all_assignments(form.id, function(data) {
						assignments = data.response;
						$scope.assignments = assignments;

						NProgress.done();
					}, function(err) {

					});
				}, function() {

				});
			});

			return false;
		}
	});

	// Fix inputs options div when scroll is big
	$scope.scrollableInputsList = function(e) {
		var scroller_anchor = $('.scroller_anchor').offset().top;

		if ($(window).scrollTop() >= scroller_anchor && $('.inputs_options').css('position') != 'fixed') 
		{
			$('.inputs_options').css({
				'width': '730px',
				'position': 'fixed',
				'top': '10px',
				'z-index': '1000'
			});

			$('.scroller_anchor').css('height', '150px');
		} 
		else if ($(window).scrollTop() < scroller_anchor && $('.inputs_options').css('position') != 'relative') 
		{
			$('.scroller_anchor').css('height', '0px');

			$('.inputs_options').css({
				'position': 'relative'
			});
		}
	};
}])

/** 
	@name List submissions from a form
	@url #/forms/edit/{id}/submissions
*/
.controller('FormsSubmissionsListCtrl', ['$scope', '$rootScope', '$compile', '$routeParams', 'Forms', 'rSubmissions', 'API', '$timeout', function($scope, $rootScope, $compile, $routeParams, Forms, rSubmissions, API, $timeout) {
	var form_id = $routeParams.formId, user_id = $routeParams.userId;

	NProgress.start();
	$rootScope.showLoading = true;

	$scope.page = 1;
	$scope.waiting = false;
	$scope.end = false;
	$scope.identifier = null;
	$scope.form = null;
	$scope.user_id = null;
	$scope.status = null;
	$scope.period = null;
	$scope.enable_search_by_user = true;

	$scope.created_from = null;
	$scope.created_to = null;

	if (typeof user_id !== 'undefined')
	{
		$scope.user_id = user_id;
	}

	$scope.applyDateFilter = function(period) {
		var created_from = null, created_to = null;
		$scope.custom_date_search = false;

		var update = function(created_from, created_to) {
			if (typeof created_from != 'undefined')
			{
				$scope.created_from = created_from;
			}
			
			if (typeof created_to != 'undefined')
			{
				$scope.created_to = created_to;
			}

			$scope.fetchSubmissions(true);
		};
		
		if (period == 'today')
		{
			created_from = new Date();
			created_from.setHours(0, 0, 0, 0); // midnight
			created_from = created_from.toISOString();

			// created_to not needed
			update(created_from, null);
		}

		if (period == 'this_week')
		{
			created_from = new Date();
			created_from.setHours(0, 0, 0, 0); // midnight
			created_from = new Date(created_from.setDate(created_from.getDate() - created_from.getDay())); // this week
			created_from = created_from.toISOString();

			// created_to not needed
			update(created_from, null);
		}

		if (period == 'this_month')
		{
			created_from = new Date();
			created_from.setHours(0, 0, 0, 0); // midnight
			created_from = new Date(created_from.getFullYear(), created_from.getMonth(), 1); // this month
			created_from = created_from.toISOString();

			// created_to not needed
			update(created_from, null);
		}

		if (period == 'this_year')
		{
			created_from = new Date();
			created_from.setHours(0, 0, 0, 0); // midnight
			created_from = new Date(created_from.getFullYear(), 0, 1); // this year :O
			created_from = created_from.toISOString();

			// created_to not needed
			update(created_from, null);
		}

		if (period == 'custom')
		{
			$scope.custom_date_search = true;

			// Set jQuery UI datepicker options
			$scope.dateOptions = {
				showOtherMonths: true,
				selectOtherMonths: true,
				dateFormat: 'dd/mm/yy',
				onSelect: function(dateText) {
					// Call save after selecting a date
					update();

					return;
				}
			};
		}

		$scope.period = period;
	};

	$scope.applyStatusFilter = function(status) {
		$scope.status = status;
		$scope.fetchSubmissions(true);
	};

	$scope.deleteSubmission = function() {
		NProgress.start();

		var submission = new rSubmissions({id: $scope.delete_id});

		submission.delete({
			success: function() {
				$scope.fetchSubmissions(true);
			}
		});
	};

	var submissions = new rSubmissions();

	$scope.fetchSubmissions = function(reset) {
		if (reset === true) $scope.end = false;

		if ($scope.waiting === false && $scope.end === false)
		{
			// used when applying a filter
			if (reset === true)
			{
				$scope.page = 1;
				$rootScope.showLoading = true;
			}

			// Get submission form
			if ($scope.form === null)
			{
				Forms.get(form_id, function(data) {
					$scope.form = data.response;

					// Find identifier
					for (var i = data.response.sections.length - 1; i >= 0; i--) {
						for (var j = data.response.sections[i].fields.length - 1; j >= 0; j--) {
							if (data.response.sections[i].fields[j].identifier == true)
							{
								$scope.identifier = data.response.sections[i].fields[j].id;

								break;
							}
						};
					};

					$scope.fetchSubmissions();
				}, function(err) {

				});

				return;
			}

			// Then get submissions
			NProgress.start();
			$scope.waiting = true;

			submissions.fetch({
				form: form_id,
				user: $scope.user_id,
				page: $scope.page,
				search: $scope.q,
				status: $scope.status,
				updated_between: [$scope.created_from, $scope.created_to],
				infiniteScrolling: true,
				success: function(submissions, count) {

					// Then let's find which answer is for the identifier
					for (var i = submissions.length - 1; i >= 0; i--) {
						for (var j = submissions[i].answers.length - 1; j >= 0; j--) {
							if (submissions[i].answers[j][0] == $scope.identifier)
							{
								submissions[i].identifier = submissions[i].answers[j][1];
							}
						};

						if (typeof submissions[i].identifier == 'undefined')
						{
							submissions[i].identifier = 'Submissão #' + submissions[i].id;
						}
					};

					$scope.submissions = submissions;

					$scope.page++;

					$scope.count = count;

					// Hide loading
					$rootScope.showLoading = false;
					NProgress.done();
					$scope.waiting = false;
				},
				infiniteScrollingSuccess: function(submissions, disable_infinite_scrolling, count) {
					// Then let's find which answer is for the identifier
					for (var i = submissions.length - 1; i >= 0; i--) {
						for (var j = submissions[i].answers.length - 1; j >= 0; j--) {
							if (submissions[i].answers[j][0] == $scope.identifier)
							{
								submissions[i].identifier = submissions[i].answers[j][1];
							}
						};
					};

					// Add each new user to the list
					for (var i = 0; i < submissions.length; i++) {
						$scope.submissions.push(submissions[i]);
					};

					$scope.page++;

					if (disable_infinite_scrolling === true)
					{
						$scope.end = true;
					}

					$scope.count = count;

					// Hide loading
					NProgress.done();
					$scope.waiting = false;
				}
			});
		}
	};
}])

/** 
	@name View a submission
	@url #/forms/edit/{id}/submissions/{id}
*/
.controller('FormsSubmissionsViewCtrl', ['$scope', '$rootScope', '$compile', '$routeParams', 'Forms', 'rSubmissions', function($scope, $rootScope, $compile, $routeParams, Forms, rSubmissions) {
	var form_id = $routeParams.formId, id = $routeParams.submissionId;

	$rootScope.showLoading = true;
	NProgress.start();

	Forms.get(form_id, function(data) {
		$scope.form = data.response;

		var submission = new rSubmissions(id, form_id);

		submission.get({
			success: function(data) {
				$scope.submission = data;

				$scope.getAnswerByFieldId = function(id) {
					for (var i = 0; i < data.answers.length; i++) {
						if (data.answers[i][0] == id)
						{
							return data.answers[i][1];
						}
					};

					return '';
				};

				// Hide loading
				$rootScope.showLoading = false;
				NProgress.done();
			}
		});
	}, function(err) {

	});

	var hidden_unanswered_questions = false;

	$scope.hideUnansweredQuestions = function() {
		$('.field').each(function() {
			var content = $(this).find('.field_content').html();

			if (content == '')
			{
				$(this).fadeToggle(200);
			}
		});

		$('.hide_unanswered_fields').toggleClass('active');
	};
}])

/** 
	@name List logs
	@url #/logs
*/
.controller('LogsCtrl', ['$rootScope', '$scope', '$compile', 'Logs', 'API', function($rootScope, $scope, $compile, Logs, API) {

	var search_by_user_popover = $('#search_by_user_popover').html(), popover = $('.by_user');

	popover.popover({
		html: true,
		placement: 'bottom',
		title: 'Filtrar por usuário',
		content: search_by_user_popover
	});

	popover.on('shown.bs.popover', function () {
		var e = popover.next('.popover').find('.popover-content').html(search_by_user_popover);

		// Autocomplete for adding users
		$('#search_by_user').autocomplete({
			source: function( request, response ) {

				API('GET', '/users?name_like=' + request.term + '&by_role=agent,mod').success(function(data, status, headers) {
					response( $.map( data.response, function( item ) {
						return {
							label: item.name,
							value: item.name,
							user: item
						}
					}));
				}).error(function() {
					
				});
			},

			open: function(){
				$(this).autocomplete('widget').css('z-index', 2000);
				return false;
			},

			select: function (event, ui) {
				$(this).val(ui.item.user.name);

				$scope.user_id = ui.item.user.id;

				$scope.fetchLogs(true);

				return false;
			}
		});

		$compile(e)($scope);
		$scope.$apply();
	});

	var logs = new Logs();

	NProgress.start();
	$rootScope.showLoading = true;

	$scope.page = 1;
	$scope.waiting = false;
	$scope.end = false;

	$scope.period = null;

	$scope.created_from = null;
	$scope.created_to = null;

	$scope.applyDateFilter = function(period) {
		var created_from = null, created_to = null;
		
		if (period == 'today')
		{
			created_from = new Date();
			created_from.setHours(0, 0, 0, 0); // midnight
			created_from = created_from.toISOString();

			// created_to not needed
		}

		if (period == 'this_week')
		{
			created_from = new Date();
			created_from.setHours(0, 0, 0, 0); // midnight
			created_from = new Date(created_from.setDate(created_from.getDate() - created_from.getDay())); // this week
			created_from = created_from.toISOString();

			// created_to not needed
		}

		if (period == 'this_month')
		{
			created_from = new Date();
			created_from.setHours(0, 0, 0, 0); // midnight
			created_from = new Date(created_from.getFullYear(), created_from.getMonth(), 1); // this month
			created_from = created_from.toISOString();

			// created_to not needed
		}

		if (period == 'this_year')
		{
			created_from = new Date();
			created_from.setHours(0, 0, 0, 0); // midnight
			created_from = new Date(created_from.getFullYear(), 0, 1); // this year :O
			created_from = created_from.toISOString();

			// created_to not needed
		}

		$scope.created_from = created_from;
		$scope.created_to = created_to;
		$scope.period = period;
		$scope.fetchLogs(true);
	};

	$scope.fetchLogs = function(reset) {
		if (reset === true) $scope.end = false;

		if ($scope.waiting === false && $scope.end === false)
		{
			// used when applying a filter
			if (reset === true)
			{
				$scope.page = 1;
				$rootScope.showLoading = true;
			}

			// Then get submissions
			NProgress.start();
			$scope.waiting = true;

			logs.fetchAll({
				page: $scope.page,
				user: $scope.user_id,
				//search: $scope.q,
				updated_between: [$scope.created_from, $scope.created_to],
				infiniteScrolling: true,
				success: function(logs, count) {
					$scope.logs = logs;
					$scope.count = count;

					$scope.page++;

					// Hide loading
					$scope.waiting = false;
					$rootScope.showLoading = false;
					NProgress.done();
				},
				infiniteScrollingSuccess: function(logs, count, disable_infinite_scrolling) {
					// Add each new user to the list
					for (var i = 0; i < logs.length; i++) {
						$scope.logs.push(logs[i]);
					};

					$scope.page++;

					if (disable_infinite_scrolling === true)
					{
						$scope.end = true;
					}

					$scope.count += count;

					// Hide loading
					NProgress.done();
					$scope.waiting = false;
				}
			});
		}
	};

}])

/** 
	@name 404 error
	@url #/404
*/
.controller('404Ctrl', ['$rootScope', function($rootScope) {
	$rootScope.showLogin = true;
}]);