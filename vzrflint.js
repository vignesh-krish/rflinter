//lint js
(function(exports){
	
	 var NUM_COLS = 12;   
    var COL_CLASSES = [];
    
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
        console.log(classes + ' ' + colClasses.join(' '))
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
            reporter("Only columns (`.col-*-*`) may be immediate children of `.row`s", nonColRowChildren);
        }
    });
    addLinter("E003", function lintImgWithoutAlt($, reporter) {       
        var selector = 'img:not([alt]),img[alt=""],img[alt=" "]';
        var nonAltImages = $(selector);
        if (nonAltImages.length) {
            reporter("<img>  should have a non empty alt attr", nonAltImages);
        }
    });
     addLinter("E020", function lintTDParentsAreTR($, reporter) {       
        var selector = '*:not(tr)>td';
        var nonTRChildren = $(selector);
        if (nonTRChildren.length) {
            reporter("<td> should be in <tr>", nonTRChildren);
        }
    });
      addLinter("E004", function lintInputsWithSameID($, reporter) {    
		  $('[id]').each(function(){
		  var id = $('[id="'+this.id+'"]');
		  var labelFor =$('label[for="'+ id+'"]');
		  if(id.length>1 && id[0]==this) {
		  	id.addClass('duplicated-input');
		    console.log('Duplicate id '+this.id);
		   // alert('duplicate found');
		  }
});   
        var selector = '.duplicated-input';
        var duplicatedInput = $(selector);
        if (duplicatedInput.length) {
            reporter("duplicate input ids found", duplicatedInput);
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
                        if (alertOnFirstProblem) {
                           
                            window.alert("vzrfLint found errors in this document! See the JavaScript console for details.");
                            
                        }
                        seenLint = true;
                    }

                    if (!lint.elements.length) {
                        console.warn("vzrfLint: %c " + lint.id + " ", background, lint.message);
                    }
                    else {
                        console.warn("vzrfLint: %c " + lint.id + " ", background, lint.message + '\n', lint.elements);
                    }
                    errorCount++;
                };
                this.lintCurrentDocument(reporter, disabledIds);

                if (errorCount > 0) {
                    console.info("vzrfLint: For details, look up the lint problem IDs in the html");
                }
                else if (alertIfNoProblems) {
                   
                    window.alert("vzrfLint found no errors in this document.");// jshint ignore:line
                    
                }
            };
           
            window.vzrfLint = exports;
        })();

})(typeof exports === 'object' && exports || this);

$(window).on('load',function(){
	vzrfLint.showLintReportForCurrentDocument([]);
});
