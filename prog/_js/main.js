
var os = require('os');
var gui = require('nw.gui');
var fs = require('fs');
var exec = require("child_process").exec;

var base;
var locations = ["*"];
var providers = ["*"];
var defs = ["*"];

var chosenLocations = [];
var chosenProviders = [];
var chosenDefs = [];

var base_init = function() {
	$.getJSON('base/base.json', function(response){

		base = response;
		locations = locations.concat(getLocations());

		function split(val) {
			return val.split( /,\s*/ );
		};
		function extractLast(term) {
			return split(term).pop();
		};

		$('#input_locations').bind( "keydown", function( event ) {
			if ( event.keyCode === $.ui.keyCode.TAB &&
					$( this ).autocomplete().menu.active ) {
				event.preventDefault();
			}
		})
		$('#input_locations').autocomplete({
			minLength: 0,
			source: function( request, response ) {
				// delegate back to autocomplete, but extract the last term
				response( $.ui.autocomplete.filter(
					locations, extractLast( request.term ) ) );
			},
			focus: function() {
				// prevent value inserted on focus
				return false;
			},
			select: function( event, ui ) {
				chosenLocations = split( this.value );
				// remove the current input
				chosenLocations.pop();
				// add the selected item
				chosenLocations.push( ui.item.value );
				this.value = chosenLocations.join( ", " ) + ', ';

				if (chosenLocations[0] == '*') {
					chosenLocations = locations;
					chosenLocations.splice(0, 1);
				}
				for (loc in chosenLocations) {
					var tmpProviders = getProviders(chosenLocations[loc]);
					for (tmpprov in tmpProviders) {
						if (providers.indexOf(tmpProviders[tmpprov]) == -1) {
							providers.push(tmpProviders[tmpprov])
						}
					}
				}
				return false;
			}
		});

		$('#input_providers').bind( "keydown", function( event ) {
			if ( event.keyCode === $.ui.keyCode.TAB &&
					$( this ).autocomplete().menu.active ) {
				event.preventDefault();
			}
		})
		$('#input_providers').autocomplete({
			minLength: 0,
			source: function( request, response ) {
				// delegate back to autocomplete, but extract the last term
				response( $.ui.autocomplete.filter(
					providers, extractLast( request.term ) ) );
			},
			focus: function() {
				// prevent value inserted on focus
				return false;
			},
			select: function( event, ui ) {
				chosenProviders = split( this.value );
				// remove the current input
				chosenProviders.pop();
				// add the selected item
				chosenProviders.push( ui.item.value );
				this.value = chosenProviders.join( ", " ) + ', ';

				if (chosenProviders[0] == '*') {
					chosenProviders = providers;
					chosenProviders.splice(0, 1);
				}
				for (loc in chosenLocations) {
					for (prov in chosenProviders) {
						var tmpDefs = getDefs(chosenLocations[loc], chosenProviders[prov]);
						for (tmpdef in tmpDefs) {
							if (defs.indexOf(tmpDefs[tmpdef]) == -1) {
								defs.push(tmpDefs[tmpdef])
							}
						}
					}
				}
				return false;
			}
		});

		$('#input_defs').bind( "keydown", function( event ) {
			if ( event.keyCode === $.ui.keyCode.TAB &&
					$( this ).autocomplete().menu.active ) {
				event.preventDefault();
			}
		})
		$('#input_defs').autocomplete({
			minLength: 0,
			source: function( request, response ) {
				// delegate back to autocomplete, but extract the last term
				response( $.ui.autocomplete.filter(
					defs, extractLast( request.term ) ) );
			},
			focus: function() {
				// prevent value inserted on focus
				return false;
			},
			select: function( event, ui ) {
				chosenDefs = split( this.value );
				// remove the current input
				chosenDefs.pop();
				// add the selected item
				chosenDefs.push( ui.item.value );
				this.value = chosenDefs.join( ", " ) + ', ';

				return false;
			}
		});


	});
}

function getLocations(){
	var locations = [];
	for (prop in base) {
		locations.push(prop);
	}
	return locations;
};
function getProviders(loc){
	var providers = [];
	for (prop in base[loc]) {
		providers.push(prop);
	}
	return providers;
};
function getDefs(loc, prov){
	var defs = [];
	for (prop in base[loc][prov]) {
		defs.push(prop);
	}
	return defs;
};
function getInterval(loc, prov, def){
	var interval = [];
	for (prop in base[loc][prov][def]) {
		interval.push(prop);
	}
	return interval;
};
function isInInterval(from, nbr, to ) {
	if ((nbr > from) && (nbr < to)) {
		return true;
	} else {
		return false;
	}
}
function strToCode(str) {
	var output = {};
	output.def = str.substring(4,7);
	output.number = str.substring(9).replace('-', '');
	return output;
}

var lang;
function init(l){
	if (l == 'ru') {
		langfile = 'lang/ru.json'
	}
	if (l == 'en') {
		langfile = 'lang/en.json'
	}
	$.getJSON(langfile, function(response){
		lang = response;
		$('header h1').empty();
		$('header h1').append(lang.title);

		$('#note_mnp').empty();
		$('#note_mnp').append(lang.note_mnp+' '+'<a id="learnmore_mnp">'+lang.learnmore+'</a>');

		$('#learnmore_mnp').click(function(){gui.Shell.openExternal('http://pravo.gov.ru/proxy/ips/?docbody=&link_id=2&nd=102162254')});


		$('.block_number_check').removeClass('preinit');
		$('#input_number_check').focus();
		$('#input_number_check').attr('placeholder', lang.placeholder_input_number_check);

		$('#button_number_check').click( function() {
			var provider = findProvider(strToCode($('#input_number_check').val()).def, strToCode($('#input_number_check').val()).number);
			if (provider.error != undefined) {
				openModal(provider.error);
			} else {
				openModal(provider.loc+'<br />'+provider.prov);
			}

		});

		$('#btn_about').empty();
		$('#btn_about').append(lang.btn_about);

		$('#btn_about').click(function(){alert('Under construction')});

		$('#btn_author').empty();
		$('#btn_author').append(gui.App.manifest.author);

		$('#btn_author').click(function() { gui.Shell.openExternal('http://kostydenis.me') });


		$('.form_request').removeClass('preinit');

		$('#header_form_request').empty();
		$('#header_form_request').append(lang.header_form_request);

		$('#input_locations').attr('placeholder', lang.placeholder_input_locations);
		$('#input_providers').attr('placeholder', lang.placeholder_input_providers);
		$('#input_defs').attr('placeholder', lang.placeholder_input_defs);

		$('#btn_form_request').empty();
		$('#btn_form_request').append(lang.btn_form_request);

		$('#btn_form_request').click(function(){});

		$('#btn_clear_form_request').empty();
		$('#btn_clear_form_request').append('<span class="glyphicon glyphicon-trash" aria-hidden="true">&nbsp;</span>'+lang.btn_clear_form_request);

		$('#btn_clear_form_request').click(function(){location.reload();});

		$('#btn_update').empty();
		$('#btn_update').append(lang.btn_update);
		$('#btn_update').click(function(){
			showWaitScreen();
			if (os.platform == 'darwin') {
				var updater = exec('python3 _py/dwnldBase.py', function() {
					console.log('stdout: ' + stdout);
					console.log('stderr: ' + stderr);
					if (error !== null) {
						setErrorNumberCheck()
					}
				});
			};
			if (os.platform == 'darwin') {
				var updater = exec('_py/dwnldBase.exe', function() {
					if (error !== null) {
						console.log('exec error: ' + error);
					}
				});
			};
			// var updater = exec( 'python3 _py/dwnldBase.py' );
			child = exec('python3 _py/dwnldBase.py',
  function (error, stdout, stderr) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
});

		});

		$('#input_number_check').mask('+7 (000) 000-0000');

		$('#btn_ru').click(function(){
			$('#btn_ru').removeClass('not_pressed');
			$('#btn_en').addClass('not_pressed');
			init('ru');
		});
		$('#btn_en').click(function(){
			$('#btn_en').removeClass('not_pressed');
			$('#btn_ru').addClass('not_pressed');
			init('en');
		});

		$('#btn_modal_ok').click(function(){closeModal()});
	});
}

function setError(err_msg) {
	$('#error').removeClass('hide');
	$('#error').addClass('show');
	$('#error').append('<p>'+err_msg+'</p>');
};
function unSetError() {
	$('#error').removeClass('show');
	$('#error').addClass('hide');
	setTimeout(function(){$('#error').empty();}, 200);
};

$('#input_locations').on('change', function() {if (this.val() == ''){base_init()} });
$('#input_providers').on('change', function() {if (this.val() == ''){base_init()} });
$('#input_defs').on('change', function() {if (this.val() == ''){base_init()} });


function openModal(msg) {
	$('.modal_wrapper').removeClass('hide');
	$('.modal').removeClass('preinit');
	$('.modal p').append(msg);
}
function closeModal() {
	$('.modal_wrapper').addClass('hide');
	$('.modal').addClass('preinit');
	$('.modal p').empty();
}


function findProvider(input_def, input_number) {
	var output = {};
	var tmpLocations;
	var tmpProviders;
	var tmpDefs;
	// var tmpInterval;

	tmpLocations = getLocations();
	for (loc in tmpLocations) {
		tmpProviders = getProviders(tmpLocations[loc]);
		for (prov in tmpProviders) {
			tmpDefs = getDefs(tmpLocations[loc], tmpProviders[prov])
			for (def in tmpDefs) {
				if (tmpDefs[def] == input_def) {

					var tmpInterval = getInterval(tmpLocations[loc], tmpProviders[prov], tmpDefs[def]);
					for (intvl in tmpInterval) {
						var currInterval = tmpInterval[intvl].toString().split('-');
						if (isInInterval(currInterval[0], input_number, currInterval[1])) {
							output.loc = tmpLocations[loc];
							output.prov = tmpProviders[prov];
							base_init();
							return output;
						}
					}
				}
			}
		}
	}

	output.error = lang.error_number_not_found;
	base_init();
	return output;
}

base_init();
init('ru');

// Сделать футер