// Google Sheets implementation maintaining Supabase API compatibility
console.log('GOOGLE SHEETS SUPABASE.JS LOADED');

// Get Google Sheet ID from environment
const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID;

console.log('Google Sheet ID:', SHEET_ID);

if (!SHEET_ID) {
  console.error('Missing Google Sheet ID!');
  console.log('Please set VITE_GOOGLE_SHEET_ID in your .env file');
}

// Global subscribers for updates
let subscribers = [];

// Generate unique ID for records
const generateId = () => {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Convert assignment object to CSV row
const assignmentToRow = (assignment) => {
  return [
    assignment.id || generateId(),
    assignment.employeeId || '',
    assignment.name || '',
    assignment.channel || '',
    assignment.category || '',
    assignment.topic || '',
    assignment.room || '',
    assignment.assignedAt || new Date().toISOString()
  ];
};

// Convert CSV row to assignment object
const rowToAssignment = (row) => {
  if (!row || row.length < 8) return null;

  return {
    id: row[0],
    employeeId: row[1],
    name: row[2],
    channel: row[3],
    category: row[4],
    topic: row[5],
    room: parseInt(row[6]) || row[6],
    assignedAt: row[7]
  };
};

// Fetch all assignments from Google Sheets
const fetchAllAssignments = async () => {
  try {
    if (!SHEET_ID) {
      console.warn('No Google Sheet ID provided, using localStorage fallback');
      return getLocalStorageAssignments();
    }

    // Google Sheets CSV export URL
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

    console.log('Fetching from Google Sheets:', csvUrl);

    const response = await fetch(csvUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();

    if (!csvText.trim()) {
      console.log('Empty sheet, returning empty array');
      return [];
    }

    // Parse CSV (simple parsing for this use case)
    const lines = csvText.split('\n').filter(line => line.trim());

    if (lines.length <= 1) {
      console.log('Only header row found, returning empty array');
      return [];
    }

    // Skip header row and convert to assignments
    const assignments = lines.slice(1)
      .map(line => {
        // Simple CSV parsing - handle quoted fields
        const row = line.split(',').map(field =>
          field.replace(/^"|"$/g, '').trim()
        );
        return rowToAssignment(row);
      })
      .filter(assignment => assignment && assignment.id);

    console.log('Fetched assignments from Google Sheets:', assignments.length);

    // Cache in localStorage for offline access
    localStorage.setItem('sheets_assignments_cache', JSON.stringify(assignments));

    return assignments;

  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    console.log('Falling back to localStorage');
    return getLocalStorageAssignments();
  }
};

// localStorage fallback functions
const getLocalStorageAssignments = () => {
  try {
    const stored = localStorage.getItem('sheets_assignments_cache') ||
                   localStorage.getItem('trainer_assignments') || '[]';
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading localStorage:', error);
    return [];
  }
};

const saveToLocalStorage = (assignments) => {
  try {
    localStorage.setItem('sheets_assignments_cache', JSON.stringify(assignments));
    localStorage.setItem('trainer_assignments', JSON.stringify(assignments)); // Backup
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Add assignment to Google Sheets
const addToGoogleSheets = async (assignment) => {
  try {
    if (!SHEET_ID) {
      console.warn('No Google Sheet ID, using localStorage only');
      return addToLocalStorageOnly(assignment);
    }

    console.log('Adding to Google Sheets:', assignment);

    // For Google Sheets, we'll use a Google Apps Script Web App
    // Since direct writing requires authentication, we'll provide instructions
    // to set up a simple Google Apps Script

    // For now, add to localStorage and show instructions
    return await addToLocalStorageOnly(assignment);

  } catch (error) {
    console.error('Error adding to Google Sheets:', error);
    return await addToLocalStorageOnly(assignment);
  }
};

const addToLocalStorageOnly = async (assignment) => {
  const assignments = await fetchAllAssignments();
  const newAssignment = {
    ...assignment,
    id: generateId(),
    assignedAt: assignment.assignedAt || new Date().toISOString()
  };

  assignments.push(newAssignment);
  saveToLocalStorage(assignments);

  // Show Google Sheets instructions
  showGoogleSheetsInstructions(newAssignment);

  return { id: newAssignment.id };
};

const showGoogleSheetsInstructions = (assignment) => {
  console.log(`
📝 TO ADD TO GOOGLE SHEETS MANUALLY:
Open your Google Sheet and add this row:

${assignment.id} | ${assignment.employeeId} | ${assignment.name} | ${assignment.channel} | ${assignment.category} | ${assignment.topic} | ${assignment.room} | ${assignment.assignedAt}

Or copy this CSV line:
${assignmentToRow(assignment).join(',')}
  `);

  // Show browser alert with instructions
  if (confirm(`New assignment created for ${assignment.name}!\n\nWould you like to see instructions to add this to your Google Sheet?`)) {
    alert(`Add this row to your Google Sheet:\n\n${assignmentToRow(assignment).join(' | ')}\n\nOr visit your Google Sheet and paste this CSV line:\n${assignmentToRow(assignment).join(',')}`);
  }
};

// Notify all subscribers
const notifySubscribers = async () => {
  const assignments = await fetchAllAssignments();

  const mockSnapshot = {
    empty: assignments.length === 0,
    docs: assignments.map(assignment => ({
      id: assignment.id,
      data: () => assignment
    })),
    forEach: (callback) => {
      assignments.forEach((assignment) => {
        callback({
          id: assignment.id,
          data: () => assignment
        });
      });
    }
  };

  subscribers.forEach(callback => callback(mockSnapshot));
};

// Mock Firebase exports
export const app = { name: '[DEFAULT]' };
export const auth = {};
export const provider = {};
export const db = {};

export const collection = (db, collectionName) => ({
  id: collectionName,
  name: collectionName
});

export const addDoc = async (collection, data) => {
  console.log('Google Sheets addDoc called with:', data);

  try {
    const result = await addToGoogleSheets(data);

    // Notify subscribers of the change
    setTimeout(() => notifySubscribers(), 100);

    return result;
  } catch (error) {
    console.error('Error in addDoc:', error);
    throw error;
  }
};

export const doc = (db, collection, id) => ({
  id,
  collection: collection.name || collection,
  path: `${collection.name || collection}/${id}`
});

export const updateDoc = async (docRef, data) => {
  console.log('Google Sheets updateDoc called:', data);

  try {
    const assignments = await fetchAllAssignments();
    const index = assignments.findIndex(a => a.id === docRef.id);

    if (index !== -1) {
      assignments[index] = { ...assignments[index], ...data };
      saveToLocalStorage(assignments);
      notifySubscribers();
    }

    return Promise.resolve();
  } catch (error) {
    console.error('Error in updateDoc:', error);
    throw error;
  }
};

export const deleteDoc = async (docRef) => {
  console.log('Google Sheets deleteDoc called for:', docRef.id);

  try {
    const assignments = await fetchAllAssignments();
    const filteredAssignments = assignments.filter(a => a.id !== docRef.id);

    saveToLocalStorage(filteredAssignments);
    notifySubscribers();

    return Promise.resolve();
  } catch (error) {
    console.error('Error in deleteDoc:', error);
    throw error;
  }
};

export const runTransaction = async (db, callback) => {
  console.log('Google Sheets runTransaction called');

  const assignments = await fetchAllAssignments();

  const transaction = {
    get: async (docRef) => {
      const assignment = assignments.find(a => a.id === docRef.id);
      return {
        exists: () => !!assignment,
        data: () => assignment || {},
        id: docRef.id
      };
    },
    set: (docRef, data) => {
      const newAssignment = { ...data, id: docRef.id };
      assignments.push(newAssignment);
    },
    update: (docRef, data) => {
      const index = assignments.findIndex(a => a.id === docRef.id);
      if (index !== -1) {
        assignments[index] = { ...assignments[index], ...data };
      }
    },
    delete: (docRef) => {
      const index = assignments.findIndex(a => a.id === docRef.id);
      if (index !== -1) {
        assignments.splice(index, 1);
      }
    }
  };

  try {
    const result = await callback(transaction);
    saveToLocalStorage(assignments);
    notifySubscribers();
    return result;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};

export const query = (collection, ...constraints) => ({
  collection,
  constraints,
  collectionName: collection.name || collection
});

export const where = (field, operator, value) => ({
  type: 'where',
  field,
  operator,
  value
});

export const limit = (count) => ({
  type: 'limit',
  limit: count
});

export const orderBy = (field, direction = 'asc') => ({
  type: 'orderBy',
  field,
  direction
});

export const getDocs = async (query) => {
  console.log('Google Sheets getDocs called');

  try {
    let assignments = await fetchAllAssignments();

    // Apply query constraints
    if (query.constraints) {
      query.constraints.forEach(constraint => {
        if (constraint.type === 'where') {
          assignments = assignments.filter(assignment => {
            const fieldValue = assignment[constraint.field];
            switch (constraint.operator) {
              case '==':
                return fieldValue === constraint.value;
              case '!=':
                return fieldValue !== constraint.value;
              case '>':
                return fieldValue > constraint.value;
              case '>=':
                return fieldValue >= constraint.value;
              case '<':
                return fieldValue < constraint.value;
              case '<=':
                return fieldValue <= constraint.value;
              case 'in':
                return constraint.value.includes(fieldValue);
              default:
                return true;
            }
          });
        } else if (constraint.type === 'orderBy') {
          assignments.sort((a, b) => {
            const aVal = a[constraint.field];
            const bVal = b[constraint.field];
            const modifier = constraint.direction === 'desc' ? -1 : 1;
            return aVal > bVal ? modifier : aVal < bVal ? -modifier : 0;
          });
        } else if (constraint.type === 'limit') {
          assignments = assignments.slice(0, constraint.limit);
        }
      });
    }

    return {
      empty: assignments.length === 0,
      docs: assignments.map(assignment => ({
        id: assignment.id,
        data: () => assignment
      })),
      forEach: (callback) => {
        assignments.forEach((assignment) => {
          callback({
            id: assignment.id,
            data: () => assignment
          });
        });
      }
    };
  } catch (error) {
    console.error('Error in getDocs:', error);
    throw error;
  }
};

export const onSnapshot = (query, callback) => {
  console.log('Google Sheets onSnapshot called');

  // Add callback to subscribers
  subscribers.push(callback);

  // Initial data load
  setTimeout(async () => {
    try {
      const assignments = await fetchAllAssignments();

      const mockSnapshot = {
        empty: assignments.length === 0,
        docs: assignments.map(assignment => ({
          id: assignment.id,
          data: () => assignment
        })),
        forEach: (callbackFn) => {
          assignments.forEach((assignment) => {
            callbackFn({
              id: assignment.id,
              data: () => assignment
            });
          });
        }
      };

      callback(mockSnapshot);
    } catch (error) {
      console.error('Error in onSnapshot initial load:', error);
    }
  }, 100);

  // Return unsubscribe function
  return () => {
    console.log('Google Sheets unsubscribe called');
    const index = subscribers.indexOf(callback);
    if (index > -1) {
      subscribers.splice(index, 1);
    }
  };
};

// Admin function to clear all data
export const clearAllAssignments = async () => {
  console.log('Clearing all assignment data...');

  try {
    localStorage.removeItem('sheets_assignments_cache');
    localStorage.removeItem('trainer_assignments');
    notifySubscribers();

    console.log('All assignments cleared from local storage');
    alert('Data cleared from local storage. To clear Google Sheets, delete all rows except the header row manually.');

    return Promise.resolve();
  } catch (error) {
    console.error('Error clearing assignments:', error);
    throw error;
  }
};

// Mock functions
export const serverTimestamp = () => {
  return new Date().toISOString();
};

export function signInWithGooglePopup() {
  console.log('Mock Google sign in');
  return Promise.resolve({ user: { uid: 'mock-user', displayName: 'Mock User' } });
}

export function signOutUser() {
  console.log('Mock sign out');
  return Promise.resolve();
}

export function onAuth(cb) {
  console.log('Mock onAuth called');
  setTimeout(() => cb(null), 100);
  return () => console.log('Mock auth unsubscribe');
}