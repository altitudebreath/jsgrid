var controllers = {
    defaultController: function (conf, page) {
        return {};
    },
    
    "app/booking-import": function (conf, page) {
        return {
            context: {
                fields: conf['schema.bookings'].join(', '),
            }
        }
    }
}

