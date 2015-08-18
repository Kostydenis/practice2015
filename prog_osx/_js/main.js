
var os = require('os');
var gui = require('nw.gui');
var fs = require('fs');
var exec = require("child_process").exec;
var spawn = require("child_process").spawn;
var excelbuilder = require('msexcel-builder');

var logging = false;

var lang;
var chosenLang = 'ru';
var base;
var locations = [];
var providers = [];
var defs = [];

var chosenLocations = [];
var chosenProviders = [];
var chosenDefs = [];

var saveTo = window.location.pathname.slice(0, -10);

var logFileDate = new Date();
logFileDate = logFileDate.toLocaleString().replace(/[:]|, |[.]/g, '-');
var logFilePath = 'logs/' + logFileDate + '.txt';

function log(msg) {
    if (logging) {
        var date = new Date();
        date = date.toLocaleTimeString().replace(/[:]|, |[.]/g, '-');
        msg = date + ': ' + msg + '\r\n';
        fs.appendFileSync(logFilePath, msg);
    }
}

log('Application is launched');
log('OS Platform: '+os.platform());
log('OS Type: '+os.type());
log('OS Release: '+os.release());
log('OS Arch: '+os.arch());
log('OS Hostname: '+os.hostname());


function init() {

    log('Begin initialization')
    var langfile;


    if (chosenLang == 'ru') {
        langfile = 'lang/ru.json'
    }
    if (chosenLang == 'en') {
        langfile = 'lang/en.json'
    }
    log('Chosen language file is '+chosenLang);
    $.getJSON(langfile, function (response) {
        log('Begin parsing lang-JSON');
        jQuery(document).ready(function () {
            log('Basic template is initialized');
            lang = response;
            log('Starting initialization of basic template');
            initBaseTemplate();
            log('starting initialization of extended template');
            $('header h1').empty();
            $('header h1').append(lang.title);

            $('#note_mnp').empty();
            $('#note_mnp').append(lang.note_mnp + ' ' + '<a id="learnmore_mnp">' + lang.learnmore + '</a>');

            $('#learnmore_mnp').click(function () {
                gui.Shell.openExternal('http://pravo.gov.ru/proxy/ips/?docbody=&link_id=2&nd=102162254')
            });


            $('.block_number_check').removeClass('preinit');
            $('#input_number_check').focus();
            $('#input_number_check').attr('placeholder', lang.placeholder_input_number_check);

            $('#button_number_check').click(function () {
                log('#button_number_check is pressed');
                var provider = findProvider(strToCode($('#input_number_check').val()).def, strToCode($('#input_number_check').val()).number);
                if (provider.error != undefined) {
                    openModal(provider.error);
                } else {
                    openModal(provider.loc + '<br />' + provider.prov);
                }
            });
            $('#input_number_check').keypress(function (e) {
                if (e.keyCode == 13) {
                    log('#input_number_check is enter-pressed');
                    if ($('.modal').attr('class').indexOf('preinit') != -1) {
                        var provider = findProvider(strToCode($('#input_number_check').val()).def, strToCode($('#input_number_check').val()).number);
                        if (provider.error != undefined) {
                            openModal(provider.error);
                        } else {
                            openModal(provider.loc + '<br />' + provider.prov);
                        }
                    } else {
                        closeModal();
                    }
                }
            });

            $('input').keypress(function (e) {
                if ((e.ctrlKey == true) && (e.keyCode == 65) ||
                        (e.metaKey == true) && (e.keyCode == 65)) {
                    this.select();
                    log('Whole text in input is selected');
                }
                ;
            });

            document.onkeydown = function (e) {
                if ((e.ctrlKey == true) && (e.keyCode == 82) ||
                        (e.metaKey == true) && (e.keyCode == 82)) {
                    log('Application is reset');
                    location.reload();
                }
                if ((e.ctrlKey == true) && (e.keyCode == 81) ||
                        (e.metaKey == true) && (e.keyCode == 81)) {
                    log('Closing application');
                    gui.Window.get().close();
                }
            }

            $('#btn_about').empty();
            $('#btn_about').append(lang.btn_about);

            $('#btn_about').click(function () {
                openModal('Under construction')
            });

            $('#btn_author').empty();
            $('#btn_author').append(gui.App.manifest.author);

            $('#btn_author').click(function () {
                gui.Shell.openExternal('http://kostydenis.me')
            });


            $('.form_request').removeClass('preinit');

            $('#header_form_request').empty();
            $('#header_form_request').append(lang.header_form_request);

            $('#input_locations').attr('data-placeholder', lang.placeholder_input_locations);
            $('#input_providers').attr('data-placeholder', lang.placeholder_input_providers);
            $('#input_defs').attr('data-placeholder', lang.placeholder_input_defs);


            $('#btn_form_request').empty();
            $('#btn_form_request').append(lang.btn_form_request);

            $('#btn_form_request').click(function () {
                openExportModal()
            });

            $('#btn_clear_form_request').empty();
            $('#btn_clear_form_request').append('<span class="glyphicon glyphicon-trash" aria-hidden="true">&nbsp;</span>' + lang.btn_clear_form_request);

            $('#btn_clear_form_request').click(function () {
                log('Clear button is pressed');
                location.reload();
            });

            $('#btn_update').empty();
            $('#btn_update').append(lang.btn_update);
            $('#btn_update').click(function () {
                if (navigator.onLine == false) {
                    openModal(lang.youreoffline);
                } else {
                    updateBase();
                }
            });

            $('#input_number_check').mask('+7 (000) 000-0000');

            $('#btn_ru').click(function () {
                log('Russian language is chosen');
                $('#btn_ru').removeClass('not_pressed');
                $('#btn_en').addClass('not_pressed');
                chosenLang = 'ru';
                init();
            });
            $('#btn_en').click(function () {
                log('English language is chosen');
                $('#btn_en').removeClass('not_pressed');
                $('#btn_ru').addClass('not_pressed');
                chosenLang = 'en';
                init();
            });

            $('#export_to_txt').empty();
            $('#export_to_txt').append(lang.export_to_txt);
            $('#export_to_txt').click(function () {
                log('Exporting to txt');
                exportToTxt();
            });

            $('#export_to_excel').empty();
            $('#export_to_excel').append(lang.export_to_excel);
            $('#export_to_excel').click(function () {
                log('Exporting to excel');
                exportToExcel();
            })
        });
    })
    log('Extended template is initialized');
    base_init();

};

var base_init = function () {
    log('Staring initialization of base');
    $.getJSON('base/base.json', function (response) {

        $('.last_update').empty();
        var baseModifyDate = fs.statSync('base/base.json').mtime;
        $('.last_update').append(lang.base_last_update+baseModifyDate.toLocaleDateString().replace(/[:]|, |[.]/g, '-'));
        if (dateDiffInDays(baseModifyDate, new Date()) > 30) {
            setError();
        }

        base = response;
        log('base is opened');
        locations = getLocations();
        log('locations is formed');

        initAutocomplete();

        $('#input_locations').chosen().change(function(event, params) {
            $('#input_providers').empty();
            $('#input_defs').empty();

            locations = [];
            providers = [];

            defs = [];
            if ($('#input_locations').val() != null) { //locations is not empty
                locations = $('#input_locations').val();

                var idProv = 1;
                var idDef = 1;

                for (loc in locations) {
                    $('#input_providers').append('<optgroup label="'+locations[loc]+'" id="provider_optgroup'+ idProv +'">');
                    var tmpProviders = getProviders(locations[loc]);

                    for (prov in tmpProviders){
                        providers.push(tmpProviders[prov]);
                        $('#input_providers #provider_optgroup'+idProv).append('<option>'+tmpProviders[prov]+'</option>');

                        var tmpDefs = getDefs(locations[loc], tmpProviders[prov]);
                        $('#input_defs').append('<optgroup label="'+tmpProviders[prov].replace(/"([^"]+)"/g, '«$1»')+'" id="def_optgroup'+ idDef +'">');
                        for (def in tmpDefs) {
                            defs.push(tmpDefs[def]);
                            $('#input_defs #def_optgroup'+idDef).append('<option>'+tmpDefs[def]+'</option>');
                        }
                        idDef++;
                    }
                    idProv++;
                }

            } else { //locations is empty
                initAutocomplete();
            }

            $('#input_providers').trigger('chosen:updated');
            $('#input_defs').trigger('chosen:updated');
        });

        $('#input_providers').chosen().change(function(event, params) {

            $('#input_defs').empty();
            providers = [];
            defs = [];

            if ($('#input_providers').val() != null) { //providers is not empty
                if ($('#input_locations').val() == null) { //providers is not empty, locations is empty
                    $('#input_locations').empty();
                    $('#input_locations').attr('disabled', true);
                    locations = [];

                    var idDef = 1;
                    providers = $('#input_providers').val();
                    var tmpLocations = getLocations();
                    for (loc in tmpLocations) {
                        for (prov in providers){
                            if ($.inArray(providers[prov], Object.keys(base[tmpLocations[loc]])) != -1) {

                                var tmpDefs = getDefs(tmpLocations[loc], providers[prov]);
                                $('#input_defs').append('<optgroup label="'+tmpLocations[loc]+'" id="def_optgroup'+ idDef +'">');
                                for (def in tmpDefs) {
                                    defs.push(tmpDefs[def]);
                                    $('#input_defs #def_optgroup'+idDef).append('<option>'+tmpDefs[def]+'</option>');
                                }
                                idDef++;
                            }
                        }
                    }
                } else { //providers is not empty, locations is not empty
                    var idDef = 1;
                    providers = $('#input_providers').val();
                    for (loc in locations) {
                        for (prov in providers){
                            if ($.inArray(providers[prov], Object.keys(base[locations[loc]])) != -1) {

                                var tmpDefs = getDefs(locations[loc], providers[prov]);
                                $('#input_defs').append('<optgroup label="'+providers[prov].replace(/"([^"]+)"/g, '«$1»')+'" id="def_optgroup'+ idDef +'">');
                                for (def in tmpDefs) {
                                    defs.push(tmpDefs[def]);
                                    $('#input_defs #def_optgroup'+idDef).append('<option>'+tmpDefs[def]+'</option>');
                                }
                                idDef++;
                            }
                        }
                    }
                }
            } else { //providers is empty
                $('#input_locations').attr('disabled', false);
                if ( $('#input_locations').val() == null ) { //providers is empty, locations is empty
                    initAutocomplete();
                } else { //providers is empty, locations is not empty
                    locations = getLocations();

                    var idDef = 1;
                    for (loc in locations) {
                        var tmpProviders = getProviders(locations[loc]);
                        for (prov in tmpProviders){
                            providers.push(tmpProviders[prov]);

                            var tmpDefs = getDefs(locations[loc], tmpProviders[prov]);
                            $('#input_defs').append('<optgroup label="'+tmpProviders[prov].replace(/"([^"]+)"/g, '«$1»')+'" id="def_optgroup'+ idDef +'">');
                            for (def in tmpDefs) {
                                defs.push(tmpDefs[def]);
                                $('#input_defs #def_optgroup'+idDef).append('<option>'+tmpDefs[def]+'</option>');
                            }
                            idDef++;
                        }
                    }
                }
            }

            var startTime = Date.now();
            $('#input_locations').trigger('chosen:updated');
            $('#input_defs').trigger('chosen:updated');
            var endTime = Date.now();
            console.log('trigger: '+(endTime - startTime));
        });
        $('#input_defs').chosen().change(function(event, params) {
            if ($('#input_defs').val() != null) {
                if ( ($('#input_locations').val() == null) && ($('#input_providers').val() == null) ) {
                    $('#input_locations').attr('disabled', true);
                    $('#input_providers').attr('disabled', true);
                }
            } else {
                if ( ($('#input_locations').val() == null) && ($('#input_providers').val() == null) ) {
                    $('#input_locations').attr('disabled', false);
                    $('#input_providers').attr('disabled', false);
                    initAutocomplete();
                }
            }
            $('#input_locations').trigger('chosen:updated');
            $('#input_providers').trigger('chosen:updated');
        });



        $('#input_locations').chosen();
        $('#input_providers').chosen();
        $('#input_defs').chosen();

    });
}

function getLocations() {
    var locations = [];
    for (prop in base) {
        locations.push(prop);
    }
    return locations;
};
function getProviders(loc) {
    var providers = [];
    for (prop in base[loc]) {
        providers.push(prop);
    }
    return providers;
};
function getDefs(loc, prov) {
    var defs = [];
    for (prop in base[loc][prov]) {
        defs.push(prop);
    }
    return defs;
};


function dateDiffInDays(a, b) {
    var _MS_PER_DAY = 1000 * 60 * 60 * 24;
  // Discard the time and time-zone information.
    var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}
function updateBase() {
    showLoading();
    if (os.platform() === 'darwin') {
        // mac
        exec('open _py/dwnldData.app', function() {
            $('.last_update').empty();
            var baseModifyDate = fs.statSync('base/base.json').mtime;
            $('.last_update').append(lang.base_last_update+baseModifyDate.toLocaleDateString().replace(/[:]|, |[.]/g, '-'));
            hideLoading();
            openModal(lang.successful_update);
        });
    } else {
        // win
        exec('start _py/dwnldData.exe', function() {
            $('.last_update').empty();
            var baseModifyDate = fs.statSync('base/base.json').mtime;
            $('.last_update').append(lang.base_last_update+baseModifyDate.toLocaleDateString().replace(/[:]|, |[.]/g, '-'));
            hideLoading();
            openModal(lang.successful_update);
        });
    }
}
function initAutocomplete() {


    var startTime = Date.now();
    locations = getLocations();
    providers = [];
    defs = [];
    $('#input_locations').empty();
    $('#input_providers').empty();
    $('#input_defs').empty();



    var idProv = 1;
    var idDef = 1;

    for (loc in locations) {
        $('#input_locations').append('<option>'+locations[loc]+'</option>');


        $('#input_providers').append('<optgroup label="'+locations[loc]+'" id="provider_optgroup'+ idProv +'">');

        var tmpProviders = getProviders(locations[loc]);
        for (prov in tmpProviders){
            providers.push(tmpProviders[prov]);

            $('#input_providers #provider_optgroup'+idProv).append('<option>'+tmpProviders[prov]+'</option>');

            var tmpDefs = getDefs(locations[loc], tmpProviders[prov]);
            $('#input_defs').append('<optgroup label="'+tmpProviders[prov].replace(/"([^"]+)"/g, '«$1»')+'" id="def_optgroup'+ idDef +'">');
            for (def in tmpDefs) {
                defs.push(tmpDefs[def]);
                $('#input_defs #def_optgroup'+idDef).append('<option>'+tmpDefs[def]+'</option>');
            }
            idDef++;
        }

        idProv++;
    }
    var endTime = Date.now();
    console.log('init: '+(endTime - startTime));

    $('#input_locations').trigger('chosen:updated');
    $('#input_providers').trigger('chosen:updated');
    $('#input_defs').trigger('chosen:updated');
}


//building chosen...
function buildChoose() {

    var startTime = Date.now();

    chosenLocations = [];
    chosenProviders = [];
    chosenDefs = [];

    if ( $('#input_locations').val() != null ) {
        chosenLocations = $('#input_locations').val();
    } else {
        chosenLocations = getLocations();
    }

    if ( $('#input_providers').val() != null ) {
        chosenProviders = $('#input_providers').val();
    } else {
        for (loc in chosenLocations) {
            var tmpProviders = getProviders(chosenLocations[loc]);
            for (prov in tmpProviders) {
                chosenProviders.push(tmpProviders[prov]);
            }
        }
    }

    if ( $('#input_defs').val() != null ) {
        chosenDefs = $('#input_defs').val();
    } else {
        if ($('#input_providers').val() == null) {
            for (loc in chosenLocations) {
                var tmpProviders = getProviders(chosenLocations[loc]);
                for (prov in tmpProviders) {

                    var tmpDefs = getDefs(chosenLocations[loc], tmpProviders[prov]);
                    for (def in tmpDefs) {
                        chosenDefs.push(tmpDefs[def]);
                    }
                }
            }
        } else {
            for (loc in chosenLocations) {
                for (prov in chosenProviders) {
                    if ( $.inArray(chosenProviders[prov], getProviders(chosenLocations[loc])) != -1 ) {
                        var tmpDefs = getDefs(chosenLocations[loc], chosenProviders[prov]);
                        for (def in tmpDefs) {
                                chosenDefs.push(tmpDefs[def]);
                        }
                    }
                }
            }
        }
    }

    var endTime = Date.now();
    console.log('buildChoose() push: '+(endTime - startTime));

}


function getInterval(loc, prov, def) {
    var interval = [];
    for (prop in base[loc][prov][def]) {
        interval.push(prop);
    }
    return interval;
}
;
function isInInterval(from, nbr, to) {
    if ((nbr >= from) && (nbr <= to)) {
        return true;
    } else {
        return false;
    }
}
function strToCode(str) {
    var output = {};
    output.def = str.substring(4, 7);
    output.number = str.substring(9).replace('-', '');
    return output;
}
function findEqualDigits(first, second) {
    var count = 0;
    for (var i = 0; i < first.length; i++) {
        if (first[i] === second[i]) {
            count++;
        } else {
            return count;
        }
    }
    return count;
}
function findEqualDigitsInArray(array) {
    var count = 0;
    for (var i = 0; i < array[0].length; i++) {
        if (array[0][i] === array[1][i]) {
            count++;
        } else {
            return count;
        }
    }
    return count;
}
function findZeroQty(number) {
    var count = 0;
    var tmpNumber = number;
    while (tmpNumber[tmpNumber.length-1] === '0') {
        tmpNumber = tmpNumber.slice(0,-1);
        count++;
    }
    return count;
}
function findNineQty(number) {
    var count = 0;
    var tmpNumber = number;
    while (tmpNumber[tmpNumber.length-1] === '9') {
        tmpNumber = tmpNumber.slice(0,-1);
        count++;
    }
    return count;
}

function intervalToTemplate(partsOfInterval) {
    var output = [];
    var tmpQty;
    var nines = findNineQty(partsOfInterval[1]);
    var zeros = findZeroQty(partsOfInterval[0]);
    if (nines < zeros) {
        tmpQty = nines;
    } else {
        tmpQty = zeros;
    }
    partsOfInterval[0] = partsOfInterval[0].slice(0, -1*tmpQty); //cut off that characters from the end
    partsOfInterval[1] = partsOfInterval[1].slice(0, -1*tmpQty); //for both numbers
    tmpQty = findEqualDigitsInArray(partsOfInterval); //find quantity of the same starting characters
    var equalDigits = partsOfInterval[0].slice(0,tmpQty); //remember it, need to put before muttable part
    partsOfInterval[0] = partsOfInterval[0].slice(tmpQty); //and cut it off
    partsOfInterval[1] = partsOfInterval[1].slice(tmpQty); //for both numbers
    var diff = partsOfInterval[1] - partsOfInterval[0]; //calculating difference between interval
    if (diff == 0) {
        output.push(equalDigits+'%');
    } else {
        for (var i = parseInt(partsOfInterval[0]); i<=parseInt(partsOfInterval[0])+diff; i++) { //form template increasing first number of interval for ^diff times
            output.push(equalDigits + i + '%');
        }
    }
    return output;
}

function exportToTXT() {
    log('Starting export to txt');
    var date = new Date();
    date = date.toLocaleString().replace(/[:]|, |[.]/g, '-');
    fs.mkdirSync(saveTo+date);
    log('Folder '+date+' is created');

    if ($('#input_providers').val() == null) {
        if ($('#input_defs').val() == null) {
            for (loc in chosenLocations) {
                fs.mkdirSync(saveTo+date+'/'+chosenLocations[loc]);

                var tmpProviders = getProviders(chosenLocations[loc]);
                for (prov in tmpProviders) {
                    var file = fs.openSync(saveTo+date + '/'+chosenLocations[loc]+'/' + tmpProviders[prov] + '.txt', 'w');
                    var tmpDefs = getDefs(chosenLocations[loc], tmpProviders[prov]);
                    for (def in tmpDefs) {
                        var tmpInterval = getInterval(chosenLocations[loc], tmpProviders[prov], tmpDefs[def]);
                        for (intvl in tmpInterval) {
                            var tmpParts = intervalToTemplate(tmpInterval[intvl].split('-'));
                            for (tmpl in tmpParts) {
                                fs.writeSync(file, tmpDefs[def] + tmpParts[tmpl] + '\r\n');
                            }
                        }
                    }
                    fs.close(file);
                }
            }
        } else {
            for (loc in chosenLocations) {
                fs.mkdirSync(saveTo+date+'/'+chosenLocations[loc]);
                log('File '+chosenLocations[loc]+' is created');
                var tmpProviders = getProviders(chosenLocations[loc]);
                for (prov in tmpProviders) {
                    var file = fs.openSync(saveTo+date + '/' + chosenLocations[loc]+'/'+tmpProviders[prov] + '.txt', 'w');
                    for (def in chosenDefs) {
                        if ( $.inArray(chosenDefs[def], getDefs(chosenLocations[loc],tmpProviders[prov])) != -1 ) {
                            var tmpInterval = getInterval(chosenLocations[loc], tmpProviders[prov], chosenDefs[def]);
                            for (intvl in tmpInterval) {
                                var tmpParts = intervalToTemplate(tmpInterval[intvl].split('-'));
                                for (tmpl in tmpParts) {
                                    fs.writeSync(file, chosenDefs[def] + tmpParts[tmpl] + '\r\n');
                                }
                            }
                        }
                    }
                    fs.close(file);
                }
            }
        }
    } else {
        if ($('#input_defs').val() == null) {
            for (loc in chosenLocations) {
                fs.mkdirSync(saveTo+date+'/'+chosenLocations[loc]);
                log('File '+chosenLocations[loc]+' is created');
                for (prov in chosenProviders) {
                    var file = fs.openSync(saveTo+date + '/' + chosenLocations[loc]+'/'+chosenProviders[prov] + '.txt', 'w');
                    if ( $.inArray(chosenProviders[prov], getProviders(chosenLocations[loc])) != -1 ) {
                        var tmpDefs = getDefs(chosenLocations[loc], chosenProviders[prov]);
                        for (def in tmpDefs) {
                            var tmpInterval = getInterval(chosenLocations[loc], chosenProviders[prov], tmpDefs[def]);
                            for (intvl in tmpInterval) {
                                var tmpParts = intervalToTemplate(tmpInterval[intvl].split('-'));
                                for (tmpl in tmpParts) {
                                    fs.writeSync(file, tmpDefs[def] + tmpParts[tmpl] + '\r\n');
                                }
                            }
                        }
                    }
                    fs.close(file);
                }
            }
        } else {
            for (loc in chosenLocations) {
                fs.mkdirSync(saveTo+date+'/'+chosenLocations[loc]);
                log('File '+chosenLocations[loc]+' is created');
                for (prov in chosenProviders) {
                    var file = fs.openSync(saveTo+date + '/' + chosenLocations[loc] +'/'+chosenProviders[prov]+'.txt', 'w');
                    if ( $.inArray(chosenProviders[prov], getProviders(chosenLocations[loc])) != -1 ) {
                        for (def in chosenDefs) {
                            if ( $.inArray(chosenDefs[def], getDefs(chosenLocations[loc],chosenProviders[prov])) != -1 ) {
                                var tmpInterval = getInterval(chosenLocations[loc], chosenProviders[prov], chosenDefs[def]);
                                for (intvl in tmpInterval) {
                                    var tmpParts = intervalToTemplate(tmpInterval[intvl].split('-'));
                                    for (tmpl in tmpParts) {
                                        fs.writeSync(file, chosenDefs[def] + tmpParts[tmpl] + '\r\n');
                                    }
                                }
                            }
                        }
                    }
                    fs.close(file);
                }
            }
        }
    }

}
function exportToExcel() {

    //---------CODE WITH BUGZ
    //---cant save a lot of files in a row. need some kind of sync version of save
    // showLoading();
    // log('Starting export to excel');
    // var date = new Date();
    // date = date.toLocaleString().replace(/[:]|, |[.]/g, '-');
    // fs.mkdirSync(saveTo+date);
    // log('Excel file is created');

    // if ($('#input_providers').val() == null) {
    //     if ($('#input_defs').val() == null) {
    //         for (loc in chosenLocations) {
    //             var wb = excelbuilder.createWorkbook(saveTo+date, chosenLocations[loc]+'.xlsx');

    //             var tmpProviders = getProviders(chosenLocations[loc]);
    //             for (prov in tmpProviders) {
    //                 var sheet = wb.createSheet(tmpProviders[prov], 1, 2000);
    //                 var line = 1;
    //                 var tmpDefs = getDefs(chosenLocations[loc], tmpProviders[prov]);
    //                 for (def in tmpDefs) {
    //                     var tmpInterval = getInterval(chosenLocations[loc], tmpProviders[prov], tmpDefs[def]);
    //                     for (intvl in tmpInterval) {
    //                         var tmpParts = intervalToTemplate(tmpInterval[intvl].split('-'));
    //                         for (tmpl in tmpParts) {
    //                             sheet.set(1, line++, tmpDefs[def] + tmpParts[tmpl]);
    //                         }
    //                     }
    //                 }
    //             }
    //             wb.save(function (ok) {});
    //         }
    //     } else {
    //         for (loc in chosenLocations) {
    //             var wb = excelbuilder.createWorkbook(saveTo+date, chosenLocations[loc]+'.xlsx');

    //             var tmpProviders = getProviders(chosenLocations[loc]);
    //             for (prov in tmpProviders) {
    //                 var sheet = wb.createSheet(tmpProviders[prov], 1, 3000);
    //                 var line = 1;
    //                 for (def in chosenDefs) {
    //                     if ( $.inArray(chosenDefs[def], getDefs(chosenLocations[loc],tmpProviders[prov])) != -1 ) {
    //                         var tmpInterval = getInterval(chosenLocations[loc], tmpProviders[prov], chosenDefs[def]);
    //                         for (intvl in tmpInterval) {
    //                             var tmpParts = intervalToTemplate(tmpInterval[intvl].split('-'));
    //                             for (tmpl in tmpParts) {
    //                                 sheet.set(1, line++, chosenDefs[def] + tmpParts[tmpl]);
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // } else {
    //     if ($('#input_defs').val() == null) {
    //         for (loc in chosenLocations) {
    //             var wb = excelbuilder.createWorkbook(saveTo+date, chosenLocations[loc]+'.xlsx');

    //             for (prov in chosenProviders) {
    //                 var sheet = wb.createSheet(chosenProviders[prov], 1, 3000);
    //                 var line = 1;
    //                 if ( $.inArray(chosenProviders[prov], getProviders(chosenLocations[loc])) != -1 ) {
    //                     var tmpDefs = getDefs(chosenLocations[loc], chosenProviders[prov]);
    //                     for (def in tmpDefs) {
    //                         var tmpInterval = getInterval(chosenLocations[loc], chosenProviders[prov], tmpDefs[def]);
    //                         for (intvl in tmpInterval) {
    //                             var tmpParts = intervalToTemplate(tmpInterval[intvl].split('-'));
    //                             for (tmpl in tmpParts) {
    //                                 sheet.set(1, line++, tmpDefs[def] + tmpParts[tmpl]);
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     } else {
    //         for (loc in chosenLocations) {
    //             var wb = excelbuilder.createWorkbook(saveTo+date, chosenLocations[loc]+'.xlsx');

    //             for (prov in chosenProviders) {
    //                 var sheet = wb.createSheet(chosenProviders[prov], 1, 3000);
    //                 var line = 1;
    //                 if ( $.inArray(chosenProviders[prov], getProviders(chosenLocations[loc])) != -1 ) {
    //                     for (def in chosenDefs) {
    //                         if ( $.inArray(chosenDefs[def], getDefs(chosenLocations[loc],chosenProviders[prov])) != -1 ) {
    //                             var tmpInterval = getInterval(chosenLocations[loc], chosenProviders[prov], chosenDefs[def]);
    //                             for (intvl in tmpInterval) {
    //                                 var tmpParts = intervalToTemplate(tmpInterval[intvl].split('-'));
    //                                 for (tmpl in tmpParts) {
    //                                     sheet.set(1, line++, chosenDefs[def] + tmpParts[tmpl]);
    //                                 }
    //                             }
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // }
    // hideLoadingWOWrapper();
    // alert(lang.successful_export);

    //----------END CODE WITH BUGZ

    showLoading();
    log('Starting export to excel');
    var date = new Date();
    date = date.toLocaleString().replace(/[:]|, |[.]/g, '-');
    fs.mkdirSync(saveTo+date);
    var wb = excelbuilder.createWorkbook(saveTo+date+'/', 'defs.xlsx');
    log('Excel file is created');

    if ($('#input_providers').val() == null) {
        if ($('#input_defs').val() == null) {
            for (loc in chosenLocations) {
                var sheet = wb.createSheet(chosenLocations[loc], 1, 3000);
                log('Sheet '+chosenLocations[loc]+' is created');
                var line = 1;

                var tmpProviders = getProviders(chosenLocations[loc]);
                for (prov in tmpProviders) {

                    var tmpDefs = getDefs(chosenLocations[loc], tmpProviders[prov]);
                    for (def in tmpDefs) {
                        var tmpInterval = getInterval(chosenLocations[loc], tmpProviders[prov], tmpDefs[def]);
                        for (intvl in tmpInterval) {
                            var tmpParts = intervalToTemplate(tmpInterval[intvl].split('-'));
                            for (tmpl in tmpParts) {
                                sheet.set(1, line++, tmpDefs[def] + tmpParts[tmpl]);
                            }
                        }
                    }
                }
            }
        } else {
            for (loc in chosenLocations) {
                var sheet = wb.createSheet(chosenLocations[loc], 1, 3000);
                log('Sheet '+chosenLocations[loc]+' is created');
                var line = 1;

                var tmpProviders = getProviders(chosenLocations[loc]);
                for (prov in tmpProviders) {

                    for (def in chosenDefs) {
                        if ( $.inArray(chosenDefs[def], getDefs(chosenLocations[loc],tmpProviders[prov])) != -1 ) {
                            var tmpInterval = getInterval(chosenLocations[loc], tmpProviders[prov], chosenDefs[def]);
                            for (intvl in tmpInterval) {
                                var tmpParts = intervalToTemplate(tmpInterval[intvl].split('-'));
                                for (tmpl in tmpParts) {
                                    sheet.set(1, line++, chosenDefs[def] + tmpParts[tmpl]);
                                }
                            }
                        }
                    }
                }
            }
        }
    } else {
        if ($('#input_defs').val() == null) {
            for (loc in chosenLocations) {
                var sheet = wb.createSheet(chosenLocations[loc], 1, 3000);
                log('Sheet '+chosenLocations[loc]+' is created');
                var line = 1;

                for (prov in chosenProviders) {
                    if ( $.inArray(chosenProviders[prov], getProviders(chosenLocations[loc])) != -1 ) {
                        var tmpDefs = getDefs(chosenLocations[loc], chosenProviders[prov]);
                        for (def in tmpDefs) {
                            var tmpInterval = getInterval(chosenLocations[loc], chosenProviders[prov], tmpDefs[def]);
                            for (intvl in tmpInterval) {
                                var tmpParts = intervalToTemplate(tmpInterval[intvl].split('-'));
                                for (tmpl in tmpParts) {
                                    sheet.set(1, line++, tmpDefs[def] + tmpParts[tmpl]);
                                }
                            }
                        }
                    }
                }
            }
        } else {
            for (loc in chosenLocations) {
                var sheet = wb.createSheet(chosenLocations[loc], 1, 3000);
                log('Sheet '+chosenLocations[loc]+' is created');
                var line = 1;

                for (prov in chosenProviders) {
                    if ( $.inArray(chosenProviders[prov], getProviders(chosenLocations[loc])) != -1 ) {
                        for (def in chosenDefs) {
                            if ( $.inArray(chosenDefs[def], getDefs(chosenLocations[loc],chosenProviders[prov])) != -1 ) {
                                var tmpInterval = getInterval(chosenLocations[loc], chosenProviders[prov], chosenDefs[def]);
                                for (intvl in tmpInterval) {
                                    var tmpParts = intervalToTemplate(tmpInterval[intvl].split('-'));
                                    for (tmpl in tmpParts) {
                                        sheet.set(1, line++, chosenDefs[def] + tmpParts[tmpl]);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    wb.save(function (ok) {hideLoadingWOWrapper(); alert(lang.successful_export)});

}
function exportToScreen() {

    if ($('#input_providers').val() == null) {
        if ($('#input_defs').val() == null) {
            for (loc in chosenLocations) {
                $('#modal-content').append('<h3>' + chosenLocations[loc] + '</h3>');
                var tmpProviders = getProviders(chosenLocations[loc]);
                for (prov in tmpProviders) {

                    var tmpDefs = getDefs(chosenLocations[loc], tmpProviders[prov]);
                    for (def in tmpDefs) {
                        var tmpInterval = getInterval(chosenLocations[loc], tmpProviders[prov], tmpDefs[def]);
                        for (intvl in tmpInterval) {
                            var tmpParts = intervalToTemplate(tmpInterval[intvl].split('-'));
                            for (tmpl in tmpParts) {
                                $('#modal-content').append('<p>' + tmpDefs[def] + tmpParts[tmpl] + '</p>');
                            }
                        }
                    }
                }
            }
        } else {
            for (loc in chosenLocations) {
                $('#modal-content').append('<h3>' + chosenLocations[loc] + '</h3>');
                var tmpProviders = getProviders(chosenLocations[loc]);
                for (prov in tmpProviders) {

                    for (def in chosenDefs) {
                        if ( $.inArray(chosenDefs[def], getDefs(chosenLocations[loc],tmpProviders[prov])) != -1 ) {
                            var tmpInterval = getInterval(chosenLocations[loc], tmpProviders[prov], chosenDefs[def]);
                            for (intvl in tmpInterval) {
                                var tmpParts = intervalToTemplate(tmpInterval[intvl].split('-'));
                                for (tmpl in tmpParts) {
                                   $('#modal-content').append('<p>' + chosenDefs[def] + tmpParts[tmpl] + '</p>');
                                }
                            }
                        }
                    }
                }
            }
        }
    } else {
        if ($('#input_defs').val() == null) {
            for (loc in chosenLocations) {
                $('#modal-content').append('<h3>' + chosenLocations[loc] + '</h3>');
                for (prov in chosenProviders) {
                    if ( $.inArray(chosenProviders[prov], getProviders(chosenLocations[loc])) != -1 ) {
                        var tmpDefs = getDefs(chosenLocations[loc], chosenProviders[prov]);
                        for (def in tmpDefs) {
                            var tmpInterval = getInterval(chosenLocations[loc], chosenProviders[prov], tmpDefs[def]);
                            for (intvl in tmpInterval) {
                                var tmpParts = intervalToTemplate(tmpInterval[intvl].split('-'));
                                for (tmpl in tmpParts) {
                                    $('#modal-content').append('<p>' + tmpDefs[def] + tmpParts[tmpl] + '</p>');
                                }
                            }
                        }
                    }
                }
            }
        } else {
            for (loc in chosenLocations) {
                $('#modal-content').append('<h3>' + chosenLocations[loc] + '</h3>');
                for (prov in chosenProviders) {
                    if ( $.inArray(chosenProviders[prov], getProviders(chosenLocations[loc])) != -1 ) {
                        for (def in chosenDefs) {
                            if ( $.inArray(chosenDefs[def], getDefs(chosenLocations[loc],chosenProviders[prov])) != -1 ) {
                                var tmpInterval = getInterval(chosenLocations[loc], chosenProviders[prov], chosenDefs[def]);
                                for (intvl in tmpInterval) {
                                    var tmpParts = intervalToTemplate(tmpInterval[intvl].split('-'));
                                    for (tmpl in tmpParts) {
                                        $('#modal-content').append('<p>' + chosenDefs[def] + tmpParts[tmpl] + '</p>');
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}



function showLoading() {
    $('.modal_wrapper').removeClass('hide');
    $('#loading_anim').removeClass('hide');
}
function hideLoading() {
    $('.modal_wrapper').addClass('hide');
    $('#loading_anim').addClass('hide');
}
function hideLoadingWOWrapper() {
    $('#loading_anim').addClass('hide');
}

function setError() {
    $('#error').removeClass('hide');
    $('#error').addClass('show');
    $('#error').append('<p>' + lang.needupdate + '<a id="gonnaupdate">' + lang.gonnaupdate + '</a>' + '</p>');
    $('#error').append();
    $('#gonnaupdate').click(updateBase);
    $('#error').append('<span id="unSetError" class="glyphicon glyphicon-remove" aria-hidden="true"></span>');
    $('#unSetError').click(unSetError);

}
;
function unSetError() {
    $('#error').removeClass('show');
    $('#error').addClass('hide');
    setTimeout(function () {
        $('#error').empty();
    }, 200);
};

function chooseFile() {
    var chooser = $('#chooseDirectory');
    var val;
    chooser.unbind('change');
    chooser.change(function(evt) {
        saveTo = $(this).val() + '/';
        $('#saveTo').text(saveTo);
    });

    chooser.trigger('click');  
}

function openExportModal() {
    log('Export modal is opened');
    $('.nano').nanoScroller();
    $('.modal').addClass('nano');
    $('.modal').append('<div class="nano-content" id="modal-content"></div>');
    $('#modal-content').append('<div class="change_path_block"></div>');
    $('.change_path_block').append('<input style="display: none" id="chooseDirectory" type="file" nwdirectory nwworkingdir="'+ window.location.pathname +'" />');
    $('.change_path_block').append('<span id="currPath">'+lang.currPath+ '</span>');
    $('.change_path_block').append('<span id="saveTo">'+saveTo+ '</span>');
    $('.change_path_block').append('<button id="change_path_button">'+lang.change_path+'</button>');
    $('#change_path_button').click(chooseFile);

    $('#modal-content').append('<button class="export_btn" id="export_to_txt">' + lang.export_to_txt + '</button>');
    $('#export_to_txt').click(function () {
        exportToTXT();
        alert(lang.successful_export);
    });
    $('#modal-content').append('<button class="export_btn" id="export_to_excel">' + lang.export_to_excel + '</button>');
    $('#export_to_excel').click(function () {
        exportToExcel();
    });
    $('#modal-content').append('<button class="export_btn" id="btn_close_export_modal">OK</button>');
    $('#btn_close_export_modal').click(function () {
        closeExportModal();
    });

    $('#modal_wrapper').removeClass('hide');
    $('.modal').removeClass('preinit');

    buildChoose();
    exportToScreen();

    $('#modal-content').append('<button class="export_btn" id="export_to_txt_2">' + lang.export_to_txt + '</button>');
    $('#export_to_txt_2').click(function () {
        exportToTXT();
        alert(lang.successful_export);
    });
    $('#modal-content').append('<button class="export_btn" id="export_to_excel_2">' + lang.export_to_excel + '</button>');
    $('#export_to_excel_2').click(function () {
        exportToExcel();
    });
    $('#modal-content').append('<button class="export_btn" id="btn_close_export_modal_2">OK</button>');
    $('#btn_close_export_modal_2').click(function () {
        closeExportModal();
    });
}
function closeExportModal() {
    log('Export modal is closed');
    $('modal').removeClass('nano');
    $('#modal_wrapper').addClass('hide');
    $('.modal').addClass('preinit');
    $('.modal').empty();
    location.reload();
}

function openModal(msg) {
    log('Opened common modal with message: '+msg);
    $('#modal_wrapper').removeClass('hide');
    $('.modal').removeClass('preinit');
    $('.modal').append('<p>' + msg + '</p>');
    $('.modal').append('<button id="btn_modal_ok">OK</button>');
    $('#btn_modal_ok').click(function () {
        closeModal()
    });
}
function closeModal() {
    $('#modal_wrapper').addClass('hide');
    $('.modal').addClass('preinit');
    $('.modal').empty();
}


function findProvider(input_def, input_number) {
    log('Starting find provider');
    var output = {};
    var tmpLocations;
    var tmpProviders;
    var tmpDefs;

    for (loc in locations) {
        tmpProviders = getProviders(locations[loc]);
        for (prov in tmpProviders) {
            tmpDefs = getDefs(locations[loc], tmpProviders[prov])
            for (def in tmpDefs) {
                if (tmpDefs[def] == input_def) {

                    var tmpInterval = getInterval(locations[loc], tmpProviders[prov], tmpDefs[def]);
                    for (intvl in tmpInterval) {
                        var currInterval = tmpInterval[intvl].toString().split('-');
                        if (isInInterval(currInterval[0], input_number, currInterval[1])) {
                            output.loc = locations[loc];
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

    var tip = "";
    if (os.platform() === 'darwin') {
        tip = '<p class="input_tip">'+lang.input_tip_mac+'</p>'
    } else {
        tip = '<p class="input_tip">'+lang.input_tip_win+'</p>'
    }
    var langbuttons;
    if (chosenLang === 'ru') {
        langbuttons =
            '<div id="btn_en" class="switch_lang_btn not_pressed">en</div>' +
            '<div id="btn_ru" class="switch_lang_btn">ru</div>'
    } else {
        langbuttons =
            '<div id="btn_en" class="switch_lang_btn">en</div>' +
            '<div id="btn_ru" class="switch_lang_btn not_pressed">ru</div>'
    }

    $('body').empty();
    $('body').append(
        '<div id="modal_wrapper" class="modal_wrapper hide"></div>' +
        '<div id="modal" class="modal preinit"></div>' +
        '<img id="loading_anim" class="hide" src="_pics/loading.gif">'+
        '<header>' +
            '<img src="_pics/sled_hero.png">' +
            '<h1></h1>' +
        '</header>' +

        '<div class="content">' +
            '<div id="error" class="hide">'+
            '</div>'+

            '<div class="block_number_check preinit">' +
                '<input type="text" id="input_number_check" />' +
                '<button id="button_number_check"><span class="glyphicon glyphicon-search" aria-hidden="true"></span></button>' +
                '<p class="NB" id="note_mnp"></p>' +
            '</div>' +

            '<div class="form_request preinit">' +
                '<h2 id="header_form_request"></h2>' +
                tip +
                '<select id="input_locations" class="chosen-select" multiple >' +
                '</select>' +
                '<select id="input_providers" class="chosen-select" multiple >' +
                '</select>' +
                '<select id="input_defs" class="chosen-select" multiple >' +
                '</select>' +
                '<button id="btn_form_request"></button>' +
                '<button id="btn_clear_form_request"></button>' +
            '</div>' +

            '<div class="update">' +
                '<button id="btn_update" ></button>' +
                '<span class="last_update">2015-08-3</span>' +
            '</div>' +

            '<div class="switch_lang">' +
                langbuttons +
            '</div>' +

        '</div>' +

        '<footer>' +
            '<p><a id="btn_author"></a></p>' +
            '<p><a id="btn_about"></a></p>' +
            '<p id="lbl_year">2015</p>' +
        '</footer>'
        );
}

init('ru');