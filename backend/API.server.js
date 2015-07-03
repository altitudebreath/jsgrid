var API = (function (){
    return {
        bookings: {
            rewrite: function (params, conf){
                var w = new Lib.DBWriter(CONSTANTS.ADMIN_SPREADSHEET_ID, 'bookings', 'A2:P');
                w.rewrite(params.data);
                return true;
            },

            append: function(params, conf){
                var w = new Lib.DBWriter(CONSTANTS.ADMIN_SPREADSHEET_ID, 'bookings', 'A2:P');
                var imp = new Lib.Importer(conf['schema.bookings']);
                w.append(imp.getFrom(params.type, params));
                
                return true;
            }
        }
    }
})();