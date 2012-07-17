=======
DoForMeApiTest
==============

Client API (wrapper) and Functional tests for Apontador's API.

Prerequisites
========
Step 1: Install node and npm.

Step 2: Install all dependencies for the project.

```
npm install
```
Step 3: Install mocha for run tests of helpers.

```
npm install -g mocha
```
Step 4: Install vows for run dynamic tests of API.

```
npm install -g vows
```

Steps to run all tests of helpers(client api, helpers and functional tests)
=========

Run the following command: 
```
make test-others
```

Steps to run the API tests
=========

Run the following command: 
```
make test-api
```

How to configure 
=========

Modify the file configApiExample.json (rename it for better readability) with the config of your api.

Open the file **/test/configApiExample.json** in order to follow the information below.

### API config
Data related to api and debug.

### AUTH config
Data required to OAuth or Basic authentication. Wheter Basic so you can leave unnecessary fields blank.

### RESOURCES config

Data for resources of your API.

#### Details

**"name"**: some alias to resource.  
**"url"**: relative url to specific resource. Example: "/search". In url is possible has placeholder to some dynamic part. Example: "/places/{placeId}/reviews/new". Note that "placeId" is embraced by brackets {}. It tell to system generate a dynamic value based on "placeId" param.  
**"auth"**: type of authentication. Can be "oauth" or "basic".  
**"methodHttp"**: the name say all. Can be "put", "post", "get" or "delete".  

##### params config

**"params"**: all data relative to params of that resource (or some dynamic value in URL).  
**"name"**: param name.  
**"scenario"**: two possible nested "child": "positive" and "negative".  

Inside "positive" or "negative" scenario there will be an array of mappings containing "value" and "statusHttp". All those values will be tested on.  
In a nutshell, the system will get a "value" from a scenario, either positive or negative, and will mix with all others needed params for that resource with POSITIVE values. It ensures that wheter is generating a negative scenario just current value is negative and others positive to test one negative thing by time. So, "statusHttp" make sense now, since expected result is relative to that specific value of the param, when it is sent with all others valid params.  

Example: 
```
    "params": [
        "name": "rating",
        "scenario": {
            "positive": [
                {"value": "1", "statusHttp": "200"},
                {"value": "2", "statusHttp": "200"},
                {"value": "3", "statusHttp": "200"},
                {"value": "4", "statusHttp": "200"},
                {"value": "5", "statusHttp": "200"}
            ],
            "negative": [
                {"value": "0", "statusHttp": "400"},
                {"value": "6", "statusHttp": "400"},
                {"value": "a", "statusHttp": "400"},
                {"value": "é", "statusHttp": "400"}
            ]                
         }
    ]
```
Params required by multiple resources can just referenced in params without "scenario".  
It will tell to system to use this param and get scenarios from "paramsDefault" (see below).  

Example:
```
    "params": [
        "name": "type"
    ]
```
##### paramsDefault config

Put here all params (or dynamic value to urls) that you want to use with multiple resources so you don't need to repeat yourself.  

```
"paramsDefault":
    [
        {
            "name": "type",
            "scenario": {
                "positive": [
                    {"value": "json", "statusHttp": "200"},
                    {"value": "xml", "statusHttp": "200"}                            
                ],
                "negative": [
                    {"value": "a","statusHttp": "400"}
                ]
            } 
        }
    ]
    
### Dynamic values for positive scenario

Imagine that you need to test a resource that have a constraint to unique values. You can do it in the following way:
Inside "value" of a scenario, type the char $ and followed by a valid function name.

Example: 
```
 {
    "name": "content",
    "scenario": {
        "positive": [
            { "value": "***$randomText(20)***", "statusHttp": "200" }
        ]
    } 
}
```

Note the value ***$randomText(20)***. Now, you can ask: where is that function?
The system will search that function in "/lib/helper/config.js" file. That function is there just for the sake of example.
That file should contain all your helper functions that you wants to generate dynamic values in config file.