var controllers = {
    defaultController: function (conf, page) {
        return {};
    },
    
    "admin/booking-import": function (conf, page) {
        return {
            context: {
                fields: conf.schema.bookings.fields.join(', '),
            }
        }
    }
}

