# Tart Push Service


Tart Push Service is a push notification management system that is developed for providing push notifications to several applications. Tart Push Service is able to send push notifications to both Android and IOS devices in a transparent way.


## Installation

* Clone the repository. 
* Run `npm install`
* and run `./bin/www --config "/path/to/config.json" --port 3000`

## Configuration
#### Configuration file
The configuration file must be in strict json format. A typical configuration file is given as follows:
```
{
    "mongoConnectionString": "mongodb://localhost/push-service",
    "certificateRoot": "./certificates"
}
```
where `certificateRoot` points the path for the ios certificate files and `mongoConnectionString` is the mongoDB connection string.


#### APN Certificates
The APN certificates must be placed in the following folder structure:
```
.
├── certificates
|   ├── app1
|   |      ├── cert.pem
|   |      └── key.pem
|   └── app2
|          ├── cert.pem
|          └── key.pem        

```
#### Adding new application
In order to add a push notification service for a specific application, a document that describes the properties of the application must be inserted to the `apps` collection of the mongoDB. The document format is as follows:
```
{
    "name" : "UniqueAppName",
    "displayName" : "Unique Application Name",
    "apnPassphrase" : "APN_PASSPHARASE",
    "apnGateway" : "APN_GATEWAY",
    "gcmApiKey" : "GCM_API_KEY",
    "ips" : [ 
        "192.168.0.12", 
        "145.231.123.21"
    ]
}
```

## Usage
The Push Notification Service handles 4 different routes. In order to authenticate the requester, the ip address of your server must be added to the `ips` array of the application and all requests must contain a header property: `X-App-Name: UniqueAppName`. 


#### PUT /user/*:userId*
Adds the user to the db. If the user exists on the db, it updates the locale property and adds the new device. Note that all the previous devives for that specific user remains unchanged.

The request body must be in the following structure:
```
{
    locale: String,
    device: {
        type: String, // must be 'ios' or 'android'
        token: String    
    }
}
```

#### DELETE /user/*:userId*
Removes the user and all it's devices from the db.

#### DELETE /user/*:userId*/device
Removes a specific device from the user.

The request body must be in the following structure:
```
{
    token: String
}
```


#### POST /message
Send push notifications. 

The request body must be in the following structure:
```
{
    userIds: Array | null, 
    message: {
        en: 'English message',
        tr: 'Turkce mesaj'
    }
}
```
***When the `userIds` is not provided, the message is sent to everyone in the app.***
