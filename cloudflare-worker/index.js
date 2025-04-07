/**
 * Go Tracker Email Reminder Worker
 * 
 * This Cloudflare Worker checks for users who haven't logged a bowel movement in 72+ hours
 * and triggers a webhook at specific thresholds (72, 96, 120, 144 hours).
 * 
 * It's designed to run on an hourly schedule via Cloudflare Workers Cron.
 * 
 * TESTING INSTRUCTIONS:
 * ---------------------
 * To test this worker, you can use the following endpoints:
 * 
 * 1. /test-reminder
 *    This will run the normal reminder check process. It will check the most recent entry 
 *    in the database and determine if any reminder threshold has been crossed.
 *    Example: https://go-tracker-reminder.dustin-bailey-personal.workers.dev/test-reminder
 * 
 * 2. /force-webhook?hours=X
 *    This will force the webhook to be triggered with a specific hour threshold.
 *    Replace X with one of the threshold values (72, 96, 120, or 144).
 *    Example: https://go-tracker-reminder.dustin-bailey-personal.workers.dev/force-webhook?hours=96
 */

// Reminder thresholds in hours
// const REMINDER_THRESHOLDS = [72, 96, 120, 144]; // Standard thresholds
const REMINDER_THRESHOLDS = [6, 8, 12, 14]; // Testing thresholds

// Handler function for HTTP requests and scheduled events
export default {
  // Handle HTTP requests to the worker
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // TEST ENDPOINT 1: Run the normal reminder check
    // This simulates what happens when the scheduled task runs
    // It will check the last database entry and determine if a reminder should be sent
    if (url.pathname === '/test-reminder') {
      return await handleScheduled(null, env, ctx);
    }
    
    // TEST ENDPOINT 2: Force a webhook trigger with a specific threshold
    // This bypasses the database check and directly triggers the webhook
    // Use the 'hours' query parameter to specify the threshold (default: 72)
    // Example: /force-webhook?hours=96
    if (url.pathname === '/force-webhook') {
      const threshold = parseInt(url.searchParams.get('hours') || '72');
      await triggerWebhook(threshold, env);
      return new Response(`Forced webhook triggered for ${threshold} hour threshold`, {
        headers: { 'Content-Type': 'text/plain' },
      });
    }
    
    // Default response for other HTTP requests
    return new Response("Go Tracker Reminder Service", {
      headers: { 'Content-Type': 'text/plain' },
    });
  },
  
  // Handle scheduled events (cron)
  async scheduled(event, env, ctx) {
    return await handleScheduled(event, env, ctx);
  },
};

async function handleScheduled(event, env, ctx) {
  console.log("Running scheduled reminder check");
  
  try {
    // Check when the last movement was logged
    const lastMovementData = await fetchLastMovementDate(env);
    
    if (!lastMovementData) {
      console.log("No movement data found");
      return new Response("No movement data found", { status: 200 });
    }
    
    const lastMovementDate = new Date(lastMovementData.timestamp);
    const now = new Date();
    
    // Calculate hours since last movement
    // Subtract 4 hours to account for Eastern Time timestamps
    const hoursSinceLastMovement = (now.getTime() - lastMovementDate.getTime()) / (1000 * 60 * 60) - 4;
    
    console.log(`Hours since last movement (adjusted for ET): ${hoursSinceLastMovement.toFixed(2)}`);
    
    // Check if we've passed any of our reminder thresholds
    const threshold = findNextThresholdPassed(hoursSinceLastMovement);
    
    if (threshold) {
      await triggerWebhook(threshold, env);
      return new Response(`Reminder webhook triggered for ${threshold} hour threshold. Hours since last movement (ET adjusted): ${hoursSinceLastMovement.toFixed(2)}`, { status: 200 });
    } else {
      return new Response(`No reminder threshold reached. Hours since last movement (ET adjusted): ${hoursSinceLastMovement.toFixed(2)}`, { status: 200 });
    }
  } catch (error) {
    console.error("Error in scheduled task:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}

// Find the next threshold that has been passed
function findNextThresholdPassed(hoursSinceLastMovement) {
  // Sort thresholds to ensure they're in ascending order
  const sortedThresholds = [...REMINDER_THRESHOLDS].sort((a, b) => a - b);
  
  // Find the smallest threshold that is greater than or equal to the hours since last movement
  for (const threshold of sortedThresholds) {
    if (hoursSinceLastMovement >= threshold && hoursSinceLastMovement < threshold + 1) {
      return threshold;
    }
  }
  
  return null;
}

// Fetch the date of the most recent bowel movement from Supabase
async function fetchLastMovementDate(env) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_KEY;
  
  const response = await fetch(`${supabaseUrl}/rest/v1/gos?order=timestamp.desc&limit=1`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Supabase request failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data[0] || null;
}

// Trigger webhook with just the hour threshold
async function triggerWebhook(hoursThreshold, env) {
  const webhookUrl = env.WEBHOOK_URL;
  
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      hours: hoursThreshold
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Webhook trigger failed: ${error}`);
  }
  
  console.log(`Webhook triggered successfully for ${hoursThreshold} hour threshold`);
} 