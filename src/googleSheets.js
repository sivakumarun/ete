// Google Sheets implementation maintaining Supabase API compatibility

// Replace with your actual Google Apps Script Web App URL
const API_URL = 'https://script.google.com/macros/s/AKfycbyi4ECknQnjudty6_mRnsQr9hcZ3V7tbhCs4jpNblybZGvGWAU3x1NkZBM5BSdONJ7ptw/exec';

console.log('GOOGLE SHEETS WRAPPER LOADED');
console.log('Using API URL:', API_URL);

// Global state to store assignments
let assignmentsCache = [];
let subscribers = [];
let fetching = false;
let lastFetchTime = 0;
const FETCH_COOLDOWN = 1000; // 1 second cooldown to prevent too many requests

// Function to fetch data from Google Sheets
const fetchAssignments = async () => {
  const now = Date.now();
  if (fetching || (now - lastFetchTime < FETCH_COOLDOWN)) {
    return Promise.resolve(assignmentsCache);
  }

  fetching = true;
  lastFetchTime = now;
  try {
    const response = await fetch(API_URL);
    const result = await response.json();

    // Check for success and proper data structure
    if (!result.data || !Array.isArray(result.data)) {
        console.error('API response is missing "data" array:', result);
        return [];
    }

    // Filter out rows that are completely empty
    const filteredData = result.data.filter(item => Object.values(item).some(val => val !== ''));

    // Map data to the expected format
    assignmentsCache = filteredData.map(item => ({
      id: item.id,
      employeeId: item.employeeId,
      name: item.name,
      channel: item.channel,
      category: item.category,
      topic: item.topic,
      room: parseInt(item.room),
      assignedAt: item.assignedAt
    }));

    console.log('Fetched assignments from Google Sheets:', assignmentsCache.length);
    return assignmentsCache;
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    return [];
  } finally {
    fetching = false;
  }
};

// Function to notify all listeners
const notifySubscribers = async () => {
  await fetchAssignments(); // Ensure cache is up-to-date
  const snapshot = {
    docs: assignmentsCache.map(doc => ({
      id: doc.id,
      data: () => doc
    })),
    forEach: (callback) => {
      assignmentsCache.forEach(doc => callback({
        id: doc.id,
        data: () => doc
      }));
    }
  };
  subscribers.forEach(sub => sub(snapshot));
};

// Public facing functions to be imported
export const db = {};
export const collection = (db, name) => ({ id: name });

export const addDoc = async (collection, data) => {
  console.log('Posting data to Google Sheets...', data);
  const formData = new FormData();
  // Ensure all keys are present for the form data
  formData.append('id', data.id || `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  formData.append('employeeId', data.employeeId || '');
  formData.append('name', data.name || '');
  formData.append('channel', data.channel || '');
  formData.append('category', data.category || '');
  formData.append('topic', data.topic || '');
  formData.append('room', data.room || '');
  formData.append('assignedAt', data.assignedAt || new Date().toISOString());

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData
    });
    const result = await response.json();
    console.log('Post successful:', result);

    // After adding data, refetch and update all subscribers
    // Use a slight delay to allow the sheet to update
    setTimeout(() => notifySubscribers(), 2000);

    return { id: data.id };
  } catch (error) {
    console.error('Failed to post data:', error);
    throw error;
  }
};

export const onSnapshot = (query, callback) => {
  subscribers.push(callback);

  fetchAssignments().then(() => {
    notifySubscribers();
  });

  return () => {
    subscribers = subscribers.filter(sub => sub !== callback);
  };
};

export const getDocs = async (query) => {
  await fetchAssignments();
  const filteredData = assignmentsCache.filter(item => {
    if (query && query.constraints) {
      return query.constraints.every(c => {
        if (c.type === 'where' && c.operator === '==') {
          return item[c.field] === c.value;
        }
        return true;
      });
    }
    return true;
  });
  return {
    docs: filteredData.map(doc => ({ id: doc.id, data: () => doc }))
  };
};

export const doc = (db, collection, id) => ({
  id,
  collection: collection.name || collection,
  path: `${collection.name || collection}/${id}`
});

export const query = (col, ...constraints) => ({ col, constraints, type: 'query' });
export const where = (field, op, value) => ({ type: 'where', field, operator: op, value });

export const deleteDoc = async (docRef) => {
  console.warn('Delete functionality is not fully implemented for this simple Google Sheets backend. This is a mock function.');
  alert('Deletion from Google Sheets is not supported with this simple backend. Please delete rows manually.');
  return Promise.resolve();
};

export const clearAllAssignments = async () => {
  console.warn('Clear All functionality is not fully implemented for this simple Google Sheets backend. This is a mock function.');
  alert('Clearing all data from Google Sheets is not supported with this simple backend. Please delete rows manually from your sheet.');
  return Promise.resolve();
};
