'use strict';

const AWS = require('aws-sdk');
let dynamo = new AWS.DynamoDB.DocumentClient();

require('aws-sdk/clients/apigatewaymanagementapi'); 
const TABLE_NAME = process.env.NAMES_DYNAMODB_TABLE;
const STAGE_NAME = process.env.STAGE;

const CHATCONNECTION_TABLE = TABLE_NAME+'-'+STAGE_NAME;

const successfullResponse = {
  statusCode: 200,
  body: 'everything is alright'
};

module.exports.connectionHandler = (event, context, callback) => {
  console.log(event);

  if (event.requestContext.eventType === 'CONNECT') {
    // Handle connection
    addConnection(event.requestContext.connectionId)
      .then(() => {
        callback(null, successfullResponse);
      })
      .catch(err => {
        console.log(err);
        callback(null, JSON.stringify(err));
      });
  } else if (event.requestContext.eventType === 'DISCONNECT') {
    // Handle disconnection
    deleteConnection(event.requestContext.connectionId)
      .then(() => {
        callback(null, successfullResponse);
      })
      .catch(err => {
        console.log(err);
        callback(null, {
          statusCode: 500,
          body: 'Failed to connect: ' + JSON.stringify(err)
        });
      });
  }
};

// THIS ONE DOESNT DO ANYHTING
module.exports.defaultHandler = (event, context, callback) => {
  console.log('defaultHandler was called');
  console.log(event);

  callback(null, {
    statusCode: 200,
    body: 'defaultHandler'
  });
};

module.exports.sendMessageHandler = (event, context, callback) => {
  sendMessageToAllConnected(event).then(() => {
    callback(null, successfullResponse)
  }).catch (err => {
    callback(null, JSON.stringify(err));
  });
}

module.exports.singleMessageHandler = (event, context, callback) => {
  sendMessageToSpecificID(event).then(() => {
    callback(null, successfullResponse)
  }).catch (err => {
    callback(null, JSON.stringify(err));
  });
}

const sendMessageToAllConnected = (event) => {
  return getConnectionIds().then(connectionData => {
    return connectionData.Items.map(connectionId => {
      return send(event, connectionId.connectionId);
    });
  });
}

const sendMessageToSpecificID = (event) => {
  return sendSingle(event);
}

const getConnectionIds = () => {  
  const params = {
    TableName: CHATCONNECTION_TABLE,
    ProjectionExpression: 'connectionId'
  };

  return dynamo.scan(params).promise();
}

const send = (event, connectionId) => {
  const body = JSON.parse(event.body); //event.body is the payload 
  body["requesterId"] = event.requestContext.connectionId;
  const postData = JSON.stringify(body);  

  const endpoint = event.requestContext.domainName + "/" + event.requestContext.stage;
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint: endpoint
  });

  const params = {
    ConnectionId: connectionId,
    Data: postData
  };
  return apigwManagementApi.postToConnection(params).promise();
};


const sendSingle = (event) => {
  const body = JSON.parse(event.body);
  const postData = JSON.stringify({ "Body" : body.data, "incoming_from" : event.requestContext.connectionId});
  const socketId = body.socketId;  

  const endpoint = event.requestContext.domainName + "/" + event.requestContext.stage;
  const apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: "2018-11-29",
    endpoint: endpoint
  });

  const params = {
    ConnectionId: socketId,
    Data: postData
  };
  return apigwManagementApi.postToConnection(params).promise();
};

const addConnection = connectionId => {
  const params = {
    TableName: CHATCONNECTION_TABLE,
    Item: {
      connectionId: connectionId 
    }
  };

  return dynamo.put(params).promise();
};

const deleteConnection = connectionId => {
  const params = {
    TableName: CHATCONNECTION_TABLE,
    Key: {
      connectionId: connectionId 
    }
  };

  return dynamo.delete(params).promise();
};