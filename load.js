var request = require('request');
var manage = request.defaults({baseUrl: "https://blueprint.xively.com:443/api/manage/"});
var config = require('./config.js');
var accountId = config.accountId;
var credentials = require('./credentials.js');
var faker = require('faker/locale/en_US'); //For user data
var groups = []; //This will probably need to be re-thought
var JWT;

/*
    Process idea: create orgs first and save ids. Use ratio of orgs:devices:users to associate while creating
    devices + users. I believe when upTo % ratio = 0, pop the next orgId off the array. Will become more complex
    to do nested orgs, but not much I think. Probably only works for ratio > 1.
*/

var createXivelyObject = function(objectConfig,createBodyFn,processResponseFn){
    for(var upTo in config.asManyAsINeed){
        var body = createBodyFn(objectConfig, upTo);
        manage.post(config.postURL,function(req,res){
            if(typeof processResponseFn === "function") processResponseFn(res);
        });
    }
}


/* Body Generators */
var createUserBody = function(userConfig){
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
        "serialNumber": createIncrementingName(deviceConfig.namePrefix),
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
var processGroupResponse = function(groupResponse){
    //Do some error processing
    groups.push(groupResponse.body.id);
}

/* Additional Helper Functions */
var createIncrementingName = function(namePrefix, num){
    return namePrefix + num;
}

var doLogin = function(username,password){
    var body = {
        "emailAddress":credentials.username,
        "password":credentials.password,
        "accountId":accountId
    }
    request.post({url:"https://id.xively.com/api/v1/auth/login-user",body:body, json:true},function(err,data){
        console.log(err);
        console.log(data.body);
        manage.defaults({headers: {'Authorization':"Bearer " +  res.body.jwt}}); 
    });
}

var linkToGroupSimple = function(upTo){
    return groups[upTo-1];
}

/* Actual Process */
var run = function(){
    doLogin(credentials.username,credentials.password); //It's been too long, can I count on this to be synchronous?
    //createXivelyObject(config.groups,createGroupBody,processGroupResponse);
    //createXivelyObject(config.devices,createDeviceBody);
    //createXivelyObject(config.users,createUserBody);
}

run();


/* TODO List */
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