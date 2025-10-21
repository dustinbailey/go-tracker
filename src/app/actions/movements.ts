'use server';

import supabase from '@/lib/supabase';
import type { BowelMovement } from '@/lib/types';

export async function createMovement(data: BowelMovement) {
  try {
    // Get the last movement to calculate duration_from_last_hours
    const { data: lastMovements } = await supabase
      .from('gos')
      .select('timestamp')
      .order('timestamp', { ascending: false })
      .limit(1);
    
    let submitData = { ...data };
    
    // Calculate duration from last if available
    if (lastMovements && lastMovements.length > 0) {
      const lastTimestamp = new Date(lastMovements[0].timestamp);
      const currentTimestamp = new Date(data.timestamp);
      const hoursDiff = (currentTimestamp.getTime() - lastTimestamp.getTime()) / (1000 * 60 * 60);
      submitData.duration_from_last_hours = Math.round(hoursDiff * 100) / 100;
    }

    const { error } = await supabase
      .from('gos')
      .insert([submitData]);

    if (error) {
      console.error('Supabase error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Server action error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function getLastMovement() {
  try {
    const { data, error } = await supabase
      .from('gos')
      .select('timestamp')
      .order('timestamp', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Supabase error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data[0] || null };
  } catch (error) {
    console.error('Server action error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function deleteMovement(id: string) {
  try {
    const { error } = await supabase
      .from('gos')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Server action error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

