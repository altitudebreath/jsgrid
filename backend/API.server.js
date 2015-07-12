var API = (function (){
    return {
        bookings: {
            rewriteData: function (params, conf){
                var w = new Lib.DBManager(CONSTANTS.ADMIN_SPREADSHEET_ID, conf.schema.bookings.range);
                var imp = new Lib.Importer(conf.schema.bookings.fields);
                w.rewriteData(imp.getFrom(params.type, params));
                return true;
            },

            appendRows: function(params, conf){
                var w = new Lib.DBManager(CONSTANTS.ADMIN_SPREADSHEET_ID, conf.schema.bookings.range);
                var imp = new Lib.Importer(conf.schema.bookings.fields);
                w.appendRows(imp.getFrom(params.type, params));
                
                return true;
            },
            
            getMany: function(params, conf){
                var dbm = new Lib.DBManager(CONSTANTS.ADMIN_SPREADSHEET_ID, conf.schema.bookings.range);
                var rec = new Lib.Record(null, dbm, conf.schema.bookings);
                var start = ((params.pageIndex || 1) - 1) * (params.pageSize || 0);
                var limit = params.pageSize || 0;
                return rec.getMany(start, limit);
            },
            
            create: function(params, conf){
                var dbm = new Lib.DBManager(CONSTANTS.ADMIN_SPREADSHEET_ID, conf.schema.bookings.range);
                var rec = new Lib.Record(params.item, dbm, conf.schema.bookings)
                rec.create();
                
                return true;
            },
            
            update: function(params, conf){
                var dbm = new Lib.DBManager(CONSTANTS.ADMIN_SPREADSHEET_ID, conf.schema.bookings.range);
                var rec = new Lib.Record(params.item, dbm, conf.schema.bookings)
                rec.update();
                
                return true;
            },
        
            select: function(params, conf){
                var dbm = new Lib.DBManager(CONSTANTS.ADMIN_SPREADSHEET_ID, conf.schema.bookings.range);
                var rec = new Lib.Record(null, dbm, conf.schema.bookings)
                return rec.select(params.criteria);
            }
        }
    }
})();