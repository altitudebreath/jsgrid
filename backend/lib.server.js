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
    
//====================================================================================================
//====================================================================================================
    
    function Configurator(){
        this._instance = null;
    }
    
    Configurator.prototype._getByType = function (value, atype, splitter) {
        var handlers = {
            'string': function(val){return val.toString();},
            'integer': function(val){return parseInt(val);},
            'float': function(val){return parseFloat(val);},
            'JSON': function(val){return JSON.parse(val.toString());},
            'date': function(val){return new Date(val);},
            'list': function(val){return val.toString().split(new RegExp('\\s*' + splitter + '\\s*'));},
            'array': function(val){return val.toString().split(splitter);},
        }
        
        return handlers[atype](value);
    }
    
    Configurator.prototype.get = function () {
        var t = this;
        if (t._instance) {
            return t._instance;
        } else {
            var ss = SpreadsheetApp.getById(CONSTANTS.ADMIN_SPREADSHEET_ID);
            var paramSheet = ss.getSheetByName(CONSTANTS.PARAMETERS_SHEET_NAME);
            var values = paramSheet.getDataRange().getValues();
            var params = {};
            for (var i = CONSTANTS.PARAM_ROWS_STARTS_FROM - 1; i < values.length; i++){
                var row = values[i];
                params[row[CONSTANTS.PARAM_NAME_POSITION - 1]] = 
                    t._getByType(
                        row[CONSTANTS.PARAM_VALUE_POSITION - 1], 
                        row[CONSTANTS.PARAM_TYPE_POSITION - 1],
                        row[CONSTANTS.ITEMS_SPLITTER_POSITION - 1]
                    );
            }
            t._instance = extend({}, CONSTANTS, params); //CONSTANTS can be overridden then..., but tricky
            
            return t._instance;
        }
    };
    
//====================================================================================================
//====================================================================================================
    
    function Renderer(rootTemplate, contextName, context){
        var t = this;
        t._rootTemplate = rootTemplate || "index";
        t._context = context;
        t._contextName = contextName;
        t._baseTemplate = HtmlService.createTemplateFromFile(t._rootTemplate);
    }

    Renderer.prototype.renderAsRoot = function (pageName, extraContext) {
        this._render(false, pageName, extraContext)
    }
    
    Renderer.prototype.render = function (pageName, extraContext) {
        this._render(true, pageName, extraContext)
    }
    
    Renderer.prototype._render = function (inheritFromRoot, pageName, extraContext){
        var t = this;
        
        var viewTemplate = HtmlService.createTemplateFromFile(pageName);
        
        viewTemplate[t._contextName] = extend({}, t._context, extraContext);
        
        var template;
        if (inheritFromRoot){
            //now, render our view template into the base with bounded context
            t._baseTemplate.viewContent = 
                viewTemplate.evaluate().getContent();
            template = t._baseTemplate;            
        }else{
            template = viewTemplate;
        }
        
        // Build and return HTML in IFRAME sandbox mode.
        return template.evaluate()
            .setTitle('Web App Experiment')
            .setSandboxMode(HtmlService.SandboxMode.IFRAME);
        
    }
    
    
//====================================================================================================
//====================================================================================================
    function Page(urlParameters, defaultPage) {
        var t = this;
        t._url = ScriptApp.getService().getUrl();
        t._urlPar = urlParameters.parameters;
        t._defaultPageName = defaultPage;
        t._pageName = (t._urlPar.page || '').replace(/^\//, '');

        if (t._pageName === ''){
            t._pageName = t._defaultPageName;
        }

        t._path = t._pageName.split('/');
        
        t._templateName = t._pageName.replace(/\//g, '_');
    }

    Page.prototype.isValid = function () {
        var t = this;
        return t._path.length >= 2 && t._path.length < 10; //10 is some reasonable limit of nesting
    }

    Page.prototype.getUrl = function (templateName) { 
        var t = this;
        return t._url + '?page=' + 
            (templateName.replace(/_/g, '/') || t._pageName); 
    }

    Page.prototype.getName = function () {
        return this._pageName;
    }

    Page.prototype.getTemplateName = function () {
        return this._templateName;
    }

    Page.prototype.getPrefix = function () {
        return this._path[0];
    }
//====================================================================================================
//====================================================================================================

    function Auth(confInstance){
        var t = this;
        t._runningUser = Session.getActiveUser().getEmail();
        t._params = confInstance;
    }
    
    Auth.prototype.validate = function (userEmail) {
        var t = this;
        
        var emailToCheck = userEmail ? userEmail : t._runningUser;
        
        //just need to check if user has access at all (is in ALL group)
        return t._params['roles.ALL'].indexOf(emailToCheck) !== -1;

    }    
    
    Auth.prototype.validateRole = function (page, userEmail) {
        var t = this;
        
        var emailToCheck = userEmail ? userEmail : t._runningUser;
        
        //need to check permissions to this specific page
        for (var role in CONSTANTS.ROLE) {
            if (t._params['roles.' + role].indexOf(emailToCheck) !== -1 &&
                CONSTANTS.ROLE[role].allowedPrefixes.indexOf(page.getPrefix()) !== -1 
            ){
                return true;
            }
        }
        
        return false;
    }    
    
//====================================================================================================
//====================================================================================================
    return {
        stub: stub,
        isArray: isArray,
        isObject: isObject,
        extend: extend,
        Configurator: Configurator,
        Renderer: Renderer,
        Auth: Auth,
        Page: Page,
        parameters: new Configurator(),
        
    };
})();    
