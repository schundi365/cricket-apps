/**
 * Supabase Client Configuration
 * 
 * This module initializes and exports the Supabase client instance
 * for use throughout the application.
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

import { createClient } from '@supabase/supabase-js';

// Load Supabase configuration from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  console.error('Required variables: REACT_APP_SUPABASE_URL, REACT_APP_SUPABASE_ANON_KEY');
}

// Initialize Supabase client
// If configuration is missing, create a dummy client to prevent app crashes
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Test the connection to Supabase
 * 
 * @returns {Promise<boolean>} True if connection is successful, false otherwise
 */
export async function testConnection() {
  if (!supabase) {
    console.error('Supabase client not initialized. Check your configuration.');
    return false;
  }

  try {
    // Try to query the database to test connection
    // We'll use a simple query that should work even with an empty database
    const { error } = await supabase.from('players').select('count', { count: 'exact', head: true });
    
    if (error) {
      // If the table doesn't exist yet, that's okay - connection is still working
      if (error.code === '42P01') {
        console.log('Supabase connection successful (players table not yet created)');
        return true;
      }
      console.error('Supabase connection test failed:', error.message);
      return false;
    }
    
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
}

/**
 * Get connection status information
 * 
 * @returns {Object} Connection status details
 */
export function getConnectionStatus() {
  return {
    configured: !!(supabaseUrl && supabaseAnonKey),
    url: supabaseUrl || 'Not configured',
    clientInitialized: !!supabase
  };
}
