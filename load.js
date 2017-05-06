var request = require('request');
var manage = request.defaults({baseUrl: "https://blueprint.xively.com:443/api/manage/"});
var config = require('./config.js');

//TODO p4: Batch?

//TODO Ok, now that you've started, do you want to configure your environment or create some data?

//TODO p3: var goConfigure = function(){};

var createDevicesFromTemplate = function(config){
    for(var upTo in config.asManyAsINeed){
        manage.post(function(req,res){
            var body = {
                "accountId": config.accountId,
                "deviceTemplateId": config.deviceTemplateId,
                ""
            }
        });
    }
}