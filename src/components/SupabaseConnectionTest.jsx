/**
 * Supabase Connection Test Component
 * 
 * A simple component to test and display Supabase connection status
 * Useful for debugging and verifying configuration
 * 
 * Requirements: 1.2, 1.4
 */

import React, { useState, useEffect } from 'react';
import { testConnection, getConnectionStatus } from '../lib/supabase';

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [connectionResult, setConnectionResult] = useState(null);

  useEffect(() => {
    // Get initial connection status
    const initialStatus = getConnectionStatus();
    setStatus(initialStatus);
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setConnectionResult(null);

    try {
      const result = await testConnection();
      setConnectionResult({
        success: result,
        message: result 
          ? 'Successfully connected to Supabase!' 
          : 'Failed to connect to Supabase. Check console for details.'
      });
    } catch (error) {
      setConnectionResult({
        success: false,
        message: `Connection error: ${error.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  if (!status) {
    return <div>Loading connection status...</div>;
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Supabase Connection Status</h3>
      
      <div style={styles.statusSection}>
        <div style={styles.statusItem}>
          <strong>Configured:</strong> 
          <span style={status.configured ? styles.success : styles.error}>
            {status.configured ? ' ✓ Yes' : ' ✗ No'}
          </span>
        </div>
        
        <div style={styles.statusItem}>
          <strong>Project URL:</strong> 
          <span style={styles.value}> {status.url}</span>
        </div>
        
        <div style={styles.statusItem}>
          <strong>Client Initialized:</strong> 
          <span style={status.clientInitialized ? styles.success : styles.error}>
            {status.clientInitialized ? ' ✓ Yes' : ' ✗ No'}
          </span>
        </div>
      </div>

      <button 
        onClick={handleTestConnection} 
        disabled={!status.configured || testing}
        style={{
          ...styles.button,
          ...((!status.configured || testing) && styles.buttonDisabled)
        }}
      >
        {testing ? 'Testing Connection...' : 'Test Connection'}
      </button>

      {connectionResult && (
        <div style={{
          ...styles.result,
          ...(connectionResult.success ? styles.resultSuccess : styles.resultError)
        }}>
          {connectionResult.message}
        </div>
      )}

      {!status.configured && (
        <div style={styles.warning}>
          <strong>⚠️ Configuration Required</strong>
          <p>Please set up your Supabase credentials in the .env file.</p>
          <p>See SUPABASE_SETUP.md for instructions.</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    maxWidth: '600px',
    margin: '20px auto',
    fontFamily: 'Arial, sans-serif'
  },
  title: {
    marginTop: 0,
    color: '#333'
  },
  statusSection: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px'
  },
  statusItem: {
    marginBottom: '10px',
    fontSize: '14px'
  },
  value: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#666'
  },
  success: {
    color: '#28a745',
    fontWeight: 'bold'
  },
  error: {
    color: '#dc3545',
    fontWeight: 'bold'
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    width: '100%'
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  result: {
    marginTop: '15px',
    padding: '12px',
    borderRadius: '4px',
    fontSize: '14px'
  },
  resultSuccess: {
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb'
  },
  resultError: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb'
  },
  warning: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    borderRadius: '4px',
    color: '#856404'
  }
};

export default SupabaseConnectionTest;
