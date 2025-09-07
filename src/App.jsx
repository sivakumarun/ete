import React, { useState, useEffect } from 'react';
import TrainerForm from './components/TrainerForm';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import AssignmentResults from './components/AssignmentResults';
import SpinWheel from './components/SpinWheel';
import Navigation from './components/Navigation';
import SupabaseTest from './components/SupabaseTest';
// This line has been updated to import from the new Google Sheets wrapper
import { db, collection, getDocs, addDoc, query, where, onSnapshot } from './googleSheets';
import './App.css';

// Topic pools for different categories
const TOPIC_POOLS = {
  banca_rookie: [
    'Customer Service Excellence', 'Banking Regulations', 'Digital Banking Fundamentals',
    'Sales Techniques', 'Risk Management Basics', 'Customer Onboarding Process',
    'Financial Literacy', 'Product Knowledge', 'Compliance Training', 'Communication Skills'
  ],
  banca_vintage: [
    'Advanced Banking Products', 'Market Analysis', 'Investment Advisory',
    'Regulatory Compliance', 'Leadership Skills', 'Strategic Planning',
    'Advanced Risk Assessment', 'Portfolio Management', 'Customer Retention',
    'Digital Transformation'
  ],
  retail_rookie: [
    'Retail Sales Basics', 'Customer Interaction', 'POS Systems',
    'Inventory Management', 'Visual Merchandising', 'Cash Handling',
    'Product Presentation', 'Store Operations', 'Customer Complaints',
    'Team Collaboration'
  ],
  retail_vintage: [
    'Advanced Retail Strategies', 'Team Leadership', 'Profit Optimization',
    'Customer Analytics', 'Store Management', 'Supply Chain Basics',
    'Performance Metrics', 'Training & Development', 'Quality Assurance',
    'Innovation in Retail'
  ]
};

function App() {
  const [currentView, setCurrentView] = useState('form');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

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
    const unsubscribe = onSnapshot(collection(db, 'assignments'), (snapshot) => {
      const assignmentData = [];
      snapshot.forEach((doc) => {
        assignmentData.push({ id: doc.id, ...doc.data() });
      });
      setAssignments(assignmentData);
      console.log('Assignments loaded:', assignmentData);
    });

    return () => unsubscribe();
  }, []);

  const checkExistingAssignment = async (employeeId) => {
    const existingAssignment = assignments.find(
      assignment => assignment.employeeId === employeeId
    );
    return existingAssignment || null;
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
    setLoading(true);

    try {
      // Check if trainer already has assignment
      const existing = await checkExistingAssignment(trainerData.employeeId);
      if (existing) {
        setSelectedTrainer(existing);
        setCurrentView('result');
        setLoading(false);
        return;
      }

      // Use the selected room from form data
      const roomNumber = parseInt(trainerData.room);

      // Get available topics for this room and category
      const availableTopics = getAvailableTopics(
        trainerData.channel,
        trainerData.category,
        roomNumber
      );

      if (availableTopics.length === 0) {
        alert(`All topics have been assigned for ${trainerData.channel} ${trainerData.category} in Room ${roomNumber}! Please select a different room or contact the administrator.`);
        setLoading(false);
        return;
      }

      // Randomly select topic from available topics
      const randomTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];

      const assignment = {
        ...trainerData,
        topic: randomTopic,
        room: roomNumber,
        assignedAt: new Date().toISOString()
      };

      // Save to Google Sheets
      await addDoc(collection(db, 'assignments'), assignment);

      setSelectedTrainer(assignment);
      setCurrentView('spin');
    } catch (error) {
      console.error('Error assigning topic:', error);
      alert('Error occurred while assigning topic. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSpinComplete = () => {
    setCurrentView('result');
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
        <h1>Trainer Topic Assignment System</h1>
        <Navigation
          currentView={currentView}
          setCurrentView={setCurrentView}
          onAdminAccess={handleAdminAccess}
          isAdminAuthenticated={isAdminAuthenticated}
          onAdminLogout={handleAdminLogout}
        />
      </header>

      <main className="app-main">
        {currentView === 'form' && (
          <TrainerForm onSubmit={assignTopic} loading={loading} />
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
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
