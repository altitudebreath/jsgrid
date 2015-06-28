
function doGet(e) {
    //index.html - is a base template
    //all the rest templates are included in it

    // Simple router
    // process a page from parameters
    var conf = Lib.parameters.get();
    
    var page = new Lib.Page(e, 'app/home');
    
    var auth = new Lib.Auth(conf);
    
    var r = new Lib.Renderer("index", 'C', { //base context
        getUrl: function (templateName) { 
            return page.getUrl(templateName); 
        },
        isMe: function(templateName){ 
            return templateName === this.templateName;
        }
        
    });
    
    //check for strangers
    if (! auth.validate()){
        //get back with raw page, not rendering our styles and components for strangers
        return r.renderAsRoot('service_access-denied')
    }
    
    if (page.isValid()){
        //this is ours user, but let's check if he has permissions for this page...
        if (! auth.validateRole(page)){
            //get back with gentle page, properly rendering Navigation Bar etc 
            // to allows user navigate to other components
            return r.render('service_no-permissions')
        }
        
        //page template name still might be wrongly specified in, we use try{} block
        try{
            return r.render(page.getName(), {
                templateName: page.getTemplateName()
            });
        }catch(e){
            //just end up with the 404 error page below, if invalid URL
        }
    }
    
    return r.render('service_404');
    
}

function doPost(e){
    
}