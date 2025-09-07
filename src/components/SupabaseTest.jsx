import React, { useState, useEffect } from 'react';
// Corrected import path to navigate up one directory
import { addDoc, collection, getDocs, onSnapshot } from '../googleSheets';

const SupabaseTest = () => {
  const [status, setStatus] = useState('Checking connection...');
  const [logs, setLogs] = useState([]);
  const [testData, setTestData] = useState(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
    console.log(`[${timestamp}] ${message}`);
  };

  const testGoogleSheetsAPI = async () => {
    addLog('=== Testing Google Sheets API ===');

    try {
      addLog('📝 Attempting to fetch from API URL...');
      const response = await fetch('https://script.google.com/macros/s/AKfycbyi4ECknQnjudty6_mRnsQr9hcZ3V7tbhCs4jpNblybZGvGWAU3x1NkZBM5BSdONJ7ptw/exec');
      const result = await response.json();

      if (response.ok && result && Array.isArray(result.data)) {
        addLog(`✅ Google Sheets API is accessible. Fetched ${result.data.length} records.`);
        return true;
      } else {
        addLog(`❌ API call failed or returned invalid data. Status: ${response.status}`, 'error');
        addLog(`Response: ${JSON.stringify(result, null, 2)}`, 'error');
        return false;
      }
    } catch (error) {
      addLog(`❌ Direct Google Sheets API connection failed: ${error.message}`, 'error');
      return false;
    }
  };

  const testAddRecord = async () => {
    addLog('=== Testing Add Record ===');

    try {
      const testRecord = {
        employeeId: 'DEBUG_GS',
        name: 'Google Sheets Test User',
        channel: 'Banca',
        category: 'Rookie',
        topic: 'Debug Test Topic',
        room: '1',
        assignedAt: new Date().toISOString()
      };

      addLog('📝 Attempting to add test record...');
      const result = await addDoc(collection(null, 'assignments'), testRecord);

      if (result.id) {
        addLog(`✅ Test record added successfully with ID: ${result.id}`);
        setTestData(testRecord);
        return true;
      } else {
        addLog('❌ Failed to add record, no ID returned.', 'error');
        addLog(`Result: ${JSON.stringify(result, null, 2)}`, 'error');
        return false;
      }
    } catch (error) {
      addLog(`❌ Failed to add test record: ${error.message}`, 'error');
      addLog(`Error details: ${JSON.stringify(error, null, 2)}`, 'error');
      return false;
    }
  };

  const testGetRecords = async () => {
    addLog('=== Testing Get Records ===');

    try {
      const snapshot = await getDocs(collection(null, 'assignments'));

      if (snapshot && snapshot.docs) {
        addLog(`✅ Retrieved ${snapshot.docs.length} records from database`);
        if (snapshot.docs.length > 0) {
          const firstRecord = snapshot.docs[0].data();
          addLog(`📄 Sample record: ${firstRecord.name} (${firstRecord.employeeId})`);
        }
        return true;
      } else {
        addLog('❌ Failed to get records, invalid snapshot returned.', 'error');
        addLog(`Snapshot: ${JSON.stringify(snapshot, null, 2)}`, 'error');
        return false;
      }
    } catch (error) {
      addLog(`❌ Failed to get records: ${error.message}`, 'error');
      return false;
    }
  };

  const runFullTest = async () => {
    setLogs([]);
    setStatus('Running tests...');

    // Test 1: Direct Google Sheets API connection
    const apiTest = await testGoogleSheetsAPI();
    if (!apiTest) {
      setStatus('❌ Google Sheets API test failed');
      return;
    }

    // Test 2: Add Record
    const addTest = await testAddRecord();
    if (!addTest) {
      setStatus('❌ Add record test failed');
      return;
    }

    // Wait for data to sync
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 3: Get Records
    const getTest = await testGetRecords();
    if (!getTest) {
      setStatus('❌ Get records test failed');
      return;
    }

    setStatus('✅ All tests passed! Google Sheets is working correctly.');
    addLog('🎉 All tests completed successfully!');
  };

  useEffect(() => {
    runFullTest();
  }, []);

  return (
    <div style={{
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'monospace',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px'
    }}>
      <h2>Google Sheets Connection Test</h2>

      <div style={{
        padding: '10px',
        backgroundColor: '#fff',
        borderRadius: '4px',
        marginBottom: '20px',
        border: '1px solid #ddd'
      }}>
        <strong>Status:</strong> {status}
      </div>

      <button
        onClick={runFullTest}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        Run Tests Again
      </button>

      <div style={{
        backgroundColor: '#000',
        color: '#00ff00',
        padding: '15px',
        borderRadius: '4px',
        height: '400px',
        overflowY: 'auto',
        fontSize: '12px'
      }}>
        <div><strong>🔍 Debug Logs:</strong></div>
        <div>---</div>
        {logs.map((log, index) => (
          <div
            key={index}
            style={{
              color: log.type === 'error' ? '#ff6b6b' :
                     log.type === 'warning' ? '#ffd93d' : '#00ff00',
              marginBottom: '2px'
            }}
          >
            [{log.timestamp}] {log.message}
          </div>
        ))}
      </div>

      {testData && (
        <div style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#e8f5e8',
          borderRadius: '4px'
        }}>
          <strong>✅ Test record added:</strong>
          <pre>{JSON.stringify(testData, null, 2)}</pre>
          <p><em>Check your Google Sheet to see this record.</em></p>
        </div>
      )}
    </div>
  );
};

export default SupabaseTest;
