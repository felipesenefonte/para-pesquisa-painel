'use strict';

/* Filters */

angular.module('uppSocial.filters', [])

// get form title by type
.filter('formTypeName', function(Forms) {
	return function(type) {
		if (typeof type !== 'undefined')
		{
			return Forms.getAvailableInputs()[type].name;
		}

		return type;
	};
})
.filter('showOptionsBtn', function(Forms) {
	return function(type) {
		if (typeof type !== 'undefined')
		{
			return Forms.getAvailableInputs()[type].can_edit_options;
		}
	}
})
.filter('roleName', function() {
	return function(role) {
		if (role == 'api')
		{
			return 'Administrador';
		}
		else if (role == 'mod')
		{
			return 'Coordenador';
		}
		else if (role == 'agent')
		{
			return 'Pesquisador';
		}
		else
		{
			return '';
		}
	}
})
.filter('rescheduleText', function() {
	return function(text) {
		if (text == true)
		{
			return 'Reagendar';
		}
		else
		{
			return 'Cancelar';
		}
	}
})
.filter('toList', function() {
	return function(t) {
		if (typeof t == 'object')
		{
			var html = '';

			for (var i = 0; i < t.length; i++) {
				html += '<li>' + t[i] + '</li>';
			};

			return html;
		}

		return t;
	}
})
.filter('hideExtraData', function() {
	return function(arr) {
		for (var i = arr.length - 1; i >= 0; i--) {
			if (arr[i].read_only == true)
			{
				arr.splice(i, 1);
			}
		};

		return arr;
	}
})
// :P
.filter('logAction', function() {
	return function(action) {
		if (action == 'created')
		{
			return 'criou uma pesquisa';
		}
		else if (action == 'started')
		{
			return 'iniciou uma pesquisa';
		}
		else if (action == 'revised')
		{
			return 'revisou uma pesquisa';
		}
		else if (action == 'approved')
		{
			return 'aprovou uma pesquisa';
		}
		else if (action == 'reproved')
		{
			return 'reprovou uma pesquisa';
		}
		else if (action == 'rescheduled')
		{
			return 'reagendou uma pesquisa';
		}
		else if (action == 'transferred')
		{
			return 'transferiu uma pesquisa';
		}
		else if (action == 'canceled')
		{
			return 'cancelou uma pesquisa';
		}
		else if (action == 'reset')
		{
			return 'restituiu uma pesquisa';
		}
		else
		{
			return action;
		}
	};
})
.filter('csvMessages', function() {
	return function(message) {
		if (message == 'user_not_found')
		{
			return 'usuário não encontrado';
		}
		else
		{
			return message;
		}
	};
})
/**
 * Credits to: https://github.com/angular/angular.js/issues/653#issuecomment-3576805
 *
 * Usage:
 *   {{some_text | cut:true:100:' ...'}}
 * Options:
 *   - wordwise (boolean) - if true, cut only by words bounds,
 *   - max (integer) - max length of the text, cut to this number of chars,
 *   - tail (string, default: '&nbsp;&hellip;') - add this string to the input
 *     string if the string was cut.
 */
.filter('cut', function () {
    return function (value, wordwise, max, tail) {
        if (!value) return '';

        max = parseInt(max, 10);
        if (!max) return value;
        if (value.length <= max) return value;

        value = value.substr(0, max);
        if (wordwise) {
            var lastspace = value.lastIndexOf(' ');
            if (lastspace != -1) {
                value = value.substr(0, lastspace);
            }
        }

        return value + (tail || ' …');
    };
});
