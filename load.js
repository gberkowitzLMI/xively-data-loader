var request = require('request');
var async = require('async');
var manage = request.defaults({baseUrl: "https://blueprint.xively.com:443/api/v1/", json:true});
var config = require('./config.js');
var accountId = config.accountId;
var credentials = require('./credentials.js');
var faker = require('faker/locale/en_US'); //For user data
var groups = []; //This will probably need to be re-thought
var authToken;


// var createXivelyObject = function(objectConfig,createBodyFn,processResponseFn,terminator){
//     objectConfig.count = 0;
//     while(objectConfig.count <= objectConfig.asManyAsINeed){
//         var body = createBodyFn(objectConfig);
//         manage.post({url:objectConfig.postURL,headers:{'authorization': authToken}, body:body}, function(err, data){
//             if(typeof processResponseFn === "function" && data.body) 
//                 processResponseFn(objectConfig, data.body, terminator);
//         });
//     }
// }

var createXivelyObject = function(objectConfig,createBodyFn,processResponseFn,terminator){
    var body = createBodyFn(objectConfig);
    manage.post({url:objectConfig.postURL,headers:{'authorization': authToken}, body:body}, function(err, data){
        if(typeof processResponseFn === "function" && data.body) 
            processResponseFn(objectConfig, data.body, terminator, function(){
                createXivelyObject(objectConfig,createBodyFn,processResponseFn,terminator);
            });
    });
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
        "organizationId": linkToGroupSimple(userConfig.count)
    }
}

var createDeviceBody = function(deviceConfig){
    return {
        "accountId":accountId,
        "organizationId": linkToGroupSimple(deviceConfig.count),
        "serialNumber": createNameWithSuffix(deviceConfig.namePrefix),
        "deviceTemplateId": deviceConfig.templateId,
        "latitude": faker.address.latitude(),
        "longitude": faker.address.longitude(),
    }
}

var createGroupBody = function(groupConfig){
    return {
        "accountId":accountId,
        "name": createNameWithSuffix(groupConfig.namePrefix),
        "organizationTemplateId": groupConfig.templateId
    }
}


/* Response Processors */
var processGroupResponse = function(groupConfig, groupResponse, terminator,repeater){
    //If at first you don't succeed...
    if(!groupResponse.error){
        groups.push(groupResponse.organization.id);
        ++groupConfig.count;
        if(groups.length == groupConfig.asManyAsINeed){
            terminator();
        }
            
        else
            repeater();
    }
    
}

var processDeviceResponse = function(deviceConfig,deviceResponse, terminator, repeater){
    if(!deviceResponse.error){
        ++deviceConfig.count; 
        if(deviceConfig.count == deviceConfig.asManyAsINeed)
            terminator();
        else
            repeater();
    }
}

var processUserResponse = function(userConfig,userResponse, terminator, repeater){
    if(!userResponse.error){
        ++userConfig.count; 
        if(userConfig.count == userConfig.asManyAsINeed)
            terminator();
        else
            repeater();
    }
}

/* Additional Helper Functions */
var createNameWithSuffix = function(namePrefix){
    return namePrefix + getRandomArbitrary(100000,9999999);
}

    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomArbitrary(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
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
    return groups[upTo];
}

/* Actual Process */
var run = function(){
    config.groups.count = 0;
    config.devices.count = 0;
    config.users.count =0;
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
            createXivelyObject(config.users,createUserBody,processUserResponse, callback);
        }
        
    ]);
}

run();


/* TODO List */
//P0: Don't use incremental name generators
//P0: Handle collision errors
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