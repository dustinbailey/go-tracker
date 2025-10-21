import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create a new movement
export async function POST(request: Request) {
  try {
    const movement = await request.json();

    // Get the last movement to calculate duration_from_last_hours
    const { data: lastMovement } = await supabase
      .from('gos')
      .select('timestamp')
      .order('timestamp', { ascending: false })
      .limit(1);

    // Calculate duration from last movement if it exists
    if (lastMovement && lastMovement.length > 0) {
      const lastTimestamp = new Date(lastMovement[0].timestamp);
      const currentTimestamp = new Date(movement.timestamp);
      const hoursDiff = (currentTimestamp.getTime() - lastTimestamp.getTime()) / (1000 * 60 * 60);
      movement.duration_from_last_hours = Math.round(hoursDiff * 100) / 100; // Round to 2 decimal places
    }

    const { error } = await supabase
      .from('gos')
      .insert([movement]);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get the last movement
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('gos')
      .select('timestamp')
      .order('timestamp', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: data[0] || null });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Delete a movement by ID
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('gos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

