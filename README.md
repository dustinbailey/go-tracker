# Go Tracker

A simple web app for tracking bowel movements with data visualization and automated reminders.

## Features

- Log bowel movements with details like:
  - Type (Bristol stool chart)
  - Location
  - Speed
  - Amount
  - Optional notes
- View visualizations of your data:
  - Distributions by type, location, speed, and amount
  - Frequency by day of week and hour of day
- Filter data by date range and other attributes
- Export data as CSV
- Automated email reminders if no movement has been logged in 48+ hours

## Tech Stack

- **Frontend**: Next.js with Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Email Reminders**: Cloudflare Workers with MailChannels

## Setup Instructions

### 1. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. In the SQL editor, run the SQL queries from `supabase-schema.sql`
3. Go to Project Settings > API to get your API URL and anon key

### 2. Set up the Next.js frontend

1. Clone this repository
2. Create a `.env.local` file based on `.env.example` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Run the development server:
   ```
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser

### 3. Set up Cloudflare Worker for reminders (optional)

1. Sign up for a [Cloudflare Workers](https://workers.cloudflare.com/) account
2. Install Wrangler CLI:
   ```
   npm install -g wrangler
   ```
3. Navigate to the `cloudflare-worker` directory
4. Edit `index.js` to update:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `RECIPIENT_EMAIL` (the email address to send reminders to)
5. Login to Cloudflare:
   ```
   wrangler login
   ```
6. Deploy the worker:
   ```
   wrangler deploy
   ```

### 4. Deploy the frontend (Cloudflare Pages)

1. Push your code to a GitHub repository
2. In Cloudflare Pages, create a new project connected to your repository
3. Set the build settings:
   - Build command: `npm run build`
   - Build output directory: `out`
4. Add environment variables for Supabase (same as `.env.local`)
5. Deploy!

## Usage

### Logging Movements

1. Click "Log a Movement" on the homepage
2. Fill out the form with the details of your bowel movement
3. Submit the form

### Viewing Data

1. Click "Dashboard" to see visualizations of your data
2. Use the filters to refine the date range or other attributes
3. Export data as CSV for further analysis if needed

## Maintenance & Updates

### Modifying the Database Schema

If you need to modify the database schema:
1. Update the `supabase-schema.sql` file
2. Run the updated SQL queries in the Supabase SQL editor
3. Update the TypeScript types in `src/lib/types.ts`

### Updating the Email Reminder Schedule

To change when email reminders are sent:
1. Edit the `crons` array in `cloudflare-worker/wrangler.toml`
2. Redeploy the worker with `wrangler deploy`

## Importing Existing Data

The application supports importing data from a CSV file. The CSV file should have the following columns:

- Timestamp: Date and time in format "YYYY-MM-DD H:MMam/pm"
- Type: Bristol stool scale type (e.g., "4: Smooth & soft sausage")
- Speed: "Fast" or "Slow"
- Amount: "Little", "Normal", or "Monstrous"
- Notes: Optional notes
- Location: "Home", "Hotel", or "Other"
- Duration From Last (Hours): Time since previous entry in hours
- Day of Week: 0-6 (0 = Sunday, 6 = Saturday)
- Hour of Day: 0-23 (24-hour format)

### Running the Import

1. Ensure your `.env.local` file is configured with your Supabase credentials.
2. Place your CSV file named `existingdata.csv` in the root directory.
3. Install the required dependencies:
   ```
   npm install
   ```
4. Run the import script:
   ```
   npm run import-data
   ```

The import script will process the CSV file and import the data into your Supabase database in batches.

### Data Visualization

After importing data, you can view various visualizations in the dashboard, including:
- Distribution by type, location, speed, and amount
- Frequency by day of week and hour of day
- Summary statistics like average time between movements
