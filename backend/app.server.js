
function doGet(e) {

    var conf = Lib.parameters.get();
    
    var r = new Lib.Renderer("index", 'C', { //base context
        getName: function () {
            return this.page.getName();
        },
        
        getUrl: function (templateName) { 
            return this.page.getUrl(templateName); 
        },
        isMe: function(templateName){ 
            return templateName === this.page.getTemplateName();
        }
        
    });
    
    var auth = new Lib.Auth(conf);
    
    //check for strangers
    if (! auth.validate()){
        //get back with raw page, not rendering our styles and components for strangers
        return r.renderAsRoot('service_access-denied')
    }
    
    var page = new Lib.Page(e, 'app/home');
    
    if (page.isValid()){
        //this is ours user, but let's check if he has permissions for this page...
        if (! auth.validateRole(page)){
            //get back with gentle page, properly rendering Navigation Bar etc 
            // to allows user navigate to other components
            return r.render('service_no-permissions');
        }
        Lib.log('validated')
        //page template name still might be wrongly specified in, we use try{} block
        try{
            return r.render(page.getTemplateName(), {
                page: page
            });
        }catch(e){
            Lib.log(e);
            //just end up with the 404 error page below, if invalid URL
        }
    }
    
    return r.render('service_404', {
        page: page
    });
    
}

function doPost(e){
    
}