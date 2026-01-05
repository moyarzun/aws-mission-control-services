import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";

const client = new EC2Client({ region: "us-east-2" });

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    const command = new DescribeInstancesCommand({
      Filters: [
        { Name: "instance-state-name", Values: ["running", "stopped", "pending", "stopping"] }
      ]
    });
    const response = await client.send(command);

    const instances = [];
    if (response.Reservations) {
      for (const reservation of response.Reservations) {
        if (reservation.Instances) {
          for (const instance of reservation.Instances) {
            const nameTag = instance.Tags ? instance.Tags.find(t => t.Key === 'Name') : null;
            instances.push({
              id: instance.InstanceId,
              name: nameTag ? nameTag.Value : 'Unknown',
              state: instance.State ? instance.State.Name : 'unknown',
              type: instance.InstanceType,
              publicIp: instance.PublicIpAddress || null
            });
          }
        }
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Instances fetched successfully",
        data: instances
      })
    };
  } catch (err) {
    console.error("Error fetching instances:", err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ message: "Error fetching instances", error: err.message })
    };
  }
};
