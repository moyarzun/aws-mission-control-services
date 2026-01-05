import { EC2Client, StartInstancesCommand, StopInstancesCommand } from "@aws-sdk/client-ec2";

const client = new EC2Client({ region: "us-east-2" });

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  let action = null;
  let instanceId = null;

  // Handle API Gateway event (body is a string) or direct invocation
  if (event.body) {
    try {
      // If body is already an object (local invoke sometimes), use it, otherwise parse string
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      action = body.action ? body.action.toLowerCase() : null;
      instanceId = body.instanceId;
    } catch (e) {
      console.error("Failed to parse body", e);
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Credentials": true },
        body: JSON.stringify({ message: "Invalid JSON body" })
      };
    }
  } else {
    action = event.action ? event.action.toLowerCase() : null;
    instanceId = event.instanceId;
  }

  if (!instanceId) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Credentials": true },
      body: JSON.stringify({ message: "Missing required parameter: instanceId" })
    };
  }

  try {
    let command;
    if (action === 'start') {
      console.log(`Attempting to start instance ${instanceId}`);
      command = new StartInstancesCommand({ InstanceIds: [instanceId] });
    } else if (action === 'stop') {
      console.log(`Attempting to stop instance ${instanceId}`);
      command = new StopInstancesCommand({ InstanceIds: [instanceId] });
    } else {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Credentials": true },
        body: JSON.stringify({ message: "Invalid action. Provide 'action': 'start' or 'stop'." })
      };
    }

    const response = await client.send(command);
    console.log("Command executed successfully:", response);
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Credentials": true },
      body: JSON.stringify({
        message: `Instance ${instanceId} ${action} command sent successfully.`,
        details: response
      })
    };
  } catch (err) {
    console.error("Error executing command:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Credentials": true },
      body: JSON.stringify({ message: "Error executing command", error: err.message })
    };
  }
};
