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
    
    
    function columnToLetter(column) {
        if (typeof column === "string") return column;
        
        var temp, letter = '';
        while (column > 0) {
            temp = (column - 1) % 26;
            letter = String.fromCharCode(temp + 65) + letter;
            column = (column - temp - 1) / 26;
        }
        return letter;
    }

    function letterToColumn(letter) {
        if (typeof letter === "number") return letter;
        
        var column = 0, length = letter.length;
        for (var i = 0; i < length; i++) {
            column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
        }
        return column;
    }
    
    function appendRows(sheet, dataOrRowsNumber, optStartColumn, columnNameToScanForEnd) {
        var max_rows = sheet.getMaxRows();
        var last_row = 1;
        if (columnNameToScanForEnd){
            var values  = sheet.getRange(columnNameToScanForEnd + '1:' + columnNameToScanForEnd).getValues();
            for (var r = values.length - 1; r >= 0; r--){
                if (values[r][0]) {
                    last_row = r + 1;
                    break;
                }
            }
        } else {
            last_row = sheet.getLastRow();
        }
        
        var appendOnly = typeof dataOrRowsNumber === 'number';
        
        var l = appendOnly ? dataOrRowsNumber : dataOrRowsNumber.length;
        
        if (max_rows - last_row < l) {
            sheet.insertRowsAfter(max_rows, l - (max_rows - last_row) + 1)
        }
        
        if (! appendOnly) {
            var range = sheet.getRange(last_row + 1, optStartColumn || 1, dataOrRowsNumber.length, dataOrRowsNumber[0].length); //data should be normalized - all columns with the same size
            range.setValues(dataOrRowsNumber);
        }
        
        return last_row + 1;
    }

    function getSSAndSheet(spreadsheetOrId, sheetOrName, createSheetIfMissing) {
        var ss = spreadsheetOrId || SpreadsheetApp.getActiveSpreadsheet();
        if (typeof ss === 'string'){ //non empty here guaranteed by the above line
            ss = SpreadsheetApp.openById(spreadsheetOrId);
        }
        var sheet;
        if (typeof sheetOrName !== UNDEF){  //if skipped we don't need sheet object, leave it undefined
            if (sheetOrName){
                if (typeof sheetOrName.getName === "function"){
                    sheet = sheetOrName;
                }else{
                    sheet = ss.getSheetByName(sheetOrName);
                    if (sheet === null && createSheetIfMissing) {
                        sheet = ss.insertSheet(sheetOrName, 0);
                    }
                }
            } else {
                sheet =  ss.getActiveSheet();
            }
        }
        return {ss: ss, sheet:sheet};
    }

//====================================================================================================
//====================================================================================================
    
    function Configurator(){
        var t = this;
        t._instance = null;
        t._handlers = {
            'string': function(val){return val.toString();},
            'integer': function(val){return parseInt(val);},
            'float': function(val){return parseFloat(val);},
            'JSON': function(val){return JSON.parse(val.toString());},
            'date': function(val){return new Date(val);},
            'list': function(val, splitter){
                return val.toString()
                    .split(new RegExp('\\s*' + splitter + '\\s*'));
            },
            'array': function(val, terminator, row){
                return row.slice(0, row.indexOf(terminator || ""));
            },
        }
        
    }
    
    Configurator.prototype._getByType = function (row, value, atype, splitterOrTerminator) {
        return this._handlers[atype](value, splitterOrTerminator, row);
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
                        row.slice(CONSTANTS.PARAM_VALUE_POSITION - 1),
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
    
//====================================================================================================
//====================================================================================================

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

    /**
     * range should be in the format: <column_name><start_row>:<ed_column>
     *     e.g. A2:E
     * @param spreadsheet
     * @param sheet
     * @param rangeA1
     * @constructor
     */
    function DBWriter(spreadsheet, sheet) {
        var t = this;
        var ssAndS = getSSAndSheet(spreadsheet, sheet);
        t._ss = ssAndS.ss;
        t._sheet = ssAndS.sheet;
    }

    DBWriter.prototype._parseRange = function (rangeA1Name, data) {
        var t = this, parsed = {};
        var parts = rangeA1Name.split(':');
        parsed.C1 = letterToColumn(parts[0][0]);
        parsed._C2 = letterToColumn(parts[1]);
        parsed._startRow = parseInt(parts[0][1]);
        
        t._checkConstraints(parsed, data);
    }

    DBWriter.prototype._checkConstraints = function (parsed, data) {
        var t = this;
        if (data[0].length !== parsed.C2 - parsed.C1 + 1) throw Error("Data width != range width");
    }

    /**
     * Rewrites existing data with new
     * @param data
     * @param rangeName - A1 name WITHOUT header!!1
     * @returns {boolean}
     */
    DBWriter.prototype.rewrite = function (data, rangeName) {
        var t = this;
        
        var parsed = t._parseRange(rangeName, data);
        
        var r = t._sheet.getRange(t._startRow,parsed.C1, t._sheet.getLastRow(),parsed.C2 -parsed.C1 + 1);
        r.clearContent();
        
        r = t._sheet.getRange(t._startRow,parsed.C1, data.length, t._C2 -parsed.C1 + 1);
        r.setValues(data);
        
        SpreadsheetApp.flush();
        return true;
    }

    /**
     * Appends to existing records
     * @param data
     * @param rangeName - A1 name WITHOUT header!
     * @returns {boolean}
     */
    DBWriter.prototype.append = function (data, rangeName) {
        var t = this;
        
        var parsed = t._parseRange(rangeName, data);
        
        appendRows(t._sheet, data, parsed.C1);
        
        SpreadsheetApp.flush();
        return true
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

    Page.prototype.getParameters = function () {
        var t = this;
        return t._urlPar;
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
        if (! templateName) return t._url;
        return t._url + '?page=' + 
            (templateName.replace(/_/g, '/') || t._pageName); 
    }

    Page.prototype.getName = function () {
        return this._pageName;
    }

    Page.prototype.getActionName = function () {
        return this._templateName;
    }

    Page.prototype.getPrefix = function () {
        return this._path[0];
    }

//====================================================================================================
//====================================================================================================
    function runControllerFor(conf, page) {
        var pageName = page.getName();
        //this is also default template file name (without extension)
        var actionName = page.getActionName(); 
        if(! (pageName in controllers)){
            pageName = controllers.defaultController;
        }
        
        //pick up a controller
        var data = (controllers[pageName] || 
                    controllers.defaultController)(conf, page, actionName);
        
        if (!data.template) data.template = actionName;
        if (! data.context) data.context = {};
        
        //page always should be in the context
        data.context.page = page; 
        data.context.conf = conf; 
        
        return data;
    }
//====================================================================================================
//====================================================================================================

    function Auth(confInstance){
        var t = this;
        t._runningUser = Session.getActiveUser().getEmail();
        t._params = confInstance;
    }

    Auth.prototype.getEmail = function () {
        return this._runningUser;
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
    function Importer(schema, options) {
        var t = this;
        t._options = options || {};
        t._delimiter = options.delimiter || ',';  //needed for CSV mainly
        t._ss = t._options.ss ? getSSAndSheet(t._options.ss).ss : null;
        t._schema = [];
        for (var i = 0; i < t._schema.length; i++) {
            t._schema.push(schema[i].toString().trim().toLowerCase());
        }
    }

    Importer.prototype._validateFields = function (fields) {
        var t = this;
        var realFieldsOrder = [];
        var newFields = [];
        for (var i = 0; i < fields.length; i++) {
            newFields.push(fields[i].toString().trim().toLowerCase());
        }
        for (i = 0; i < t._schema.length; i++) {
            var index = newFields.indexOf(t._schema[i]);
            if (index === -1){
                return null; //invalid schema!
            }
            realFieldsOrder.push(index);
        }
        return realFieldsOrder;
    }

    Importer.prototype._rearrange = function (values) {
        var t = this, row, properRow,
            header = values[0];
        
        var valuesAfterSchema = [];
        
        var order = t._validateFields(values[0]);
        if (order === null) throw Error("Invalid order");

        for (var i = 1; i < values.length; i++) {
            properRow = new Array(header.length);
            row = values[i];
            for (var j = 0; j < header.length; j++) {
                properRow[j] = row[order[j]];
            }
            valuesAfterSchema.push(properRow);
        }
        
        return valuesAfterSchema;
    }

    Importer.prototype.getFrom = function (theType, params) {
        var t = this;
        switch (theType) {
            case 'sheet':
                var obj = getSSAndSheet(params.ss, params.sheet);
                return t._rearrange(obj.sheet.getDataRange().getValues());
            
            case 'range':
                var range;
                if (typeof params.range === 'string') {
                    range = ( getSSAndSheet(params.ss, '').sheet || t._ss).getRangeByName(params.range);
                }else{
                    rnge = params.range;
                }
                return t._rearrange(range.getValues());
            
            case 'CSV':
                var rows = params.data.split(/\n/);
                var values = [];
                for (var i = 0; i < rows.length; i++) {
                    values.push(rows[i].split(delimiter || t._delimiter));
                }
                return t._rearrange(values);

            default:
                throw Error("Importer: Invalid source type: " + theType)
        }
    }
    
//====================================================================================================
//====================================================================================================

    function API(endpoint) {
        var t = this;
        
    }

    API.prototype.get = function () {
        var t = this;
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
        log: log,
        errorRender: errorRender,
        trace: trace,
        runControllerFor: runControllerFor,
        DBWriter: DBWriter,
        Importer: Importer,
        
    };
})();    

var configurator = new Lib.Configurator();
