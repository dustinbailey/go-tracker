/**
 * Go Tracker Email Reminder Worker
 * 
 * This Cloudflare Worker checks for users who haven't logged a bowel movement in 48+ hours
 * and sends them an email reminder.
 * 
 * It's designed to run on a daily schedule via Cloudflare Workers Cron.
 */

// Configure your Supabase URL and key
const SUPABASE_URL = 'your-supabase-url-here';
const SUPABASE_KEY = 'your-supabase-anon-key-here';
const RECIPIENT_EMAIL = 'your-email@example.com'; // The email to send reminders to

// Handler function for scheduled events (cron)
export default {
  async scheduled(event, env, ctx) {
    return await handleScheduled(event, env, ctx);
  },
};

async function handleScheduled(event, env, ctx) {
  console.log("Running scheduled reminder check");
  
  try {
    // Check when the last movement was logged
    const lastMovementData = await fetchLastMovementDate();
    
    if (!lastMovementData) {
      console.log("No movement data found");
      return new Response("No movement data found", { status: 200 });
    }
    
    const lastMovementDate = new Date(lastMovementData.timestamp);
    const now = new Date();
    
    // Calculate hours since last movement
    const hoursSinceLastMovement = (now.getTime() - lastMovementDate.getTime()) / (1000 * 60 * 60);
    
    console.log(`Hours since last movement: ${hoursSinceLastMovement}`);
    
    // If it's been more than 48 hours, send a reminder
    if (hoursSinceLastMovement >= 48) {
      await sendReminderEmail(hoursSinceLastMovement);
      return new Response("Reminder email sent", { status: 200 });
    } else {
      return new Response("No reminder needed", { status: 200 });
    }
  } catch (error) {
    console.error("Error in scheduled task:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}

// Fetch the date of the most recent bowel movement from Supabase
async function fetchLastMovementDate() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/bowel_movements?order=timestamp.desc&limit=1`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Supabase request failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data[0] || null;
}

// Send an email reminder using Cloudflare Workers MailChannels integration
async function sendReminderEmail(hoursSinceLastMovement) {
  const days = Math.floor(hoursSinceLastMovement / 24);
  const hours = Math.floor(hoursSinceLastMovement % 24);
  const timeString = days > 0 ? `${days} days and ${hours} hours` : `${hours} hours`;
  
  const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: RECIPIENT_EMAIL, name: 'Go Tracker User' }],
        },
      ],
      from: {
        email: 'noreply@gotracker.xyz',
        name: 'Go Tracker Reminder',
      },
      subject: 'Go Tracker Reminder: Time to log a movement',
      content: [
        {
          type: 'text/plain',
          value: `It's been ${timeString} since your last logged bowel movement. Remember to log your movements for accurate tracking.`,
        },
        {
          type: 'text/html',
          value: `<p>It's been <strong>${timeString}</strong> since your last logged bowel movement.</p>
                 <p>Remember to log your movements for accurate tracking.</p>
                 <p><a href="https://your-go-tracker-url.com/log">Log a Movement Now</a></p>`,
        },
      ],
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Email sending failed: ${error}`);
  }
  
  console.log('Reminder email sent successfully');
} 