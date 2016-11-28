//lint js
(function(exports){
	
	var NUM_COLS = 12;   
    var COL_CLASSES = [];
    var TOOLTIP='<div class="w_tooltip"  data-tooltip=""><div class="tooltip_x" data-close-tooltip></div><h4 data-tip-title> Test</h4> <p data-message>Static error message</p></div>';
    var COL_REGEX = /\b(tiny|small|medium|large)-(\d{1,2})\b/;
    var COL_REGEX_G = /\b(tiny|small|medium|large)-(\d{1,2})\b/g;
    var SCREENS = ['tiny', 'small', 'medium', 'large'];
    SCREENS.forEach(function (screen) {
        for (var n = 1; n <= NUM_COLS; n++) {
            COL_CLASSES.push( '.'+screen + '-' + n);
        }
    });
    var SCREEN2NUM = {
        'tiny': 0,
        'small': 1,
        'medium': 2,
        'large': 3
    };
    var NUM2SCREEN = ['tiny', 'small', 'medium', 'large '];
     function compareNums(a, b) {
        return a - b;
    }
    function highlightProblem(lint){
    	//	$(lint.elements).css({'border':'1px solid red'});
		var lintId = lint.id;
		//var lintMessage =lint.message;
		if(lintId.indexOf('E')>-1){
		//var toolTip = '<div class="w_tooltip"  data-tooltip="'+lintId+'"><div class="tooltip_x" data-close-tooltip></div><h6 class="margin-bottom-small text-brand-1" data-tip-title>'+lintId+'</h4> <p data-message>'+lintMessage+'</p></div>';
		var message="<span class='error-number pointer' data-open-linterTip='"+lintId+"'>"+lintId+"</span>";
		//var errorMessage = $(message).append(toolTip);
		$(lint.elements).after(message);
		createToolip(lint);
		//$(lint.elements).wrap("<div class='error-highlighter'>  <a class='error-number pointer' title='Please refer browser console for more info'><span class='vzicon icon-alert text-alert small'></span></a></div>");
		}
		else{
		$(lint.elements).append("<span class='warning-number pointer' title='Please refer browser console for more info'>"+lintId+"</span>");
		}
		
    }
    function createToolip(lint){
    	var lintId = lint.id;
    	var lintMessage =lint.message;
   		var toolTip = '<div class="w_tooltip"  data-linterTip="'+lintId+'"><div class="tooltip_x" data-close-linterTip></div><h6 class="margin-bottom-micro text-brand-1" data-tip-title>'+lintId+'</h4> <p data-message>'+lintMessage+'</p></div>';
   		$('body').append(toolTip);

    }
       function withoutClass(classes, klass) {
        return classes.replace(new RegExp('\\b' + klass + '\\b', 'g'), '');
    }
     function columnClassKey(colClass) {
        return SCREEN2NUM[COL_REGEX.exec(colClass)[1]];
    }

    function compareColumnClasses(a, b) {
        return columnClassKey(a) - columnClassKey(b);
    }


       function incrementingRunsFrom(list) {
        list = list.concat([Infinity]);// use Infinity to ensure any nontrivial (length >= 2) run ends before the end of the loop
        var runs = [];
        var start = null;
        var prev = null;

        for (var i = 0; i < list.length; i++) {
            var current = list[i];            
            if (start === null) {
                // first element starts a trivial run
                start = current;
            }
            else if (prev + 1 !== current) {
                // run ended
                if (start !== prev) {
                    // run is nontrivial
                    runs.push([start, prev]);
                }
                // start new run
                start = current;
            }
            // else: the run continues

            prev = current;
        }

        return runs;
    }
    function sortedColumnClasses(classes) {
        // extract column classes
        var colClasses = [];
        while (true) {
            var match = COL_REGEX.exec(classes);
            if (!match) {
                break;
            }
            var colClass = match[0];
            colClasses.push(colClass);
            
            classes = withoutClass(classes, colClass);

        }

        colClasses.sort(compareColumnClasses);
       // console.log(classes + ' ' + colClasses.join(' '))
        return classes + ' ' + colClasses.join(' ');
    }

    function width2screensFor(classes) {
        var width = null;
        var width2screens = {};
        while (true) {
            var match = COL_REGEX_G.exec(classes);
            if (!match) {
                break;
            }
            var screen = match[1];            
            width = match[2];
            
            var screens = width2screens[width];
            
            if (!screens) {
                screens = width2screens[width] = [];
            }
            screens.push(SCREEN2NUM[screen]);
            
        }

        for (width in width2screens) {
            if (width2screens.hasOwnProperty(width)) {
                width2screens[width].sort(compareNums);
            }
        }
        	
        return width2screens;
    }
    function LintWarning(id, message, elements) {
        this.id = id;
        this.message = message;
        this.elements = elements || cheerio('');
    }
    exports.LintWarning = LintWarning;
     function LintError(id, message, elements) {
        this.id = id;
        this.message = message;
        this.elements = elements;
    }
    exports.LintError = LintError;
    var allLinters = {};
    function addLinter(id, linter) {
        if (allLinters[id]) {
            
            throw new Error("Linter already registered with ID: " + id);
        }

        var Problem = null;
        if (id[0] === 'E') {
            Problem = LintError;
        }
        else if (id[0] === 'W') {
            Problem = LintWarning;
        }
        else {
          
            throw new Error("Invalid linter ID: " + id);
        }

        function linterWrapper($, reporter) {
            function specializedReporter(message, elements) {
                reporter(new Problem(id, message, elements));
            }
            	
            linter($, specializedReporter);
        }

        linterWrapper.id = id;
        allLinters[id] = linterWrapper;
    }
    addLinter("E001", function lintColParentsAreRows($, reporter) {

        var selector = '*:not(.row)>.column,*:not(.row)>.columns,'+ COL_CLASSES.map(function (colClass) {
            return '*:not(.row)>[class^="column"]' + colClass ;
        }).join(',');

        var colsOutsideRowsAndFormGroups = $(selector);       
      
        if (colsOutsideRowsAndFormGroups.length) {
            reporter("Columns (`.columns *-*`) can only be children of `.row`s", colsOutsideRowsAndFormGroups);
        }
    });
    addLinter("E002", function lintRowChildrenAreCols($, reporter) {
        var ALLOWED_CHILDREN = COL_CLASSES;
        var selector = '.row>*:not([class^="column"]' + ALLOWED_CHILDREN.map(function (colClass) {
            return '.row>*:not([class^="column"]' + colClass + ')';
        }).join('');

        var nonColRowChildren = $(selector);
        if (nonColRowChildren.length) {
            reporter("Only columns  may be immediate children of `.row`s", nonColRowChildren);
        }
    });
    addLinter("E003", function lintImgWithoutAlt($, reporter) {       
        var selector = 'img:not([alt]),img[alt=""],img[alt=" "]';
        var nonAltImages = $(selector);
        if (nonAltImages.length) {
            reporter("img element should have a non empty alt attr", nonAltImages);
        }
    });
     addLinter("E020", function lintTDParentsAreTR($, reporter) {       
        var selector = '*:not(tr)>td';
        var nonTRChildren = $(selector);
        if (nonTRChildren.length) {
            reporter("<td> should be in <tr>", nonTRChildren);
        }
    });
     addLinter("E007", function lintInputIDLabelForMismatch($, reporter) {  
            
        $('input[id]').each(function(){
        	var idVal = $(this).attr('id');
        	var elem=$(this).filter(function() { return !$(this).closest().is('label[for="'+idVal+'"]') });
        	elem.addClass('no-associated-label');
			if($(this).is('[type="checkbox"]')){
				$(this).next('label').addClass('no-associated-label');
			}
        });       
         var selector = '.no-associated-label'
       var noLabelAssociatedInput =  $(selector);
        if (noLabelAssociatedInput.length) {
            reporter("Input(s) without associated label or the label for attr does not match ", noLabelAssociatedInput);
        }
    });
    
      addLinter("E004", function lintInputsWithSameID($, reporter) {    
		  $('input[id]').each(function(){
		  var id = $('[id="'+this.id+'"]');		  
		  if(id.length>1 && id[0]==this) {
		  	id.addClass('duplicated-input');		 
		  }
		});   
        var selector = '.duplicated-input';
        var duplicatedInput = $(selector);
        if (duplicatedInput.length) {
            reporter("duplicate input ids found", duplicatedInput);
        }
    });
      addLinter("E005", function lintSelectWithSameID($, reporter) {    
		  $('select[id]').each(function(){
		  var id = $('[id="'+this.id+'"]');		  
		  if(id.length>1 && id[0]==this) {
		  	id.addClass('duplicated-select');		   
		  }
		});   
        var selector = '.duplicated-select';
        var duplicatedSelect = $(selector);
        if (duplicatedSelect.length) {
            reporter("duplicate select ids found", duplicatedSelect);
        }
    });
      addLinter("E006", function lintLabelWithSameFor($, reporter) {    
		  $('label[for]').each(function(){	

		  var thisFor = $(this).attr('for');	
		 // console.log(thisFor)
		  var labelFor =$('label[for="'+ thisFor+'"]');
		  if(labelFor.length>1 && labelFor[0]==this) {
		  	labelFor.addClass('duplicated-label');
		   // console.log('Duplicate id '+this.for);
		   // alert('duplicate found');
		  }
		});   
        var selector = '.duplicated-label';
        var duplicatedInput = $(selector);
        if (duplicatedInput.length) {
            reporter("Found duplicate  for attr in  label(s)", duplicatedInput);
        }
    });
       
     addLinter("E008", function lintRedundantColumnClasses($, reporter) {
        var columns = $(COL_CLASSES.join(','));
        columns.each(function (_index, col) {
            var column = $(col);
            var classes = column.attr('class');
            var simplifiedClasses = classes;
            var width2screens = width2screensFor(classes);
            var isRedundant = false;
            for (var width = 1; width <= NUM_COLS; width++) {
                var screens = width2screens[width];
                if (!screens) {
                    continue;
                }
                var runs = incrementingRunsFrom(screens);
                if (!runs.length) {
                    continue;
                }

                isRedundant = true;

                for (var i = 0; i < runs.length; i++) {
                    var run = runs[i];
                    var min = run[0];
                    var max = run[1];

                    // remove redundant classes
                    for (var screenNum = min + 1; screenNum <= max; screenNum++) {
                        var colClass = 'col-' + NUM2SCREEN[screenNum] + '-' + width;
                        simplifiedClasses = withoutClass(simplifiedClasses, colClass);
                    }
                }
            }
            if (!isRedundant) {
                return;
            }

            simplifiedClasses = sortedColumnClasses(simplifiedClasses);
            simplifiedClasses = simplifiedClasses.trim().split(" ")[0];
            var oldClass = '`class="' + classes + '"`';
            var newClass = '`class="' + simplifiedClasses + '"`';
            reporter(
                "Since grid classes apply to devices with screen widths greater than or equal to the breakpoint sizes (unless overridden by grid classes targeting larger screens), " +
                oldClass + " is redundant and can be simplified to " + newClass,
                column
            );
        });
    });
     addLinter("E009", function lintInputWithoutIdOrTitle($, reporter) {       
        var noIdInput = 'input:not([id]),input[id=""],input[id=" "]';
        $(noIdInput).each(function(){
        	var nonTitle =$(this).filter(function() { return !$(this).is('[title]') });
        	$(nonTitle).addClass('input-no-id');
        });
        var selector = '.input-no-id';
        var noIdOrTitle = $(selector);
        if (noIdOrTitle.length) {
            reporter("Input(s) should have a title if it is not associated with a label  ", noIdOrTitle);
        }
    });
      addLinter("E010", function lintSelectWithoutIdOrTitle($, reporter) {       
        var noIdSelect = 'select:not([id]),select[id=""],select[id=" "]';
        $(noIdSelect).each(function(){
        	var nonTitle =$(this).filter(function() { return !$(this).is('[title]') });
        	$(nonTitle).addClass('select-no-id');
        });
        var selector = '.select-no-id';
       var noIdOrTitle = $(selector);
        if (noIdOrTitle.length) {
            reporter("select(s) should have a title if it is not associated with a label  ", noIdOrTitle);
        }
    });
      addLinter("W00A1", function lintSRonlyAfterIcons($, reporter) {       
        
         //var selector = 
        var noSrOnly =  $('.vzicon').filter(function() { return !$(this).next().is('.sr-only') });//$(selector);
        if (noSrOnly.length) {
            reporter("It is recommended to have sr-only description for Non-decorative icons as per vzrf A11y convention ", noSrOnly);
        }
    });
        addLinter("W00A2", function lintAnchorWithNoTitle($, reporter) {       
        
         var selector = ':not(.ui-datepicker) a, a:not([title]),a[title=""],a[title=" "]';
        var noTitleAnchor =  $(selector);
        if (noTitleAnchor.length) {
            reporter("It is recommended to have title attr for <a> elements  as per basic accessibility", noTitleAnchor);
        }
    });
    
      exports._lint = function ($, reporter, disabledIdList, html) {
       var reporterWrapper = reporter;

        var disabledIdSet = {};
        disabledIdList.forEach(function (disabledId) {
            disabledIdSet[disabledId] = true;
        });
        Object.keys(allLinters).sort().forEach(function (linterId) {
            if (!disabledIdSet[linterId]) {
               // console.log(linterId);
                allLinters[linterId]($, reporterWrapper);

            }
        });
    };
    (function () {
            var $ = (jQuery);
         
            exports.lintCurrentDocument = function (reporter, disabledIds) {
            	//console.log("lintCurrentDocument")
                this._lint($, reporter, disabledIds);
            };
            
            exports.showLintReportForCurrentDocument = function (disabledIds, alertOpts) {
                alertOpts = alertOpts || {};
                var alertOnFirstProblem = alertOpts.hasProblems || alertOpts.hasProblems === undefined;
                var alertIfNoProblems = alertOpts.problemFree || alertOpts.problemFree === undefined;

                var seenLint = false;
                var errorCount = 0;

                var reporter = function (lint) {
                	
                    var background = "background: #" + (lint.id[0] === "W" ? "f0ad4e" : "d9534f") + "; color: #ffffff;";
                    if (!seenLint) {
                        /*if (alertOnFirstProblem) {
                           
                            window.alert("vzrfLint found errors in this document! See the JavaScript console for details.");
                            
                        }*/
                        seenLint = true;
                    }

                    if (!lint.elements.length) {
                        console.warn("vzrfLint: %c " + lint.id + " ", background, lint.message);
                    }
                    else {
                        console.warn("vzrfLint: %c " + lint.id + " ", background, lint.message + '\n', lint.elements);
                        highlightProblem(lint);
                    }
                    errorCount++;
                };
                this.lintCurrentDocument(reporter, disabledIds);

                if (errorCount > 0) {
                    console.info("vzrfLint: For details, look up the lint problem IDs in the html");
                    appendMessageDiv(errorCount);
                }
                else if (alertIfNoProblems) {
                   
                    window.alert("vzrfLint found no errors in this document.");// jshint ignore:line
                    
                }
            };
           
            window.vzrfLint = exports;
        })();

})({});

$(window).on('load',function(){
	$('head').append('<style type="text/css">.lintErrorReport{position:fixed;top:0; display:none; z-index:2;height:70px;font-family:"BrandFont";width:100%; border:1px solid #C6E9FD; padding:12px; background:#E8F6FE;} .lintErrorReport.shown+body{margin-top:70px;} span.error-number { top: 0; right: 0; width: auto; background: #ffcfd0; padding: 5px; border-radius: 4px; border: 2px solid #f79973; box-shadow: 0 3px 8px 1px #a2a2a2; font-weight: bold; color: #000; display:inline-block;} .warning-highlighter { position: relative; width: auto;  padding: 10px; } span.warning-number { position: static; display:inline-block;top: 0; right: 0; width: auto; background: #f8d362; padding: 5px; color: #000; border: 2px solid brown; font-weight: bold; border-radius: 4px; box-shadow: 0 3px 8px 1px #a2a2a2; }</style>');
	vzrfLint.showLintReportForCurrentDocument([]);
 
	$('[data-open-linterTip]').on('click',function(){
			showTooltip(this);
	});
	$('[data-close-linterTip]').on('click',function(){
			hideTooltip(this);
	});
	/*$(document).on('click',function(event){
			if (!$(event.target).is("[data-linterTip],[data-open-linterTip],[data-message],[data-tip-title]")) {
        			hideTooltip();
        			console.log(event.target)
    		} 
	});
	*/
});
function showTooltip(thisTip){
	hideTooltip();
	var attrVal = $(thisTip).attr('data-open-linterTip');
	var topPos = $(thisTip).offset().top,leftPos= $(thisTip).offset().left;
	$('[data-linterTip='+attrVal+']').css({
		'display':'block',
		'position':'absolute',
		'top':topPos,
		'left':leftPos + 40
	});
}
function hideTooltip(toHide){
		if(typeof toHide =='undefined'){
			$('[data-linterTip]').hide();
		}
		else{
			$(toHide).parent().hide();
		}

	}
function appendMessageDiv(errorCount){
	var noOfErrors = $('.error-number').length,
		noOfWarnings = $('.warning-number').length;

	$('body').before('<div class="lintErrorReport shadow text-center"><p class=" margin-bottom-zero bold">Linter found '+noOfErrors+' <span class="text-alert">error(s)</span> and '+noOfWarnings+' <span class="text-warning">warning(s)</span>.</p><p class="margin-bottom-zero">Click on the lint ID or see console for more info.</p></div>').css('transition','margin 1s ease-in');
	$('.lintErrorReport').addClass('shown').slideDown(1000)
}
