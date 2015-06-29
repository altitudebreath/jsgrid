var Lib = (function(){
    function stub() {};
    
    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }
    
    function isObject(obj) {
        return Object.prototype.toString.call(obj) === '[object Object]';
    }

    function log(msg, data) {
        if (data) {
            var d = {};
            d[msg] = data;
            Logger.log(d);
        }else{
            Logger.log(msg);
        }
    }

    function trace(err) {
        var errInfo = "ERROR:\n";
        for (var prop in err) {
            errInfo += prop + ": " + err[prop] + "\n";
        }
        return errInfo;
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
            var ss = SpreadsheetApp.openById(CONSTANTS.ADMIN_SPREADSHEET_ID);
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
            t._instance = params;//extend({}, params, CONSTANTS); 
            
            return t._instance;
        }
    };
    
//====================================================================================================
//====================================================================================================

    function errorRender(templateName, exception) {
        var template = HtmlService.createTemplateFromFile(templateName);
        template.exception = exception;
        return template.evaluate()
            .setTitle('Error')
            .setSandboxMode(HtmlService.SandboxMode.IFRAME);
    }
    
    function Renderer(appTitle, rootTemplate, contextName, context){
        var t = this;
        t._appTitle = appTitle;
        t._rootTemplate = rootTemplate || "index";
        //root context, is applied to all templates before other contexts when rendering
        t._context = context;
        t._contextName = contextName;
        t._baseTemplate = HtmlService.createTemplateFromFile(t._rootTemplate);
    }

    Renderer.prototype.renderAsRoot = function (templateName, pageContext) {
        return this._render(false, templateName, pageContext)
    }
    
    Renderer.prototype.render = function (templateName, pageContext) {
        return this._render(true, templateName, pageContext)
    }
    
    Renderer.prototype._render = function (inheritFromRoot, templateName, pageContext){
        var t = this;
        
        var viewTemplate = HtmlService.createTemplateFromFile(templateName);
        
        var currentContext = extend({}, t._context, pageContext);
        
        viewTemplate[t._contextName] = currentContext;
        
        var template;
        if (inheritFromRoot){
            //root template should update its current context too
            t._baseTemplate[t._contextName] = currentContext;

            //now, render our view template into the base with bounded context
            t._baseTemplate.viewContent = 
                viewTemplate.evaluate().getContent();
            
            template = t._baseTemplate;            
        }else{
            template = viewTemplate;
        }
        
        // Build and return HTML in IFRAME sandbox mode.
        return template.evaluate()
            .setTitle(t._appTitle)
            .setSandboxMode(HtmlService.SandboxMode.IFRAME);
        
    }
    
    
//====================================================================================================
//====================================================================================================
    function Page(urlParameters, defaultPage) {
        var t = this;
        t._url = ScriptApp.getService().getUrl();
        t._valid = null;
        t._urlPar = urlParameters.parameter;
        t._defaultPageName = defaultPage;
        t._pageName = (t._urlPar.page || '').toString().replace(/^\//, '');

        if (t._pageName === ''){
            t._pageName = t._defaultPageName;
        }
        
        //if _pageName was not '' and it is incorrect, e.g. blalba/strange*page
        //it remais such. Use isValid() to validate
        t._path = t._pageName.split('/');
        
        t._templateName = t._pageName.replace(/\//g, '_');
    }

    Page.prototype.isValid = function () {
        var t = this;
        //memorize if already validated
        if(t._valid === null){
            t._valid = 
                (t._path.length >= 2) && 
                (t._path.length < 10) && //10 is some reasonable limit of nesting
                /\w+/.test(t._pageName.replace(/\//g, ''))
        }
        return t._valid;
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
        return t._params['role.' + CONSTANTS.ROLE_ALL].indexOf(emailToCheck) !== -1;

    }    
    
    Auth.prototype.validateRole = function (page, userEmail) {
        var t = this;
        
        var emailToCheck = userEmail ? userEmail : t._runningUser;
        
        //need to check permissions to this specific page
        //return after having found the first role permitting this page
        for (var role in CONSTANTS.ROLE) {
            //log('role', role);
            //log('emailToCheck', emailToCheck);
            //log("t._params['role.' + role] = ", t._params['role.' + role]);
            //log('CONSTANTS.ROLE[role].allowedPrefixes = ', CONSTANTS.ROLE[role].allowedPrefixes);
            //log('page.getPrefix()', page.getPrefix());
            if (t._params['role.' + role].indexOf(emailToCheck) !== -1 &&
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
        log: log,
        errorRender: errorRender,
        trace: trace,
        
    };
})();    
