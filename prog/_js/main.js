
var os = require('os');
var gui = require('nw.gui');
var fs = require('fs');
// var exec = require("child_process").exec;
var excelbuilder = require('msexcel-builder');


var lang;

var base;
var locations = ["*"];
var providers = ["*"];
var defs = ["*"];

var chosenLocations = [];
var chosenProviders = [];
var chosenDefs = [];


function init(l){
	var langfile;
	if (l == 'ru') {
		langfile = 'lang/ru.json'
	}
	if (l == 'en') {
		langfile = 'lang/en.json'
	}
	$.getJSON(langfile, function(response){
		jQuery(document).ready(function(){
			initBaseTemplate();
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

			$('#btn_form_request').click(function(){openExportModal()});

			$('#btn_clear_form_request').empty();
			$('#btn_clear_form_request').append('<span class="glyphicon glyphicon-trash" aria-hidden="true">&nbsp;</span>'+lang.btn_clear_form_request);

			$('#btn_clear_form_request').click(function(){location.reload();});

			$('#btn_update').empty();
			$('#btn_update').append(lang.btn_update);
			$('#btn_update').click(function(){});

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

			$('#export_to_txt').empty();
			$('#export_to_txt').append(lang.export_to_txt);
			$('#export_to_txt').click(function(){
				exportToTxt();
			});

			$('#export_to_excel').empty();
			$('#export_to_excel').append(lang.export_to_excel);
			$('#export_to_excel').click(function(){
				exportToExcel();
			})
		})
	})
	base_init();
}

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

				if (chosenDefs[0] == '*') {
					chosenDefs = defs;
					chosenDefs.splice(0, 1);
				}

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
function findEqualDigits(first, second) {
	var count = 0;
	for (var i = 0; i<first.length; i++) {
		if (first[i] === second[i]) {
			count++;
		} else {
			return count;
		}
	}
	return count;
}
function buildTemplates() {
	var output = {};

	for (loc in chosenLocations) {
		output[chosenLocations[loc]] = {};
		for (prov in chosenProviders) {
			for (def in chosenDefs) {
				if ($.inArray(chosenDefs[def], getDefs(chosenLocations[loc], chosenProviders[prov])) != -1) {
					output[chosenLocations[loc]][chosenDefs[def]] = {};
					output[chosenLocations[loc]][chosenDefs[def]].intvl = [];
					var tmpInterval = getInterval(chosenLocations[loc], chosenProviders[prov], chosenDefs[def]);
					output[chosenLocations[loc]][chosenDefs[def]].intvl.push(tmpInterval);
				}
			}
		}
	}
	return output;
}
function exportToTXT() {
	var date = new Date();
	date = date.getFullYear()+'-'+(parseInt(date.getMonth())+1)+'-'+date.getDate()+'-'+
			date.getHours()+'-'+date.getMinutes()+'-'+date.getSeconds();
	fs.mkdirSync(date);

	var listIntervals = buildTemplates();
	for (loc in listIntervals) {
	var file = fs.openSync(date+'/'+loc+'.txt', 'w');
		for (def in listIntervals[loc]) {
			for (intvls in listIntervals[loc][def].intvl[0]) {
				var partsOfInterval = listIntervals[loc][def].intvl[0][intvls].split('-');
				fs.write(file, def+partsOfInterval[0].substring(0, findEqualDigits(partsOfInterval[0],partsOfInterval[1]))+'%\r\n');
			}
		}
	};
}
function exportToExcel() {
	var date = new Date();
	date = date.getFullYear()+'-'+(parseInt(date.getMonth())+1)+'-'+date.getDate()+'-'+
			date.getHours()+'-'+date.getMinutes()+'-'+date.getSeconds();
	var wb = excelbuilder.createWorkbook('./', 'defs.xlsx');


	var listIntervals = buildTemplates();
	for (loc in listIntervals) {
		var sheet = wb.createSheet(loc, 1, Object.keys(listIntervals[loc]).length);
		var line = 1;
		for (def in listIntervals[loc]) {
			for (intvls in listIntervals[loc][def].intvl[0]) {
				var partsOfInterval = listIntervals[loc][def].intvl[0][intvls].split('-');
				try {
					sheet.set(1, line++, def+partsOfInterval[0].substring(0, findEqualDigits(partsOfInterval[0],partsOfInterval[1]))+'%');
				} catch(e) {}
			}
		}
	};
	wb.save(function(ok){});

}
function exportToScreen() {
var listIntervals = buildTemplates();
for (loc in listIntervals) {
	$('#modal-content').append('<h3>'+loc+'</h3>')
	for (def in listIntervals[loc]) {
		for (intvls in listIntervals[loc][def].intvl[0]) {
			var partsOfInterval = listIntervals[loc][def].intvl[0][intvls].split('-');
			$('#modal-content').append('<p>'+def+partsOfInterval[0].substring(0, findEqualDigits(partsOfInterval[0],partsOfInterval[1]))+'%</p>');
		}
	}
};
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

function openExportModal(){

	$('.nano').nanoScroller();
	$('.modal').addClass('nano');
	$('.modal').append('<div class="nano-content" id="modal-content"></div>')

	$('#modal-content').append('<button class="export_btn" id="export_to_txt">'+lang.export_to_txt+'</button>');
	$('#export_to_txt').click(function(){exportToTXT(); alert(lang.successful_export);});
	$('#modal-content').append('<button class="export_btn" id="export_to_excel">'+lang.export_to_excel+'</button>');
	$('#export_to_excel').click(function(){exportToExcel(); alert(lang.successful_export);});
	$('#modal-content').append('<button class="export_btn" id="btn_close_export_modal">OK</button>');
	$('#btn_close_export_modal').click(function(){closeExportModal();});

	$('.modal_wrapper').removeClass('hide');
	$('.modal').removeClass('preinit');
	var listIntervals = buildTemplates();
	for (loc in listIntervals) {
		$('#modal-content').append('<h3>'+loc+'</h3>')
		for (def in listIntervals[loc]) {
			for (intvls in listIntervals[loc][def].intvl[0]) {
				var partsOfInterval = listIntervals[loc][def].intvl[0][intvls].split('-');
				$('#modal-content').append('<p>'+def+partsOfInterval[0].substring(0, findEqualDigits(partsOfInterval[0],partsOfInterval[1]))+'%</p>');
			}
		}
	};
	$('#modal-content').append('<button class="export_btn" id="export_to_txt_2">'+lang.export_to_txt+'</button>');
	$('#export_to_txt_2').click(function(){exportToTXT(); alert(lang.successful_export);});
	$('#modal-content').append('<button class="export_btn" id="export_to_excel_2">'+lang.export_to_excel+'</button>');
	$('#export_to_excel_2').click(function(){exportToExcel(); alert(lang.successful_export);});
	$('#modal-content').append('<button class="export_btn" id="btn_close_export_modal_2">OK</button>');
	$('#btn_close_export_modal_2').click(function(){closeExportModal();});
}
function closeExportModal(){
	$('modal').removeClass('nano');
	$('.modal_wrapper').addClass('hide');
	$('.modal').addClass('preinit');
	$('.modal').empty();
	location.reload();
}
function openModal(msg) {
	$('.modal_wrapper').removeClass('hide');
	$('.modal').removeClass('preinit');
	$('.modal').append('<p>'+msg+'</p>');
	$('.modal').append('<button id="btn_modal_ok">OK</button>');
	$('#btn_modal_ok').click(function(){closeModal()});
}
function closeModal() {
	$('.modal_wrapper').addClass('hide');
	$('.modal').addClass('preinit');
	$('.modal').empty();
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

function initBaseTemplate() {

	$('body').empty();
	$('body').append(
		'<div class="modal_wrapper hide"></div>'+
		'<div class="modal preinit"></div>'+

		'<header>'+
			'<img src="_pics/sled_hero.png">'+
			'<h1></h1>'+
		'</header>'+

		'<div class="content">'+

			'<div id="error" class="hide">'+
				'<p></p>'+
			'</div>'+

			'<div class="block_number_check preinit">'+
				'<input type="text" id="input_number_check" />'+
				'<button id="button_number_check"><span class="glyphicon glyphicon-search" aria-hidden="true"></span></button>'+
				'<p class="NB" id="note_mnp"></p>'+
			'</div>'+

			'<div class="form_request preinit">'+
				'<h2 id="header_form_request"></h2>'+

				'<input id="input_locations" type="text">'+
				'<input id="input_providers" type="text">'+
				'<input id="input_defs" type="text">'+

				'<button id="btn_form_request"></button>'+
				'<button id="btn_clear_form_request"></button>'+

			'</div>'+

			'<button id="btn_update" ></button>'+
			'<div class="switch_lang">'+
	        	'<div id="btn_en" class="switch_lang_btn not_pressed">en</div>'+
	        	'<div id="btn_ru" class="switch_lang_btn">ru</div>'+
	        '</div>'+

		'</div>'+


		'<footer>'+
			'<p><a id="btn_author"></a></p>'+
			'<p><a id="btn_about"></a></p>'+
			'<p id="lbl_year">2015</p>'+
		'</footer>'
	);
}

init('ru');

// Сделать футер