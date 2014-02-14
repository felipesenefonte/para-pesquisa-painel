'use strict';

/* Directives */


angular.module('uppSocial.directives', [])
.directive('ngFocus', ['$parse', function($parse) {
  return function(scope, element, attr) {
    var fn = $parse(attr['ngFocus']);
    element.bind('focus', function(event) {
      scope.$apply(function() {
        fn(scope, {$event:event});
      });
    });
  }
}])
.directive('ngBlur', ['$parse', function($parse) {
  return function(scope, element, attr) {
    var fn = $parse(attr['ngBlur']);
    element.bind('blur', function(event) {
      scope.$apply(function() {
        fn(scope, {$event:event});
      });
    });
  }
}])
.directive('navItem', ['$location', function($location) {
	return {
		restrict: 'A',
		
		link: function(scope, element) {
			var toPath = element.find('a')[0].href;

			scope.location = $location;
			scope.$watch('location.absUrl()', function(currentPath) {
				if (!currentPath.indexOf(toPath))
				{
					element.addClass('active');
				}
				else
				{
					element.removeClass('active');
				}
			});
		}
	};
}])
.directive('focusMe', function($timeout) {
	return {
		link: function(scope, element, attrs) {
			scope.$watch(attrs.focusMe, function(value) {
				if(value === true) { 
					$timeout(function() {
						element[0].focus();
						scope[attrs.focusMe] = false;
					});
				}
			});
		}
	};
})
.directive('itemDraggable', function() {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			var options = {
				helper: 'clone',
			};

			element.draggable(options);
		}
	};
})
.directive('itemDroppable', function($interpolate, $compile, Forms) {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			var options = {
				accept: ':not(.ui-sortable-helper)',
				activeClass: 'active-effect',
				hoverClass: 'hover-effect',
				drop: function( event, ui ) {
					var inputType = ui.draggable.attr('name');

					$(this).find('.item').remove();

					var newField = {
						id: null,
						label: Forms.getAvailableInputs()[inputType].name + ' sem título',
						description: null,
						type: inputType,
						order: null,
						layout: null,
						options: [],
					};

					if (scope.section.id !== null)
					{
						NProgress.start();

						Forms.create_section_field(scope.$parent.form.id, scope.section.id, newField, function(data) {
							NProgress.done();

							newField.id = data.response.field_id;

							scope.section.fields.push(newField);
						}, function(err) {
							alert('Não foi possível criar o campo. Tente novamente, por favor.');
						});
					}
					else
					{
						alert('Você não pode atualiza uma seção sem ela ter um ID. Atualize a página.');
					}

					scope.$digest();
				}
			};

			element
				.droppable(options)
				.sortable({
					items: "li:not(.item,.option_item)",
					update: function( event, ui ) {
						var sortedIds = $(this).sortable('toArray'), order = [];

						for (var i = 0; i < sortedIds.length; i++) {
							var id = sortedIds[i].substr(5);

							if (sortedIds[i] !== '')
							{
								order.push(scope.section.fields[id].id);
							}
						};

						for (var i = order.length - 1; i >= 0; i--) {
							for (var j = scope.section.fields.length - 1; j >= 0; j--) {
								if (scope.section.fields[j].id == order[i])
								{
									scope.section.fields[j].order = i + 1;	
								}
							};
						};

						NProgress.start();

						Forms.update_section_fields(scope.$parent.form.id, scope.section.id, {order: order}, function() {
							NProgress.done();
						}, function() {
							alert('Não foi possível atualizar a ordem motivo.');
						});
					},
				});
		}
	};
})
.directive('inputItem', function($interpolate, $compile, $timeout, Forms, Options) {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {

			scope.available_layouts = Forms.getAvailableInputs()[scope.field.type].available_layouts;
			scope.available_fields = scope.$parent.section.fields;
			scope.selected_inject_option = 'none';

			var title_html = $('#input_popover_template_title').html();
			var html = $('#input_popover_template').html();
			var all_popovers = scope.$parent.$parent.popovers;

			var li_content_element = element.find('.li-content');

			li_content_element.popover({
				html : true,
				title: title_html,
				content: html,
				placement: 'top',
				delay: 150
			});

			// Add popover to popover's array so we can hide it after
			all_popovers.push(li_content_element);

			li_content_element.on('shown.bs.popover', function () {
				// Hide all others popovers
				// THINK FOR A BETTER METHOD
				for (var i = all_popovers.length - 1; i >= 0; i--) {
					if (all_popovers[i] !== li_content_element)
					{
						all_popovers[i].popover('hide');
						all_popovers[i].next('.popover').remove();
					}
				};

				var t = li_content_element.next('.popover').find('.popover-title').html(title_html);
				var e = li_content_element.next('.popover').find('.popover-content').html(html);

				$compile(e)(scope);
				$compile(t)(scope);
				scope.$apply();
			});

			if (typeof scope.field.validations !== 'undefined' && typeof scope.field.validations.required !== 'undefined' && scope.field.validations.required == true)
			{
				scope.required = true;
			}

			if (typeof scope.field.identifier !== 'undefined' && scope.field.identifier == true)
			{
				scope.required = true;
			}

			scope.toggleRequired = function() {
				if (typeof scope.field.validations == 'undefined')
				{
					scope.field.validations = {
						required: true
					};
				}
				else
				{
					if (typeof scope.field.validations.required == 'undefined')
					{
						scope.field.validations.required = true;
					}
					else
					{
						if (scope.field.validations.required == true)
						{
							scope.field.validations.required = false;
						}
						else
						{
							scope.field.validations.required = true;
						}
					}
				}
			};

			scope.toggleIdentifier = function() {
				if (typeof scope.field.identifier == 'undefined')
				{
					scope.field.identifier = true;
				}
				else
				{
					if (scope.field.identifier == true)
					{
						scope.field.identifier = false;
					}
					else
					{
						scope.field.identifier = true;
					}
				}
			};

			scope.toggleHasOther = function() {
				for (var i = 0; i < scope.field.options.length; i++)
				{
					if (scope.field.options[i].value == 'other')
					{
						scope.field.options.splice(i, 1);

						return;
					}
				};

				scope.field.options.push({ label: 'Outro (Especifique)', value: 'other' });
			};

			scope.checkIfHasOther = function() {
				if (typeof scope.field.options !== 'undefined')
				{
					for (var i = 0; i < scope.field.options.length; i++)
					{
						if (scope.field.options[i].value == 'other')
						{
							scope.hasOther = true;

							return;
						}
					}
				}

				scope.hasOther = false;
			};

			scope.injectOptions = function() {
				if (scope.selected_inject_option && scope.selected_inject_option !== 'none')
				{
					var options = Options.getOptionsForInject(scope.selected_inject_option);

					if (typeof scope.field.options == 'undefined')
					{
						scope.field.options = [];
					}

					for (var i = 0 ; i < options.length; i++) {
						scope.field.options.push({ label: options[i], value: options[i] });
					};
				}
			};

			scope.updateItem = function() {
				NProgress.start();

				Forms.update_section_field(scope.$parent.$parent.form.id, scope.$parent.section.id, scope.field.id, scope.field, function(data) {
					NProgress.done();
				}, function(err) {
					alert('Não foi possível atualizar o campo. Tente novamente, por favor.');
				});
			};

			scope.deleteItem = function(field) {
				if (confirm('Tem certeza que você deseja remover este input?'))
				{
					NProgress.start();

					Forms.delete_section_field(scope.$parent.$parent.form.id, scope.$parent.section.id, scope.field.id, function(data) {
						NProgress.done();
					}, function(err) {
						alert('Não foi possível remover o campo. Tente novamente, por favor.');
					});

					scope.$parent.section.fields.splice(scope.$parent.section.fields.indexOf(field), 1);
					li_content_element.popover('hide');
					li_content_element.next('.popover').remove();
				}
			};

			scope.copyItem = function(field) {
				var newField = angular.copy(field);

				newField.id = null;
				newField.label = 'Cópia de ' + newField.label;

				NProgress.start();

				Forms.create_section_field(scope.$parent.$parent.form.id, scope.$parent.section.id, newField, function(data) {
					NProgress.done();

					newField.id = data.response.field_id;

					scope.$parent.section.fields.push(newField);
				}, function(err) {
					alert('Não foi possível copiar o campo. Tente novamente, por favor.');
				});
			};

			scope.closePopover = function() {
				li_content_element.popover('hide');
				li_content_element.next('.popover').remove();

				scope.updateItem();
			};

			scope.showAddOptions = function() {
				var modal = element.find('.modal').modal('show');
			};

			scope.addOption = function() {
				if (typeof scope.field.options == 'undefined')
				{
					scope.field.options = [];
				}

				scope.field.options.push({ label: scope.valueName, value: scope.valueName });
				scope.valueName = '';
			};

			scope.deleteOption = function(option) {
				scope.field.options.splice(scope.field.options.indexOf(option), 1);

				// deactivate checkbox for "others"
				scope.checkIfHasOther();
			};

			scope.editOption = function(option) {
				var newLabel = window.prompt('Edite o texto da opção', option.label);

				if (newLabel != null)
				{
					scope.field.options[scope.field.options.indexOf(option)] = { label: newLabel, value: newLabel};
				}
			};

			scope.addAction = function() {

				if (typeof scope.field.actions == 'undefined')
				{
					scope.field.actions = [];
				}

				var action = {
					when: scope.action_selected_options,
					disable: scope.action_selected_disable_fields
				};

				scope.field.actions.push(action);
			};

			scope.removeAction = function(action) {
				scope.field.actions.splice(scope.field.actions.indexOf(action), 1);
			};

			scope.getFieldLabelById = function(id) {
				for (var i = scope.available_fields.length - 1; i >= 0; i--) {
					if (scope.available_fields[i].id == id)
					{
						return scope.available_fields[i].label;
					}
				};
			};

			scope.checkIfHasOther();

			element.find('.options_sortable').sortable({
				update: function( event, ui ) {
					var sortedIds = $(this).sortable('toArray'), newArray = [];

					console.log(sortedIds, 'ids');
					console.log(scope.field.options, 'options');

					// Update pages objects with new order
					for (var i = 0; i < sortedIds.length; i++) {
						var id = sortedIds[i].substr(7);

						newArray.push(scope.field.options[id]);
					};

					$timeout(function() {
						scope.field.options = newArray;
					});

					console.log(newArray, 'newArray');
				},
			});

			/* 

			I was going to use this, but I thought about it a little bit more and.......guess what
			I DID NOT HAVE TO USE IT!
			:D
				
			scope.$watch('page',
				function(value) {
					var e = element.next('.popover').find('.popover-content').html(html);
					$compile(e.contents())(scope);
				}, true
			);*/
		}
	};
})
.directive('assignmentItem', function(API, Forms, $timeout) {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			element.find('.changeMod').autocomplete({
				source: function( request, response ) {

					API('GET', '/users?name_like=' + request.term + '&by_role=mod').success(function(data, status, headers) {
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

					$timeout(function() {
						NProgress.start();

						Forms.update_assignment(scope.$parent.form.id, scope.assignment.id, { 'mod_id' : ui.item.user.id }, function(data) {
							NProgress.done();
						}, function() {

						});
					});

					return false;
				}
			});


		}
	}
})
.directive('submissionItem', function(rSubmissions) {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			for (var i = scope.submission.log.length - 1; i >= 0; i--) {
				if (scope.submission.log[i].action == 'canceled' || scope.submission.log[i].action == 'rescheduled')
				{
					scope.submission.stop_reason = scope.submission.log[i].stop_reason.reason;
				}
			};

			scope.changeStatus = function(status) {
				NProgress.start();
				
				var sub = new rSubmissions(scope.submission);

				sub.set('status', status);

				sub.save(function() {
					scope.submission.status = status;
					NProgress.done();
				});
			};

			scope.reset = function() {
				if (confirm('Tem certeza que você deseja restituir este formulário?'))
				{
					NProgress.start();

					var sub = new rSubmissions(scope.submission);

					sub.reset(function() {
						scope.submission.status = 'new';
						NProgress.done();
					});
				}
			};

		}
	}
})
.directive('avatar', function(api_info) {
	return {
		scope: { avatar: '=avatar'  },
		link: function(scope, element, attrs) {
			scope.$watch('avatar', function(newValue, oldValue) {
				if (attrs.type == 'background-image')
				{
					if (typeof newValue == 'undefined' || newValue == null)
					{
						element.css('background-image', 'url(img/default_user.png)');
					}
					else
					{
						element.css('background-image', 'url(' + newValue + ')');
					}
				}
				else
				{
					if (typeof newValue == 'undefined' || newValue == null)
					{
						element.attr('src', 'img/default_user.png');
					}
					else
					{
						element.attr('src', newValue);
					}
				}
			});
		}
	}
})
/**
 * Here's how this thing works:
 * 1) <sidebar>content to be shown in root view</sidebar> is inserted in a partial (child scope)
 * 2) <div compile="sidebar"></div> is inserted in the root view (root scope)
 * 3) $compile the html with the child scope
 * 4) MAGIC
 */
.directive('compile', function($compile, $rootScope) {
	return function(scope, element, attrs) {
		scope.$watch(
			function(scope) {
				return scope.$eval(attrs.compile);
			},
			function(value) {
				element.html(value);

				if (typeof scope.temp_scope == 'undefined')
				{
					scope.temp_scope = scope;
				}

				$compile(element.contents())(scope.temp_scope);
			}
		);
	};
})
.directive('sidebar', function($rootScope) {
	var html;

	return {
		restrict: 'E',
		compile: function(tElement, tAttrs, transclude) {
			html = tElement.html(); // MAGIC!

			return function (scope, element, attr) {
				element.hide();

				// everytime $digest is invoked we interpolate our directive content with the current scope :)
				scope.$watch(function() { 
					$rootScope.sidebar = html;
					$rootScope.temp_scope = scope;
				});
			}
		},
	}
})
.directive('filterAutocomplete', function(API) {
	return {
		link: function(scope, element, attrs) {
			element.autocomplete({
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
					scope.enable_search_by_user = false;

					scope.user_id = ui.item.user.id;
					scope.user_name = ui.item.user.name;

					scope.fetchSubmissions(true);

					scope.removeUser = function() {
						scope.enable_search_by_user = true;

						scope.user_id = null;
						scope.user_name = null;

						scope.fetchSubmissions(true);
					};

					return false;
				}
			});
		}
	}
})
.directive('deleteModal', function() {
	return {
		restrict: 'E',
		replace: true,
		transclude: true,
		scope: { deleteForm: '&callback' },
		templateUrl: 'partials/directives/delete-modal.html',
		link: function(scope, element, attrs) {
			scope.delete_a = function() {
				scope.delete = null;
				scope.deleteForm();

				element.modal('hide');

				return true;
			};
		}
	}
})
.directive('transferModal', function(rUser) {
	return {
		restrict: 'E',
		replace: true,
		transclude: true,
		scope: { transferSubmissions: '&callback' },
		templateUrl: 'partials/directives/transfer-modal.html',
		link: function(scope, element, attrs) {
			var user = new rUser();

			user.fetchAll({
				no_pagination: true,
				success: function(data) {
					scope.users = data;
				} 
			});

			scope.transfer = function(to) {
				if (confirm('Você tem certeza que deseja transferir todas as pesquisas deste usuário?'))
				{
					NProgress.start();

					scope.transferSubmissions()(to, function() {
						NProgress.done();
						scope.success = true;
					});
				}
			};

			element.on('hidden.bs.modal', function () {
				scope.success = false;
			})
		}
	}
})
.directive('translateUiDate', function() {
	return {
		link: function(scope, element, attrs) {
			// Translation
			$.datepicker.regional['pt-BR'] = {
				closeText: 'Fechar',
				prevText: '&#x3C;Anterior',
				nextText: 'Próximo&#x3E;',
				currentText: 'Hoje',
				monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
				'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
				monthNamesShort: ['Jan','Fev','Mar','Abr','Mai','Jun',
				'Jul','Ago','Set','Out','Nov','Dez'],
				dayNames: ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'],
				dayNamesShort: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
				dayNamesMin: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
				weekHeader: 'Sm',
				dateFormat: 'dd/mm/yy',
				firstDay: 0,
				isRTL: false,
				showMonthAfterYear: false,
				yearSuffix: ''};
			$.datepicker.setDefaults($.datepicker.regional['pt-BR']);
		}
	}
});