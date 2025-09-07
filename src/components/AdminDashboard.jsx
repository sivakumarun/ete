import React, { useState, useMemo } from 'react';
import { CSVLink } from 'react-csv';
import './AdminDashboard.css';

const AdminDashboard = ({ assignments = [] }) => {
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterRoom, setFilterRoom] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Debug logging
  console.log('AdminDashboard rendered with assignments:', assignments);

  // Statistics calculations
  const statistics = useMemo(() => {
    const stats = {
      total: assignments.length,
      byChannel: { Banca: 0, Retail: 0 },
      byCategory: { Rookie: 0, Vintage: 0 },
      byRoom: { 1: 0, 2: 0, 3: 0 },
      uniqueTopics: new Set(),
      topicDistribution: {}
    };

    assignments.forEach(assignment => {
      // Channel stats
      if (assignment.channel && stats.byChannel[assignment.channel] !== undefined) {
        stats.byChannel[assignment.channel]++;
      }

      // Category stats
      if (assignment.category && stats.byCategory[assignment.category] !== undefined) {
        stats.byCategory[assignment.category]++;
      }

      // Room stats
      if (assignment.room && stats.byRoom[assignment.room] !== undefined) {
        stats.byRoom[assignment.room]++;
      }

      // Topic stats
      if (assignment.topic) {
        stats.uniqueTopics.add(assignment.topic);
        stats.topicDistribution[assignment.topic] =
          (stats.topicDistribution[assignment.topic] || 0) + 1;
      }
    });

    return stats;
  }, [assignments]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    if (!Array.isArray(assignments)) return [];

    return assignments.filter(assignment => {
      const matchesChannel = filterChannel === 'all' || assignment.channel === filterChannel;
      const matchesCategory = filterCategory === 'all' || assignment.category === filterCategory;
      const matchesRoom = filterRoom === 'all' || assignment.room?.toString() === filterRoom;
      const matchesSearch = !searchTerm ||
        assignment.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.employeeId?.includes(searchTerm) ||
        assignment.topic?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesChannel && matchesCategory && matchesRoom && matchesSearch;
    });
  }, [assignments, filterChannel, filterCategory, filterRoom, searchTerm]);

  // CSV data preparation
  const csvData = useMemo(() => {
    return filteredAssignments.map(assignment => ({
      'Employee ID': assignment.employeeId || '',
      'Name': assignment.name || '',
      'Channel': assignment.channel || '',
      'Category': assignment.category || '',
      'Topic': assignment.topic || '',
      'Room': assignment.room ? `Room ${assignment.room}` : '',
      'Assigned At': assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleString() : ''
    }));
  }, [filteredAssignments]);

  const csvHeaders = [
    { label: 'Employee ID', key: 'Employee ID' },
    { label: 'Name', key: 'Name' },
    { label: 'Channel', key: 'Channel' },
    { label: 'Category', key: 'Category' },
    { label: 'Topic', key: 'Topic' },
    { label: 'Room', key: 'Room' },
    { label: 'Assigned At', key: 'Assigned At' }
  ];

  const generateFileName = () => {
    const date = new Date().toISOString().split('T')[0];
    return `trainer-assignments-${date}.csv`;
  };

  const handleDeleteAssignment = async (assignment) => {
    try {
      // Corrected import path
      const { deleteDoc, doc, db } = await import('../googleSheets');
      await deleteDoc(doc(db, 'assignments', assignment.id));
      setSelectedAssignment(null);
      setShowDeleteConfirm(false);
      alert('Assignment deleted successfully.');
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert('Error deleting assignment. Please try again.');
    }
  };

  const handleClearAllData = async () => {
    try {
      // Corrected import path
      const { clearAllAssignments } = await import('../googleSheets');
      await clearAllAssignments();
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Error clearing data. Please try again.');
    }
  };

  const openDeleteConfirm = (assignment) => {
    setSelectedAssignment(assignment);
    setShowDeleteConfirm(true);
  };

  const openClearConfirm = () => {
    setShowClearConfirm(true);
  };

  // Early return with loading state if needed
  if (!assignments) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <h2>Admin Dashboard</h2>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <p>Manage and monitor trainer topic assignments</p>
      </div>

      {/* Statistics Section */}
      <div className="statistics-section">
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-number">{statistics.total}</div>
            <div className="stat-label">Total Assignments</div>
          </div>

          <div className="stat-card topics">
            <div className="stat-number">{statistics.uniqueTopics.size}</div>
            <div className="stat-label">Unique Topics Used</div>
          </div>

          <div className="stat-card channel">
            <div className="stat-breakdown">
              <div>Banca: {statistics.byChannel.Banca}</div>
              <div>Retail: {statistics.byChannel.Retail}</div>
            </div>
            <div className="stat-label">By Channel</div>
          </div>

          <div className="stat-card category">
            <div className="stat-breakdown">
              <div>Rookie: {statistics.byCategory.Rookie}</div>
              <div>Vintage: {statistics.byCategory.Vintage}</div>
            </div>
            <div className="stat-label">By Category</div>
          </div>

          <div className="stat-card rooms">
            <div className="stat-breakdown">
              <div>Room 1: {statistics.byRoom[1]}</div>
              <div>Room 2: {statistics.byRoom[2]}</div>
              <div>Room 3: {statistics.byRoom[3]}</div>
            </div>
            <div className="stat-label">By Room</div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="controls-section">
        <div className="filters">
          <div className="filter-group">
            <label>Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, ID, or topic..."
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <label>Channel:</label>
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Channels</option>
              <option value="Banca">Banca</option>
              <option value="Retail">Retail</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Category:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              <option value="Rookie">Rookie</option>
              <option value="Vintage">Vintage</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Room:</label>
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Rooms</option>
              <option value="1">Room 1</option>
              <option value="2">Room 2</option>
              <option value="3">Room 3</option>
            </select>
          </div>
        </div>

        <div className="actions">
          <CSVLink
            data={csvData}
            headers={csvHeaders}
            filename={generateFileName()}
            className="export-btn"
          >
            Export to Excel
          </CSVLink>

          <button
            className="refresh-btn"
            onClick={() => window.location.reload()}
          >
            Refresh Data
          </button>

          <button
            className="clear-all-btn"
            onClick={openClearConfirm}
            disabled={assignments.length === 0}
          >
            Clear All Data
          </button>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="assignments-section">
        <div className="section-header">
          <h3>Trainer Assignments ({filteredAssignments.length})</h3>
        </div>

        <div className="table-container">
          <table className="assignments-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Channel</th>
                <th>Category</th>
                <th>Topic</th>
                <th>Room</th>
                <th>Assigned At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.length > 0 ? (
                filteredAssignments.map((assignment, index) => (
                  <tr key={assignment.id || index}>
                    <td className="employee-id">{assignment.employeeId}</td>
                    <td className="trainer-name">{assignment.name}</td>
                    <td>
                      <span className={`channel-badge ${assignment.channel?.toLowerCase()}`}>
                        {assignment.channel}
                      </span>
                    </td>
                    <td>
                      <span className={`category-badge ${assignment.category?.toLowerCase()}`}>
                        {assignment.category}
                      </span>
                    </td>
                    <td className="topic-cell">{assignment.topic}</td>
                    <td className="room-cell">
                      <span style={{color: '#667eea', fontWeight: 'bold'}}>Room {assignment.room}</span>
                    </td>
                    <td className="date-cell">
                      {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleDateString() : 'N/A'} <br />
                      <small>{assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleTimeString() : ''}</small>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="delete-btn"
                        onClick={() => openDeleteConfirm(assignment)}
                        title="Delete Assignment"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-data">
                    {assignments.length === 0
                      ? "No assignments have been created yet. Start by creating some trainer assignments."
                      : "No assignments found matching the current filters."
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Topic Distribution - Only show if there are assignments */}
      {assignments.length > 0 && (
        <div className="topic-distribution-section">
          <h3>Topic Usage Distribution</h3>
          <div className="topics-grid">
            {Object.entries(statistics.topicDistribution)
              .sort((a, b) => b[1] - a[1])
              .map(([topic, count]) => (
                <div key={topic} className="topic-usage-card">
                  <div className="topic-name">{topic}</div>
                  <div className="usage-count">Used {count} time{count !== 1 ? 's' : ''}</div>
                  <div className="usage-bar">
                    <div
                      className="usage-fill"
                      style={{ width: `${(count / Math.max(...Object.values(statistics.topicDistribution))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedAssignment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Assignment</h3>
            <p>Are you sure you want to delete the assignment for:</p>
            <div className="assignment-preview">
              <strong>{selectedAssignment.name}</strong> (ID: {selectedAssignment.employeeId})
              <br />
              Topic: {selectedAssignment.topic}
              <br />
              Room: {selectedAssignment.room}
            </div>
            <p className="warning-text">This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-delete-btn"
                onClick={() => handleDeleteAssignment(selectedAssignment)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Clear All Assignment Data</h3>
            <p>Are you sure you want to delete ALL assignment data?</p>
            <div className="warning-box">
              <strong>⚠️ WARNING:</strong>
              <ul>
                <li>This will permanently delete all {assignments.length} assignments</li>
                <li>All trainer data will be lost</li>
                <li>This action cannot be undone</li>
                <li>The application will reset to initial state</li>
              </ul>
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-clear-btn"
                onClick={handleClearAllData}
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
