import { CostExplorerClient, GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";

const client = new CostExplorerClient({ region: "us-east-1" }); // CE is global/us-east-1 usually

export const handler = async (event) => {
  console.log("Fetching costs...");

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Format dates as YYYY-MM-DD
  const start = firstDayOfMonth.toISOString().split('T')[0];
  const end = tomorrow.toISOString().split('T')[0];

  try {
    const command = new GetCostAndUsageCommand({
      TimePeriod: { Start: start, End: end },
      Granularity: "MONTHLY",
      Metrics: ["UnblendedCost"],
      GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }]
    });

    const response = await client.send(command);

    // Transform data for frontend
    const services = [];
    if (response.ResultsByTime) {
      response.ResultsByTime.forEach(period => {
        period.Groups.forEach(group => {
          const amount = parseFloat(group.Metrics.UnblendedCost.Amount);
          if (amount > 0) {
            services.push({
              serviceName: group.Keys[0],
              amount: amount.toFixed(4),
              unit: group.Metrics.UnblendedCost.Unit
            });
          }
        });
      });
    }

    // Sort by cost desc
    services.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        message: "Costs fetched successfully",
        data: services,
        period: { start, end }
      })
    };
  } catch (err) {
    console.error("Error fetching costs:", err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ message: "Error fetching costs", error: err.message })
    };
  }
};
