/**
 * Serves HTML of the application for HTTP GET requests.
 * If folderId is provided as a URL parameter, the web app will list
 * the contents of that folder (if permissions allow). Otherwise
 * the web app will list the contents of the root folder.
 *
 * @param {Object} e event parameter that can contain information
 *     about any URL parameters provided.
 */
function doGet(e) {
    var template = HtmlService.createTemplateFromFile('Index');

    // Retrieve and process any URL parameters, as necessary.
    //if (e.parameter.folderId) {
    //  ...
    //}
    
    template.generatedHTML = generateHTML();
    
    // Build and return HTML in IFRAME sandbox mode.
    return template.evaluate()
        .setTitle('Web App Experiment')
        .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function generateHTML(){
    
}