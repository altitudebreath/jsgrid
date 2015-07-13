var API = (function (){
    
    function generateEntityAPI_type1(entity){
        return {
            rewriteData: function (params, conf){
                var w = new Lib.DBManager(CONSTANTS.ADMIN_SPREADSHEET_ID, conf.schema[entity].range);
                var imp = new Lib.Importer(conf.schema[entity].fields);
                w.rewriteData(imp.getFrom(params.type, params));
                return true;
            },

            appendRows: function(params, conf){
                var w = new Lib.DBManager(CONSTANTS.ADMIN_SPREADSHEET_ID, conf.schema[entity].range);
                var imp = new Lib.Importer(conf.schema[entity].fields);
                w.appendRows(imp.getFrom(params.type, params));
                
                return true;
            },
            
            getMany: function(params, conf){
                var dbm = new Lib.DBManager(CONSTANTS.ADMIN_SPREADSHEET_ID, conf.schema[entity].range);
                var rec = new Lib.Record(null, dbm, conf.schema[entity]);
                var startOffset = ((params.pageIndex || 1) - 1) * (params.pageSize || 0);
                var limit = params.pageSize || 0;
                return rec.getMany(startOffset, limit);
            },
            
            create: function(params, conf){
                var dbm = new Lib.DBManager(CONSTANTS.ADMIN_SPREADSHEET_ID, conf.schema[entity].range);
                var rec = new Lib.Record(params.item, dbm, conf.schema[entity])
                rec.create();
                
                return true;
            },
            
            update: function(params, conf){
                var dbm = new Lib.DBManager(CONSTANTS.ADMIN_SPREADSHEET_ID, conf.schema[entity].range);
                var rec = new Lib.Record(params.item, dbm, conf.schema[entity])
                rec.update();
                
                return true;
            },
        
            select: function(params, conf){
                var dbm = new Lib.DBManager(CONSTANTS.ADMIN_SPREADSHEET_ID, conf.schema[entity].range);
                var rec = new Lib.Record(null, dbm, conf.schema[entity])
                var startOffset = ((params.pageIndex || 1) - 1) * (params.pageSize || 0);
                var limit = params.pageSize || 0;
                return rec.select(params.criteria, startOffset, limit);
            }
        }
    }
    return {
        bookings: generateEntityAPI_type1('bookings'),
        availability: generateEntityAPI_type1('availability')
    }
})();