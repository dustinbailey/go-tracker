
# Go Tracker – Implementation Checklist

This checklist outlines the step-by-step tasks for implementing the Go Tracker web app using the preferred stack: Cloudflare Pages, Supabase, and Cloudflare Workers (with built-in email via MailChannels). The app should be mobile-first, lightweight, and easy to maintain.

---

## 1. Frontend (Cloudflare Pages)

- [ ] Create a new project using React (or another preferred framework)
- [ ] Style the app using Tailwind CSS for responsive, mobile-first design
- [ ] Deploy via Cloudflare Pages with GitHub integration for auto-deploys

### Logging Page

- [ ] Build a form with the following inputs:
  - Timestamp (default = current time, editable)
  - Location (select: Home, Hotel, Other)
  - Type (select: Bristol stool chart categories)
  - Speed (radio: Fast, Slow)
  - Amount (radio: Little, Normal, Monstrous)
  - Notes (optional textarea)
- [ ] Submit form data to Cloudflare Worker or directly to Supabase via REST

### Dashboard Page

- [ ] Display summary statistics (e.g., total logs, average time between movements)
- [ ] Add charts for:
  - Type, Speed, Amount, Location (bar and pie)
  - Frequency by day of week and hour of day (bar)
- [ ] Implement filtering:
  - Required: Date range
  - Optional: Location, Type, Speed, Amount

---

## 2. Database (Supabase)

- [ ] Create a new Supabase project
- [ ] Create a table: `bowel_movements` with the following fields:
  - id (UUID, primary key, default to generated UUID)
  - timestamp (timestamp with time zone, default to now)
  - location (text)
  - type (text)
  - speed (text)
  - amount (text)
  - notes (text)
  - created_at (timestamp with time zone, default to now)
- [ ] Enable Row-Level Security (optional for future user auth)
- [ ] Confirm Supabase REST API or Supabase JS client access
- [ ] Test data insertion and retrieval from the frontend

---

## 3. Backend Logic (Cloudflare Workers)

### Optionally Proxy Form Submissions

- [ ] Create a Worker to accept POST requests and forward sanitized data to Supabase

### Email Reminder System

- [ ] Create a Worker triggered by cron (every 24 hours)
- [ ] Query Supabase for entries that haven't been logged in over 48 hours
- [ ] Send email using MailChannels (via Cloudflare Worker fetch)
  - From address: noreply@gotracker.xyz or similar
  - Subject: "Go Tracker Reminder"
  - Body: "It’s been over 2 days since your last logged movement."
- [ ] Optionally: Track last reminder sent to avoid duplicates

---

## 4. Data Export

### Manual Export

- [ ] Add a "Download CSV" button on the dashboard
  - Fetch data from Supabase
  - Convert to CSV client-side and download

### Automatic Export (Optional)

- [ ] Use a cron Worker to query Supabase on a set schedule (weekly/monthly)
- [ ] Format data as CSV
- [ ] Email the file using MailChannels

---

## 5. Email Setup (No Additional Services)

- [ ] Use Cloudflare Workers to send emails via MailChannels (free, built-in)
- [ ] Set up SPF and DKIM DNS records in Cloudflare for noreply@gotracker.xyz
- [ ] Test email deliverability to common inboxes (e.g., Gmail, Outlook)
- [ ] No third-party email service (like SendGrid or Mailgun) is required

---

## 6. Security and Privacy

- [ ] Ensure Supabase REST/API keys are not exposed publicly
- [ ] Secure Cloudflare Worker endpoints from abuse (rate limiting, etc.)
- [ ] Supabase encrypts data at rest by default
- [ ] No login required, but code should allow for future user separation if needed

---

## 7. Testing and QA

- [ ] Test form and dashboard on various mobile devices
- [ ] Confirm accurate filtering and chart rendering
- [ ] Verify CSV export works as expected
- [ ] Simulate missed logs to test the email reminder system
- [ ] Confirm emails are being sent and received properly

---

## 8. Deployment and Handoff

- [ ] Create a GitHub repo with a clear README
- [ ] Include a .env.example with all required variables
- [ ] Set up deploy script or GitHub Actions for Cloudflare Worker via Wrangler
- [ ] Document:
  - How to modify Supabase schema
  - How to redeploy Cloudflare Pages or Workers
  - How to update the email logic or schedule
  - Where to adjust filtering or chart logic
