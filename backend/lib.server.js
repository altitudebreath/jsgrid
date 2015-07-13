var Lib = (function(){
    function stub() {};
    
    function uuid(){
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }
    
    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }
    
    function isObject(obj) {
        return Object.prototype.toString.call(obj) === '[object Object]';
    }
    
    function escapeRegExp(str) {
           return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    function makeRegex(pre, text, post) {
        return new RegExp(pre + escapeRegExp(text) + post);
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
        var errInfo = "\n";
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
    
    function appendRows(sheet, dataOrRowsNumber, optStartColumn, columnNameToScanForEndORstartRow) {
        var o = {};
        var max_rows = sheet.getMaxRows();
        var last_row = 1;
        if (typeof columnNameToScanForEndORstartRow !== UNDEF){
                if (typeof columnNameToScanForEndORstartRow === 'string') { //column name
                    var values = sheet.getRange(columnNameToScanForEndORstartRow + '1:' + columnNameToScanForEndORstartRow).getValues();
                    for (var r = values.length - 1; r >= 0; r--) {
                        if (values[r][0]) {
                            last_row = r + 1;
                            break;
                        }
                    }
                }else{ //should be a number
                    last_row = columnNameToScanForEndORstartRow;
                }
        } else {
            last_row = sheet.getLastRow();
        }
        
        var appendOnly = typeof dataOrRowsNumber === 'number';
        
        var l = appendOnly ? dataOrRowsNumber : dataOrRowsNumber.length;
        
        if (max_rows - last_row < l) {
            sheet.insertRowsAfter(max_rows, l - (max_rows - last_row) + 1);
            o.inserted = true;
        }
        
        if (! appendOnly) {
            var range = sheet.getRange(last_row + 1, optStartColumn || 1, dataOrRowsNumber.length, dataOrRowsNumber[0].length); //data should be normalized - all columns with the same size
            range.setValues(dataOrRowsNumber);
        }
        
        return o;
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
        t._schema = null;
        t._handlers = {
            'string': function(val){return val.toString();},
            'integer': function(val){return parseInt(val);},
            'float': function(val){return parseFloat(val);},
            'JSON': function(val){return JSON.parse(val.toString());},
            'date': function(val){return new Date(val);},
            'list': function(val, splitter){
                return val.toString()
                    .split(makeRegex('\\s*', splitter, '\\s*'));
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
        if (t._schema) {
            return t._schema;
        } else {
            var ss = SpreadsheetApp.openById(CONSTANTS.ADMIN_SPREADSHEET_ID);
            var paramSheet = ss.getSheetByName(CONSTANTS.PARAMETERS_SHEET_NAME);
            var values = paramSheet.getDataRange().getValues();
            var params = {};
            for (var i = CONSTANTS.PARAM_ROWS_STARTS_FROM - 1; i < values.length; i++){
                var row = values[i];
                var name = row[CONSTANTS.PARAM_NAME_POSITION - 1];
                if (name) {
                    walkNamespace(params, name,
                        t._getByType(
                            row.slice(CONSTANTS.PARAM_VALUE_POSITION - 1),
                            row[CONSTANTS.PARAM_VALUE_POSITION - 1],
                            row[CONSTANTS.PARAM_TYPE_POSITION - 1],
                            row[CONSTANTS.ITEMS_SPLITTER_POSITION - 1]
                        )
                    );
                }
            }
            t._schema = params;//extend({}, params, CONSTANTS); 
            
            return t._schema;
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


    function Schema(configurator) {
        var t = this;
        t._configurator = configurator;
    }

    Schema.prototype.get = function () {
        var t = this;
        if (t._schema) {
            return t._schema;
        } else {
            var rawSchema = t._configurator.get().schema;
            
            t._schema = {};
            for (var entity in rawSchema) {
                var arr = [];
                var e = rawSchema[entity];
                for (var i = 0; i < e.fields.length; i++) {
                    arr.push({
                        name: e.fields[i],
                        'type': e.types[i],
                        width: e.inputSizes[i]
                    });
                }
                t._schema[entity] = arr;
            }
            
            return t._schema;
        }
    }
    
//====================================================================================================
//====================================================================================================

    //TODO at some point it would be need to implement hashes and ids, 
    //TODO... but it is complex and needs strict rules on data sources (no rewrites etc)
    //function getHash(fields){
    //    return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_1, fields.join('|'));
    //}
    //
    //function genUID() {
    //    return Date.now()*1000 + Math.floor(Math.random()*1000).toString;
    //}
    
    function Record(record, dbManager, rawEntitySchema) {
        var t = this;
        t._schema = rawEntitySchema;
        t._dbm = dbManager;
        t._record = record || null;
        t._fieldToIndex = {};
        for (var i=0; i< t._schema.fields.length; i++){
            t._fieldToIndex[t._schema.fields[i]] = i;
        }
    }

   
    Record.prototype.create = function (record) {
        //TODO: check if unique
        var t = this;
        var rec = record || t._record;
        if (!rec) throw Error("Record: empty record");
        
        return t._dbm.appendRows([t._recordToRow(rec)])
    }
    
    Record.prototype.update = function (record) {
        //TODO: decide what can be updated and what not (primary key), construct HASH
        var t = this;
        var rec = record || t._record;
        if (!rec) throw Error("Record: empty record");
        
        return t._dbm.updateRows(parseInt(rec.__UID), [t._recordToRow(rec)])
        
    }
    
    Record.prototype._recordToRow = function (record) {
        var t = this;
        
        var arr = new Array(Object.keys(record).length);
        for (var fieldName in record) {
            var index = t._fieldToIndex[fieldName];
            if (typeof index === UNDEF) throw Error("DBManager: invalid field name: " + fieldName);
            arr[index] = record[index]
        }
        //t._schema.hashColumn === 'before' ? arr.unshift(hash) : arr.push(hash);
        return arr;
    }

    /**
     * 
     * @param row
     * @param id - is a native row number on a sheet
     * @returns {{}}
     * @private
     */
    Record.prototype._rowToRecord = function (row, id) {
        var t = this;
        var record = {};
        for (var i = 0; i < row.length; i++) {
            record[t._schema.fields[i]] = row[i];
        }
        if (typeof id !== UNDEF) record.__UID = id;
        return record;
    }

    Record.prototype._rowsToRecordSet = function (rows, startOffset) {
        var t = this, 
            base = t._dbm.baseRow();
        startOffset = startOffset || 0;
        var records = [];
        for (var i = 0; i < rows.length; i++) {
            records.push(t._rowToRecord(rows[i], base + startOffset + i));
        }
        return records;
    }
    
    Record.prototype.getMany = function (startOffset, limit) {
        var t = this;
        var rows = t._dbm.getRows(startOffset, limit);
        return t._rowsToRecordSet(rows, startOffset);
    }

    /**
     * searches by field values equality
     * @param recordCriteria - {fieldName: value, fieldName: value}
     * @param startOffset
     * @param limit
     */
    Record.prototype.select = function (recordCriteria, startOffset, limit) {
        var t = this, criteria = {};
        for (var c in recordCriteria) {
            criteria[t._fieldToIndex[c]] = recordCriteria[c];
        }
        
        return t._rowsToRecordSet(t._dbm.selectRows(criteria, startOffset, limit), startOffset);
    }
//====================================================================================================
//====================================================================================================

    /**
     * range should be in the format: <column_name><start_row>:<ed_column>
     *     e.g. A2:E
     * @param spreadsheet
     * @param range - data range
     * @constructor
     */
    function DBManager(spreadsheet, range) {
        var t = this;
        t._dataRange = range;
        t._rangeDef = /(\w+)\!([A-Za-z]+)(\d+):(\w+)/.exec(t._dataRange);   //eg. bookings!A2:P ==> bookings(1)  A(2)   2(3)  P(4)
        var ssAndS = getSSAndSheet(spreadsheet, t._rangeDef[1]);
        t._ss = ssAndS.ss;
        t._sheet = ssAndS.sheet;

        t._dim = t._initActualRange();
    }

    DBManager.prototype.baseRow = function () {
        return this._dim.row;
    }
    
    DBManager.prototype._initActualRange = function () {
        var t = this;
        t._range = t._sheet.getRange(
            t._rangeDef[3], 
            letterToColumn(t._rangeDef[2]), 
            t._sheet.getLastRow() - t._rangeDef[3] + 1, 
            letterToColumn(t._rangeDef[4])
        );
        return {
            height: t._range.getHeight(),
            width: t._range.getWidth(),
            row: t._range.getRow(),
            col: t._range.getColumn(),
        }
    }

    DBManager.prototype._checkConstraints = function (data) {
        var t = this;
        if (data[0].length !== t._dim.width) throw Error("Data width != range width");
    }

    DBManager.prototype._subset = function (startOffset, rowLimit) {
        var t = this;
        if (!startOffset && !rowLimit) return t._range; //optimization
        return t._range.offset(startOffset || 0, 0, rowLimit || t._dim.height);
    }
    
    DBManager.prototype.getRows = function (startOffset, rowLimit) {
        var t = this;
        return t._subset(startOffset, rowLimit).getValues();
    }

    DBManager.prototype.updateRows = function (startOffset, data) {
        var t = this;
        t._checkConstraints(data);
        t._subset(startOffset, data.length).setValues(data);
        return true;
    }
    /**
     * Rewrites existing data with new
     * @param data
     * @returns {boolean}
     */
    DBManager.prototype.rewriteData = function (data) {
        var t = this;
        t._checkConstraints(data);
        t._range.clearContent();
        return t._appendRows(data);
    }

    /**
     * Appends to existing records
     * @param data
     * @returns {boolean}
     */
    DBManager.prototype.appendRows = function (data) {
        var t = this;
        t._checkConstraints(data);
        return t._appendRows(data);
    }
    
    
    DBManager.prototype._appendRows = function (data) {
        var t = this;
        var res = appendRows(t._sheet, data, t._dim.col, t._dim.row);
        if (res.inserted){
            //need to update original range, because new column where inserted at the bottom
            t._dim = t._initActualRange();
        } 
        SpreadsheetApp.flush();
        return true
    }

    /**
     *
     * @param criteria - {index: value, index2: value2...}
     * @param startOffset
     * @param limit
     */
    DBManager.prototype.selectRows = function (criteria, startOffset, limit) {
        var t = this,
            rows = [],
            matches = 0;
            
        limit = limit || 1e+20;
        startOffset = startOffset || 0;
        
        var values = t._range.getValues();
        var criteriaNumber = Object.keys(criteria).length;
        
        for (var i = 0; i < values.length; i++) {
            if (criteriaNumber) {
                var matched = true;
                for (var c in criteria) {
                    if (values[i][c].indexOf(criteria[c]) === -1) {
                        matched = false;
                        break;
                    }
                }
                if (! matched) continue;
            }
            matches++;
            if (matches >= startOffset) {
                rows.push(values[i]);
                if (rows.length >= limit) break;
            }
        }
        return rows;
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
        return t._params.role[CONSTANTS.ROLE_ALL].indexOf(emailToCheck) !== -1;

    }    
    
    Auth.prototype.validateRole = function (page, userEmail) {
        var t = this;
        
        var emailToCheck = userEmail ? userEmail : t._runningUser;
        
        //need to check permissions to this specific page
        //return after having found the first role permitting this page
        for (var role in CONSTANTS.ROLE) {
            //log('role', role);
            if (t._params.role[role].indexOf(emailToCheck) !== -1 &&
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
        t._delimiter = t._options.delimiter || ',';  //needed for CSV mainly
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
                return null; //missing field!
            }
            realFieldsOrder.push(index);
        }
        return realFieldsOrder;
    }

    Importer.prototype._rearrange = function (values) {
        var t = this, row, properRow,
            header = values[0];
        
        var valuesAfterSchema = [];
        
        var order = t._validateFields(header);
        if (order === null) throw Error("Invalid source schema, missing fields");

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
                    range = params.range;
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
    
    /**
     * Finds (and optionally creates) proper sub-object in the namespace base object by string path
     * @param  {Object} baseNS         Base object
     * @param  {string} namePathString like "A.B.C"m where C is a target name for value placing
     * @param {string} optValue   --- value to write, if it is specified, this is a write operation
     */
    function walkNamespace(baseNS, namePathString, optValue){

        var nameParts = namePathString.split(/\s*\.\s*/);
        
        var part = baseNS;

        var l = nameParts.length; //edge case: l==1 (single name) - works as well

        for (var i=0; i < (l - 1); i++){

            if (! (nameParts[i] in part)){
                if (typeof optValue !== "undefined"){
                    //this is a 'write' operation, add missing name chain here
                    part[nameParts[i]] = {};
                }else{
                    //there is no such entry
                    return null;
                }
            }
            part = part[nameParts[i]];
        }

        if (typeof optValue !== UNDEF){
            part[nameParts[l - 1]] = optValue
        }

        if (DEBUG) Lib.log(["walkNamespace", namePathString, JSON.stringify(baseNS)]);
        
        return part[nameParts[l - 1]];
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
        DBManager: DBManager,
        Importer: Importer,
        Record: Record,
        Schema: Schema,
    };
})();    

//lazy loading global singletones - will evaluate only on get() methods
var configurator = new Lib.Configurator();
var theSchema = new Lib.Schema(configurator);