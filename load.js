var request = require('request');
var async = require('async');
var manage = request.defaults({baseUrl: "https://blueprint.xively.com:443/api/v1/", json:true});
var config = require('./config.js');
var accountId = config.accountId;
var credentials = require('./credentials.js');
var faker = require('faker/locale/en_US'); //For user data
var groups = []; //This will probably need to be re-thought
var authToken;

/*
    Process idea: create orgs first and save ids. Use ratio of orgs:devices:users to associate while creating
    devices + users. I believe when upTo % ratio = 0, pop the next orgId off the array. Will become more complex
    to do nested orgs, but not much I think. Probably only works for ratio > 1.
*/

var createXivelyObject = function(objectConfig,createBodyFn,processResponseFn,terminator){
    var upTo = 0;
    while(++upTo <= objectConfig.asManyAsINeed){ // <-- Pretty sure I heard that prepended incrementors are the sign of a maniac
        var body = createBodyFn(objectConfig, upTo);
        manage.post({url:objectConfig.postURL,headers:{'authorization': authToken}, body:body}, function(err, data){
            if(typeof processResponseFn === "function") processResponseFn(objectConfig, data.body,upTo,terminator);
        });
    }
}


/* Body Generators */
var createUserBody = function(userConfig,upTo){
    return {
        "createIdmUser":userConfig.createIdmUser, //Not parsing for bad data atm
        "idmUserEmail": faker.internet.exampleEmail(),
        "idmUserProfile": {
            "firstName": faker.name.firstName(),
            "lastName": faker.name.lastName()
        },
        "accountId": accountId,
        "endUserTemplateId": userConfig.templateId,
        "organizationId": linkToGroupSimple(upTo)
    }
}

var createDeviceBody = function(deviceConfig,upTo){
    return {
        "accountId":accountId,
        "organizationId": linkToGroupSimple(upTo),
        "serialNumber": createIncrementingName(deviceConfig.namePrefix, upTo),
        "deviceTemplateId": deviceConfig.templateId,
        "latitude": faker.address.latitude(),
        "longitude": faker.address.longitude(),
    }
}

var createGroupBody = function(groupConfig, upTo){
    return {
        "accountId":accountId,
        "name": createIncrementingName(groupConfig.namePrefix,upTo),
        "organizationTemplateId": groupConfig.templateId
    }
}


/* Response Processors */
var processGroupResponse = function(groupConfig, groupResponse, upTo, terminator){
    //Do some error processing
    groups.push(groupResponse.organization.id);
    if(upTo >= groupConfig.asManyAsINeed)
        terminator();

}

var processDeviceResponse = function(deviceConfig,deviceResponse, upTo, terminator){
    if(upTo >= deviceConfig.asManyAsINeed)
        terminator();
}

/* Additional Helper Functions */
var createIncrementingName = function(namePrefix, num){
    return namePrefix + num;
}

var doLogin = function(username,password, terminator){
    var body = {
        "emailAddress":credentials.username,
        "password":credentials.password,
        "accountId":accountId
    }
    request.post({url:"https://id.xively.com/api/v1/auth/login-user",body:body, json:true},function(err,data){
        authToken = "Bearer " + data.body.jwt;
        terminator();
    });
}

var linkToGroupSimple = function(upTo){
    return groups[upTo-1];
}

/* Actual Process */
var run = function(){
    async.series([
        function(callback){
            doLogin(credentials.username,credentials.password,callback);

        },
        function(callback){
            createXivelyObject(config.groups, createGroupBody, processGroupResponse, callback);
        },
        function(callback){
            createXivelyObject(config.devices,createDeviceBody, processDeviceResponse, callback);
        },
        function(callback){
            createXivelyObject(config.users,createUserBody);
        }
        
    ]);
}

run();


/* TODO List */
//P0: What's the preferred way to not have stupid callbacks?
//P1: Delete all data from an account. Keep this in a separate script.
//P1: Yell and scream if number of groups is < number of users or devices (until this means something)
//P1: Yell and scream if number of devices != number of users (until this means something)
//P1: Report errors
//P2: Create devices and attach to existing groups. Confirm with user that numDevices should be attached to numGroups (especially if numGroups < numDevices)
//P2: Allow script to configure your environment OR create some data
//P2: Only create devices, or groups, or users (and attach them to existing)
//P3: Write test functions
//P3: Batch
//P3: async/await
//P4: Progress Bar
//P4: Typescript
//P4: Am I doing anything the "old way", node-wise?