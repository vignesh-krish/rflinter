//lint js
(function(exports){
	
	 var NUM_COLS = 12;
    var COL_REGEX = /\bcol-(xs|sm|md|lg)-(\d{1,2})\b/;
    var COL_REGEX_G = /\bcol-(xs|sm|md|lg)-(\d{1,2})\b/g;
    var COL_CLASSES = [];
    var SCREENS = ['tiny', 'small', 'medium', 'large'];
    SCREENS.forEach(function (screen) {
        for (var n = 1; n <= NUM_COLS; n++) {
            COL_CLASSES.push( '.'+screen + '-' + n);
        }
    });
    var SCREEN2NUM = {
        'xs': 0,
        'sm': 1,
        'md': 2,
        'lg': 3
    };
    var NUM2SCREEN = ['xs', 'sm', 'md', 'lg'];
   var IN_NODE_JS = {};
    function compareNums(a, b) {
        return a - b;
    }

    function isDoctype(node) {
        return node.type === 'directive' && node.name === '!doctype';
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

    /**
     * Moves any grid column classes to the end of the class string and sorts the grid classes by ascending screen size.
     * @param {string} classes The "class" attribute of a DOM node
     * @returns {string} The processed "class" attribute value
     */
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
        return classes + ' ' + colClasses.join(' ');
    }

    /**
     * @param {string} classes The "class" attribute of a DOM node
     * @returns {Object.<string, integer[]>} Object mapping grid column widths (1 thru 12) to sorted arrays of screen size numbers (see SCREEN2NUM)
     *      Widths not used in the classes will not have an entry in the object.
     */
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
        this.elements = elements || cheerio('');
    }
    exports.LintError = LintError;
    var allLinters = {};
    function addLinter(id, linter) {
        if (allLinters[id]) {
            /* @covignore */
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
            /* @covignore */
            throw new Error("Invalid linter ID: " + id);
        }

        function linterWrapper($, reporter) {
            function specializedReporter(message, elements) {
                reporter(new Problem(id, message, elements));
            }
            	console.log(linter)
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
       // reporter("Columns (`.col-*-*`) can only be children of `.row`s or `.form-group`s", colsOutsideRowsAndFormGroups);
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
                console.log(linterId);
                allLinters[linterId]($, reporterWrapper);

            }
        });
    };
    (function () {
            var $ = (jQuery);
         
            exports.lintCurrentDocument = function (reporter, disabledIds) {
            	console.log("lintCurrentDocument")
                this._lint($, reporter, disabledIds);
            };
            
            exports.showLintReportForCurrentDocument = function (disabledIds, alertOpts) {
                alertOpts = alertOpts || {};
                var alertOnFirstProblem = alertOpts.hasProblems || alertOpts.hasProblems === undefined;
                var alertIfNoProblems = alertOpts.problemFree || alertOpts.problemFree === undefined;

                var seenLint = false;
                var errorCount = 0;

                var reporter = function (lint) {
                	console.log("reporter")
                    var background = "background: #" + (lint.id[0] === "W" ? "f0ad4e" : "d9534f") + "; color: #ffffff;";
                    if (!seenLint) {
                        if (alertOnFirstProblem) {
                            /*eslint-disable no-alert, no-undef, block-scoped-var */
                            window.alert("vzrfLint found errors in this document! See the JavaScript console for details.");// jshint ignore:line
                            /*eslint-enable no-alert, no-undef, block-scoped-var */
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
                    /*eslint-disable no-alert, no-undef, block-scoped-var */
                    window.alert("vzrfLint found no errors in this document.");// jshint ignore:line
                    /*eslint-enable no-alert, no-undef, block-scoped-var */
                }
            };
            /*eslint-disable no-undef, block-scoped-var */
            window.vzrfLint = exports;// jshint ignore:line
            /*eslint-enable no-undef, block-scoped-var */
        })();

})(typeof exports === 'object' && exports || this);