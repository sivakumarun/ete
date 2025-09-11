import React, { useState, useEffect } from 'react';
import TrainerForm from './components/TrainerForm';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import AssignmentResults from './components/AssignmentResults';
import SpinWheel from './components/SpinWheel';
import Navigation from './components/Navigation';
import SupabaseTest from './components/SupabaseTest';
import { db, collection, getDocs, addDoc, query, where, onSnapshot } from './googleSheets';
import './App.css';

// Topic pools for different categories
const TOPIC_POOLS = {
  banca_rookie: [
    'Simply Save Card', 'Simply Click Card', 'Balance Transfer and Flexipay', 'Pulse Card',
    'Basic of Credit Card', 'Grooming', 'SBI Card Introduction', 'SURROGATES : FD/ SAVINGS/  HOME LOAN/CSP',
    'KYC POLICY', 'Add on'
  ],
  banca_vintage: [
    'Secured Surrogate', 'Happy Home Loan/Wealth', 'CSP/Kuber', 'M1 - Approaching & Need Analysis',
    'M1 - Presentation Skills', 'M1 - Objection Handling & Closing Skills', 'M2 - Verification Decline',
    'M2 - Policy Decline', 'M2 - Fraud Decline', 'M2 - CIBIL, Underwriting & Dedupe Declines',
    'M12 - Goal Setting Exercise', 'M12 - Prospecting Right', 'M12 - Documenting Right',
    'Major RTB Reasons & Prevention Methods', 'Product - Elite Card', 'Product - Aurum Card',
    'Product - Prime Card', 'Product - Pulse Card', 'Yono Sprint Process', 'INB and INB Error Codes',
    'Yono BRE Journey'
  ],
  retail_rookie: [
    'Basics of credit card', 'Simply Click', 'BPCL Octane', 'Prevention of Mis Selling',
    'Top 3 Surrogates', 'Mobile QDE (M0)', 'Grooming', 'Add on card', 'Prospecting (M1)',
    'Value Added Service – Flexipay & Balance Transfer'
  ],
  retail_vintage: [
    'DIGI MID & E-sign', 'Importance of Right Mobile QDE (M0)', 'V Declines – V1 & V2', 'V Declines – V3 & V4',
    'V Declines – V13/V14 & V17', 'Policy Declines', 'Fraud Declines', 'Right Prospecting', 'Top 3 Surrogates',
    'Surrogates - Salaried', 'Surrogates - Self Employed', 'Add on card', 'Objection handling',
    'Product pitching (M1)', 'Aurum', 'Elite Card', 'Goal setting – BRE (M12)', 'KYC Policy', 'Grooming',
    'Reliance Prime', 'BPCL Octane', 'TATA Neu Infinity', 'VAS – Flexipay & Balance Transfer'
  ]
};

function App() {
  const [currentView, setCurrentView] = useState('form');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Check if admin is already authenticated on app load
  useEffect(() => {
    const checkAdminAuth = () => {
      const isAuthenticated = sessionStorage.getItem('adminAuthenticated') === 'true';
      const loginTime = sessionStorage.getItem('adminLoginTime');

      if (isAuthenticated && loginTime) {
        // Check if session is still valid (24 hours)
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now - loginDate) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
          setIsAdminAuthenticated(true);
        } else {
          // Session expired, clear it
          sessionStorage.removeItem('adminAuthenticated');
          sessionStorage.removeItem('adminLoginTime');
        }
      }
    };

    checkAdminAuth();
  }, []);

  // Load existing assignments from Google Sheets
  useEffect(() => {
    console.log('Setting up assignments listener...');

    const unsubscribe = onSnapshot(
      collection(db, 'assignments'),
      (snapshot) => {
        const assignmentData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          assignmentData.push({
            id: doc.id,
            ...data
          });
        });

        console.log('Assignments loaded from Google Sheets:', assignmentData);
        console.log('Total assignments count:', assignmentData.length);

        // Debug: Log all employee IDs
        const employeeIds = assignmentData.map(a => a.employeeId);
        console.log('All Employee IDs in database:', employeeIds);

        setAssignments(assignmentData);
        setDataLoaded(true);
      },
      (error) => {
        console.error('Error loading assignments:', error);
        setDataLoaded(true); // Still set to true to allow form submission
      }
    );

    return () => unsubscribe();
  }, []);

  // Enhanced function to check for existing assignment
  const checkExistingAssignment = async (employeeId) => {
    console.log('=== DUPLICATE CHECK START ===');
    console.log('Checking for Employee ID:', employeeId);
    console.log('Employee ID type:', typeof employeeId);
    console.log('Current assignments in state:', assignments.length);

    try {
      // Ensure employeeId is a string and trimmed
      const cleanEmployeeId = String(employeeId).trim();
      console.log('Cleaned Employee ID:', cleanEmployeeId);

      // Method 1: Check local state first
      console.log('Method 1: Checking local state...');
      const localExisting = assignments.find(assignment => {
        const assignmentId = String(assignment.employeeId).trim();
        console.log(`Comparing: "${cleanEmployeeId}" === "${assignmentId}"`, cleanEmployeeId === assignmentId);
        return assignmentId === cleanEmployeeId;
      });

      if (localExisting) {
        console.log('DUPLICATE FOUND in local state:', localExisting);
        return localExisting;
      }

      // Method 2: Direct database query
      console.log('Method 2: Querying database directly...');
      const q = query(
        collection(db, 'assignments'),
        where('employeeId', '==', cleanEmployeeId)
      );

      const querySnapshot = await getDocs(q);
      console.log('Database query result - Empty?', querySnapshot.empty);
      console.log('Database query result - Size:', querySnapshot.size);

      if (!querySnapshot.empty) {
        const existingAssignment = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data()
        };
        console.log('DUPLICATE FOUND in database:', existingAssignment);
        return existingAssignment;
      }

      // Method 3: Alternative check - Get all docs and manually search
      console.log('Method 3: Manual search through all documents...');
      const allDocsQuery = query(collection(db, 'assignments'));
      const allDocsSnapshot = await getDocs(allDocsQuery);

      console.log('Total docs in database:', allDocsSnapshot.size);

      let manualFound = null;
      allDocsSnapshot.forEach((doc) => {
        const data = doc.data();
        const docEmployeeId = String(data.employeeId).trim();
        console.log(`Manual check: "${cleanEmployeeId}" === "${docEmployeeId}"`, cleanEmployeeId === docEmployeeId);

        if (docEmployeeId === cleanEmployeeId) {
          manualFound = { id: doc.id, ...data };
          console.log('DUPLICATE FOUND in manual search:', manualFound);
        }
      });

      if (manualFound) {
        return manualFound;
      }

      console.log('NO DUPLICATE FOUND - Employee ID is unique');
      console.log('=== DUPLICATE CHECK END ===');
      return null;

    } catch (error) {
      console.error('Error in duplicate check:', error);
      console.log('=== DUPLICATE CHECK END (ERROR) ===');
      // Return null to allow assignment if check fails
      return null;
    }
  };

  const getAvailableTopics = (channel, category, roomNumber) => {
    const topicKey = `${channel.toLowerCase()}_${category.toLowerCase()}`;
    const allTopics = TOPIC_POOLS[topicKey] || [];

    // Get already assigned topics in this room
    const assignedTopicsInRoom = assignments
      .filter(assignment => assignment.room === roomNumber)
      .map(assignment => assignment.topic);

    // Return topics not yet assigned in this room
    return allTopics.filter(topic => !assignedTopicsInRoom.includes(topic));
  };

  const assignTopic = async (trainerData) => {
    console.log('=== ASSIGNMENT PROCESS START ===');
    console.log('Form data received:', trainerData);

    setLoading(true);

    try {
      // Wait for data to be loaded before proceeding
      if (!dataLoaded) {
        console.log('Waiting for data to load...');
        // Wait a bit and try again
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Ensure employeeId is clean
      const cleanEmployeeId = String(trainerData.employeeId).trim();
      const cleanTrainerData = {
        ...trainerData,
        employeeId: cleanEmployeeId,
        name: trainerData.name.trim()
      };

      console.log('Cleaned trainer data:', cleanTrainerData);

      // Check if trainer already has assignment
      const existing = await checkExistingAssignment(cleanEmployeeId);

      if (existing) {
        console.log('STOPPING: Duplicate found!');//         alert(`Employee ID ${cleanEmployeeId} already has an assignment!\n\nAssigned Topic: ${existing.topic}\nRoom: ${existing.room}\n\nShowing your previous result.`);
        setSelectedTrainer(existing);
        setCurrentView('result');
        setLoading(false);
        return;
      }

      console.log('No duplicate found. Proceeding with new assignment...');

      // Use the selected room from form data
      const roomNumber = parseInt(cleanTrainerData.room);

      // Get available topics for this room and category
      const availableTopics = getAvailableTopics(
        cleanTrainerData.channel,
        cleanTrainerData.category,
        roomNumber
      );

      if (availableTopics.length === 0) {
        console.warn(`All topics have been assigned for ${cleanTrainerData.channel} ${cleanTrainerData.category} in Room ${roomNumber}! Please select a different room or contact the administrator.`);
        setLoading(false);
        return;
      }

      // Randomly select topic from available topics
      const randomTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];

      const assignment = {
        ...cleanTrainerData,
        topic: randomTopic,
        room: roomNumber,
        assignedAt: new Date().toISOString()
      };

      console.log('Creating new assignment:', assignment);

      // Save to Google Sheets
      const docRef = await addDoc(collection(db, 'assignments'), assignment);

      // Add the document ID to the assignment object
      const assignmentWithId = {
        ...assignment,
        id: docRef.id
      };

      console.log('Assignment created successfully with ID:', docRef.id);
      console.log('=== ASSIGNMENT PROCESS END (SUCCESS) ===');

      setSelectedTrainer(assignmentWithId);
      setCurrentView('spin');

    } catch (error) {
      console.error('Error in assignment process:', error);
      console.log('=== ASSIGNMENT PROCESS END (ERROR) ===');

      // Last attempt: check if it was actually created despite the error
      try {
        const lastCheck = await checkExistingAssignment(cleanEmployeeId);
        if (lastCheck) {
          console.log('Assignment was created despite error');
          setSelectedTrainer(lastCheck);
          setCurrentView('result');
        } else {
          alert('Error occurred while assigning topic. Please try again.');
        }
      } catch (recheckError) {
        console.error('Error in recheck:', recheckError);
        alert('Error occurred while assigning topic. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSpinComplete = () => {
    resetToForm();
  };

  const resetToForm = () => {
    setCurrentView('form');
    setSelectedTrainer(null);
  };

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
    setCurrentView('admin');
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    sessionStorage.removeItem('adminLoginTime');
    setIsAdminAuthenticated(false);
    setCurrentView('form');
  };

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
      setCurrentView('admin');
    } else {
      setCurrentView('admin-login');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Trainer Facilitation Topic Picker</h1>
          <Navigation
            currentView={currentView}
            setCurrentView={setCurrentView}
            onAdminAccess={handleAdminAccess}
            isAdminAuthenticated={isAdminAuthenticated}
            onAdminLogout={handleAdminLogout}
          />
        </div>
      </header>

      <main className="app-main">
        {currentView === 'form' && (
          <TrainerForm
            onSubmit={assignTopic}
            loading={loading}
            dataLoaded={dataLoaded}
          />
        )}

        {currentView === 'spin' && selectedTrainer && (
          <SpinWheel
            trainer={selectedTrainer}
            onSpinComplete={handleSpinComplete}
          />
        )}
        {currentView === 'test' && <SupabaseTest />}

        {currentView === 'result' && selectedTrainer && (
          <AssignmentResults
            trainer={selectedTrainer}
            onReset={resetToForm}
          />
        )}

        {currentView === 'admin-login' && (
          <AdminLogin onLoginSuccess={handleAdminLogin} />
        )}

        {currentView === 'admin' && isAdminAuthenticated && (
          <AdminDashboard assignments={assignments} />
        )}

        {currentView === 'admin' && !isAdminAuthenticated && (
          <AdminLogin onLoginSuccess={handleAdminLogin} />
        )}

        {currentView === 'all-results' && (
          <div className="results-view">
            <h2>All Trainer Assignments</h2>

            {/* Loading state */}
            {!dataLoaded ? (
              <div className="loader"></div>
            ) : assignments.length > 0 ? (
              <div className="assignments-grid">
                {assignments.map((assignment, index) => (
                  <div key={index} className="assignment-card">
                    <h3>{assignment.name}</h3>
                    <p><strong>ID:</strong> {assignment.employeeId}</p>
                    <p><strong>Channel:</strong> {assignment.channel}</p>
                    <p><strong>Category:</strong> {assignment.category}</p>
                    <p><strong>Topic:</strong> {assignment.topic}</p>
                    <p><strong>Room:</strong> {assignment.room}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No assignments yet.</p>
            )}
          </div>
        )}

        {/* Debug Panel - Removed for production */}
      </main>
    </div>
  );
}

export default App;
