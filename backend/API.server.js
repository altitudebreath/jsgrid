var API = (function (){
    return {
        booking: {
            rewrite: function (data){
                var w = new Lib.DBWriter(CONSTANTS.ADMIN_SPREADSHEET_ID, 'bookings', 'A2:P');
                w.rewrite(data);
                return true;
            },

            append: function(data){
                var w = new Lib.DBWriter(CONSTANTS.ADMIN_SPREADSHEET_ID, 'bookings', 'A2:P');
                w.append(data);
                return true;
            }
        }
    }
})();