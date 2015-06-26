//types:
//block {order: horisontal | vertical(default)}, 
//text, 
//screen_header, 
//table
//
//for the types with only a value property a shortcut may be used:
// text_1 : {value "the value"} ===> text_1: "the value"


var UI = {
    CONSTANTS: {
        /* ================================== Constants to use in Business logic =============================================*/
        ORDER: {
            HORIZONTAL: "hor",
            VERTICAL: 'ver'
        },
        TYPE: {
            PAGE_TITLE: "ui-text-title-page",
            SECTION_TITLE:"ui-text-title-section",
        }
        /* ================================== Constants End ===========================================================*/
    }
}

UI.defs = (function (ORDER, TYPE) {
    var defs = {};
    
    /* ================================== Business Logic Start ===========================================================*/
    defs.AvailablityView = {
        Title_1: {
            type: TYPE.PAGE_TITLE,
            value: "Availability List & Availability Marketing",
        },
        Block_2: {
            order: ORDER.HORIZONTAL,
            Panel_1: {
                title: "Availability List & Widgets",
                Block_1:{
                    order: ORDER.HORIZONTAL,
                    Note_1: {}
                }
            },
            Panel_2: {
                title: "Marketing Widgets: Your Embedded Codes",
                Table_1: {
                    columns: ['Name', 'EmbeddedCode'],
                    onLoad: "AvailabilityList.embeddedCodes"
                },
                NoteBox_2: {}
            }
        },
        Title_3: {
            type: TYPE.SECTION_TITLE,
            value: "Live Widgets",
        },


    }
    /* ================================== Business Logic End ===========================================================*/
    
    return defs
})(UI.CONSTANTS.ORDER, UI.CONSTANTS.TYPE);
