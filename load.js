var request = require('request');
var manage = request.defaults({baseUrl: "https://blueprint.xively.com:443/api/manage/"});
var config = require('./config.js');

//TODO p4: Batch?

//TODO Ok, now that you've started, do you want to configure your environment or create some data?

//TODO p3: var goConfigure = function(){};

/*
    Process idea: create orgs first and save ids. Use ratio of orgs:devices:users to associate while creating
    devices + users. I believe when upTo % ratio = 0, pop the next orgId off the array. Will become more complex
    to do nested orgs, but not much I think.
*/

var createXivelyObject = function(config,bodyFn){
    for(var upTo in config.asManyAsINeed){
        var body = bodyFn();
        manage.post(function(req,res){
        });
    }
}