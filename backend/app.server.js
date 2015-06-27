
function doGet(e) {
    //index.html - is a base template
    //all the rest templates are included in it

    // Simple router
    // process a page from parameters
    var conf = parameters.get();
    
    var P = e.parameter;
    
    var r = new Lib.Renderer("index", 'C', { //base context
        getUrl: function(pageName){return ""},
        isMe: function(pageName){ return pageName === this.pageName;}
    });
    
    if (P.page) {
        var path = P.page.replace(/^\//, '');
        var parts = path.split('/');
        if (parts.length >= 2){
            var pageName = path.replace(/\//g, '-');
            try{
                return r.render(pageName, {});
            }catch(e){
                //just switch to rendering error page
            }

        }
    }
    
    return r.render('service-error');
    
}

function doPost(e){
    
}