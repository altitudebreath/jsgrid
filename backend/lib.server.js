var Lib = (function(){
    function stub() {};
    
    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }
    
    function isObject(obj) {
        return Object.prototype.toString.call(obj) === '[object Object]';
    }
    
    
    /**
     * Extends or overwrites
     * @returns {*|{}}
     */
    function extend() {
        var destination = arguments[0] || {};
        for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            if (source) {
                for (var property in source) {
                    if (source.hasOwnProperty(property)) {
                        destination[property] = source[property];
                    }
                }
            }
        }
        return destination;
    };
    
    //============================================================================================================
    
    function Parameters(){
        this._instance = null;
    }
    
    Parameters.prototype._getByType = function (value, atype, splitter) {
        var handlers = {
            'string': function(val){return val.toString();},
            'integer': function(val){return parseInt(val);},
            'float': function(val){return parseFloat(val);},
            'JSON': function(val){return JSON.parse(val.toString());},
            'date': function(val){return new Date(val);},
            'list': function(val){return val.toString().split(splitter);}
        }
        
        return handlers[atype](value);
    }
    
    Parameters.prototype.get = function () {
        var self = this;
        if (self._instance) {
            return self._instance;
        } else {
            var ss = SpreadsheetApp.getById(CONSTANTS.ADMIN_SPREADSHEET_ID);
            var paramSheet = ss.getSheetByName(CONSTANTS.PARAMETERS_SHEET_NAME);
            var values = paramSheet.getDataRange().getValues();
            var params = {};
            for (var i = CONSTANTS.PARAM_ROWS_STARTS_FROM - 1; i < values.length; i++){
                var row = values[i];
                params[row[CONSTANTS.PARAM_NAME_POSITION - 1]] = 
                    self._getByType(
                        row[CONSTANTS.PARAM_VALUE_POSITION - 1], 
                        row[CONSTANTS.PARAM_TYPE_POSITION - 1],
                        row[CONSTANTS.ITEMS_SPLITTER_POSITION - 1]
                    );
            }
            self._instance = extend(params, CONSTANTS);
            
            return self._instance;
        }
    };
    
    //==============================================================================================================
    
    function Renderer(rootTemplate, contextName, context){
        var self = this;
        self._rootTemplate = rootTemplate || "index";
        self._context = context;
        self._contextName = contextName;
        self._baseTemplate = HtmlService.createTemplateFromFile(self._rootTemplate);
    }
    
    Renderer.prototype.render = function (pageName, extraContext){
        var self = this;
        
        var viewTemplate = HtmlService.createTemplateFromFile(pageName);
        
        viewTemplate[self._contextName] = extend({}, self._context, extraContext);
        
        //now, render our view template into the base with bounded context
        self._baseTemplate.viewContent = 
            viewTemplate.evaluate().getContent();
        
        // Build and return HTML in IFRAME sandbox mode.
        return self._baseTemplate.evaluate()
            .setTitle('Web App Experiment')
            .setSandboxMode(HtmlService.SandboxMode.IFRAME);
        
    }
    
    return {
        stub: stub,
        isArray: isArray,
        isObject: isObject,
        extend: extend,
        Parameters: Parameters,
        Renderer: Renderer,
        
    };
})();    
