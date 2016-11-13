//lint js
(function(exports){
	
	 var NUM_COLS = 12;   
    var COL_CLASSES = [];
    var SCREENS = ['tiny', 'small', 'medium', 'large'];
    SCREENS.forEach(function (screen) {
        for (var n = 1; n <= NUM_COLS; n++) {
            COL_CLASSES.push( '.'+screen + '-' + n);
        }
    });
   
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
