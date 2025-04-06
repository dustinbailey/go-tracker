# Requirements Document: Go Tracker Web App

## Overview

The Go Tracker web app allows users to log bowel movements through an intuitive, mobile-friendly interface. It also provides visualizations for logged data with filtering options and automated notifications to remind users if movements haven't been logged recently.

## Functional Requirements

### 1. Data Input Form

- Timestamp (auto-filled with current date/time, editable)
- Location: Home, Hotel, Other (single-select)
- Type (Bristol stool chart):
    - Small hard lumps (constipation)
    - Hard sausage (mild constipation)
    - Sausage with cracks on surface
    - Smooth & soft sausage
    - Soft pieces
    - Fluffy pieces (mild diarrhea)
    - Watery (diarrhea)
- Speed: Fast, Slow
- Amount: Little, Normal, Monstrous
- Notes (optional text field)
- Mobile-optimized, responsive design

### 2. Data Visualization Dashboard

- Summary statistics (e.g., total logged entries, average duration between movements)
- Distribution charts:
    - Bar chart and pie chart for Type
    - Bar chart and pie chart for Speed
    - Bar chart and pie chart for Amount
    - Bar chart and pie chart for Location
    - Bar chart showing frequency by day of the week
    - Bar chart showing frequency by hour of the day
- Filtering capabilities:
    - Date range (required)
    - Location (optional)
    - Type, Speed, Amount (optional)
- Accessible via web, responsive to desktop and mobile

### 3. Automated Email Notifications

- Sends an email alert if no movement has been logged in over 48 hours
- Continues sending alerts every 24 hours until a new entry is logged
- Email content is simple and clear (e.g., "Reminder: It's been over 2 days since your last logged movement.")

### 4. Data Export

- Manual data export capability (CSV format)
- Automatic periodic data exports emailed directly to user (CSV)
- Frequency of automatic exports configurable (e.g., weekly or monthly)

## Technical Requirements

### Hosting & Deployment

- Must be deployed on a free or very low-cost platform
- Suggested platforms (but open to others):
    - Supabase (backend/database)
    - GitHub Pages or Cloudflare Pages (frontend hosting)
    - Cloudflare Workers or similar for backend logic and notifications

### Database

- Lightweight relational database (Supabase recommended)
- Secure data storage with easy querying and CSV export

### Notification System

- Utilize a simple cron job or scheduled task (e.g., Cloudflare Workers Cron or Supabase scheduled functions)
- Email service integration (e.g., SendGrid, Mailgun, or Supabase built-in email)

## User Interface (UI) Considerations

- Minimalistic, clean design for ease of use
- Mobile-first responsive design
- Clear and intuitive data-entry forms
- Easy-to-understand visualizations

## Security and Privacy

- Ensure data privacy and secure storage (encrypted at rest, secured API endpoints)
- No login functionality at this time

## Maintenance & Scalability

- Low-volume app; simple maintenance required
- Designed for ease of future updates or scalability, if needed