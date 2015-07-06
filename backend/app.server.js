function doGet(e) {
    try {
        var conf = configurator.get();

        var auth = new Lib.Auth(conf);
        
        var r = new Lib.Renderer(conf.app_title, "index", 'C', { //base context
            title: conf.app_title,
            
            auth: auth,
            
            getName: function () {
                return this.page.getName();
            },

            getUrl: function (actionName) {
                return this.page.getUrl(actionName);
            },
            
            isMe: function (actionName, textOnSuccess) {
                var res = actionName === this.page.getActionName();
                return textOnSuccess ? (res ? textOnSuccess : '') : res;
            }

        });

        //check for strangers
        if (!auth.validate()) {
            //get back with raw page, not rendering our styles and components for strangers
            return r.renderAsRoot('service_access-denied')
        }

        var page = new Lib.Page(e, conf.default_page);

        if (page.isValid()) {
            //this is ours user, but let's check if he has permissions for this page...
            if (!auth.validateRole(page)) {
                //get back with gentle page, properly rendering Navigation Bar etc 
                // to allows user navigate to other components
                return r.render('service_no-permissions',{
                            page: page
                });
            }
            //page template name still might be wrongly specified in, we use try{} block
            try {
                var data = Lib.runControllerFor(conf, page);
                return r.render(data.template, data.context);
            } catch (e) {
                Lib.log(Lib.trace(e));
                //just end up with the 404 error page below, if invalid URL
            }
        }

        return r.render('service_404', {
            page: page
        });
    
    }catch(e){
        var tr = Lib.trace(e);
        Logger.log(tr);
        return Lib.errorRender('error', DEBUG ? tr.replace(/\n/g, '<br />') : e);
    }   
}

function runAction(entity, operation, actionParams){
    try{
        var conf = configurator.get();
        try {
            var func = API[entity][operation];
        }catch(e){
            throw Error("Wrong Entity or Operation: " + entity + ', ' + operation);
        }
        return func(actionParams, conf);
    }catch(e){
        var tr = Lib.trace(e);
        Logger.log(tr);
        throw Error(DEBUG ? tr : e.message);
    }   
}

function doPost(e){
    //dummy stub for now
    return doGet(e);
}