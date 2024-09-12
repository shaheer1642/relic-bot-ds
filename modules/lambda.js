const AWS = require('aws-sdk');

// Initialize AWS Lambda
const lambda = new AWS.Lambda({
    region: 'us-east-2', // Replace with your Lambda region
    credentials: {
        accessKeyId: process.env.LAMBDA_ACCESS_ID,
        secretAccessKey: process.env.LAMBDA_SECRET_KEY
    }
});

// Function to invoke the Lambda
async function getWorldState(key) {
    return new Promise(async (resolve, reject) => {
        const params = {
            FunctionName: 'worldstate_warframe', // The name of your Lambda function
            InvocationType: 'RequestResponse', // 'Event' for async, 'RequestResponse' for sync
            Payload: JSON.stringify({ key }) // The payload you want to send to LambdaA
        };

        try {
            const result = await lambda.invoke(params).promise();
            const payload = JSON.parse(result.Payload)
            if (payload.statusCode !== 200) return reject(payload)
            const body = JSON.parse(payload.body)
            resolve(body)
        } catch (error) {
            console.error('Error invoking Lambda:', error);
            reject(error)
        }
    })
}

module.exports = {
    getWorldState
}