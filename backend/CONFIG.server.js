//CONSTANTS needs to be available where spreadsheet is not accessible (yet)
//cannot be moved to sheet-based parameters
var CONSTANTS = {
    //-------------------- Change this per each client! ------------------------------------
    ADMIN_SPREADSHEET_ID: "1BxV-8zNRvAQmx1Kx-Eimn77lsqdkZQdtkfTdgVyKhB0",
    //-------------------------------------------------------------------------------------
    PARAMETERS_SHEET_NAME: 'PARAMS',
    //Indexes below counting from 1
    PARAM_NAME_POSITION: 1,
    PARAM_TYPE_POSITION: 2,
    ITEMS_SPLITTER_POSITION: 3,
    PARAM_VALUE_POSITION: 4,
    PARAM_ROWS_STARTS_FROM: 5
    
    //TRIGGER_CALL_INTERVAL: 60 * 1000,
}

var parameters = new Lib.Parameters(); 