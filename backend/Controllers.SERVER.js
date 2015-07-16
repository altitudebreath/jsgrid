var controllers = (function () {
    function getSchema(entityName) {
        return JSON.stringify(theSchema.get()[entityName]);
    }

    return {
        defaultController: function (conf, page) {
            return {};
        },

        "admin/booking-import": function (conf, page) {
            return {
                context: {
                    fields: conf.schema.bookings.fields.join(', '),
                }
            }
        },

        "app/bookings": function (conf, page) {
            return {
                context: {
                    schema: getSchema('bookings')
                }
            }
        },

        "app/availability": function (conf, page) {
            return {
                context: {
                    schema: getSchema('availability')
                }
            }
        },
    }
})();

