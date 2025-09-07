import React from 'react';
import './AssignmentResults.css';

const AssignmentResults = ({ trainer, onReset }) => {
  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="assignment-results-container">
      <div className="results-card">
        <div className="results-header">
          <div className="success-icon">
            <div className="checkmark">✓</div>
          </div>
          <h2>Assignment Successful!</h2>
          <p className="success-message">
            Your topic has been assigned successfully. Please note down your details below.
          </p>
        </div>

        <div className="assignment-details-grid">
          <div className="detail-section">
            <h3>Personal Information</h3>
            <div className="detail-row">
              <span className="label">Employee ID:</span>
              <span className="value">{trainer.employeeId}</span>
            </div>
            <div className="detail-row">
              <span className="label">Name:</span>
              <span className="value">{trainer.name}</span>
            </div>
            <div className="detail-row">
              <span className="label">Channel:</span>
              <span className="value channel-badge">{trainer.channel}</span>
            </div>
            <div className="detail-row">
              <span className="label">Category:</span>
              <span className="value category-badge">{trainer.category}</span>
            </div>
          </div>

          <div className="detail-section assignment-section">
            <h3>Your Assignment</h3>
            <div className="topic-display">
              <span className="topic-label">Topic:</span>
              <div className="topic-value">{trainer.topic}</div>
            </div>
            <div className="room-display">
              <span className="room-label">Room:</span>
              <div className="room-value">Room {trainer.room}</div>
            </div>
          </div>
        </div>

        <div className="assignment-metadata">
          <div className="metadata-item">
            <span className="metadata-label">Assigned At:</span>
            <span className="metadata-value">{formatDate(trainer.assignedAt)}</span>
          </div>
        </div>

        <div className="important-notes">
          <h4>Important Instructions:</h4>
          <ul>
            <li>Please arrive at your assigned room 15 minutes before the session</li>
            <li>Bring necessary materials for your topic presentation</li>
            <li>Your assignment is final and cannot be changed</li>
            <li>Contact the administrator if you have any questions</li>
          </ul>
        </div>

        <div className="action-buttons">
          <button
            className="print-btn"
            onClick={handlePrint}
            type="button"
          >
            Print Assignment
          </button>
          <button
            className="new-assignment-btn"
            onClick={onReset}
            type="button"
          >
            New Assignment
          </button>
        </div>

        <div className="qr-section">
          <div className="qr-placeholder">
            <div className="qr-code">
              <div className="qr-pattern"></div>
            </div>
            <p>Scan to view assignment details</p>
          </div>
        </div>
      </div>

      <div className="print-only assignment-ticket">
        <div className="ticket-header">
          <h2>Trainer Assignment Ticket</h2>
          <div className="ticket-id">#{trainer.employeeId}</div>
        </div>

        <div className="ticket-content">
          <div className="ticket-row">
            <strong>Name:</strong> {trainer.name}
          </div>
          <div className="ticket-row">
            <strong>Employee ID:</strong> {trainer.employeeId}
          </div>
          <div className="ticket-row">
            <strong>Channel:</strong> {trainer.channel}
          </div>
          <div className="ticket-row">
            <strong>Category:</strong> {trainer.category}
          </div>
          <div className="ticket-divider"></div>
          <div className="ticket-assignment">
            <div className="ticket-topic">
              <strong>Topic:</strong> {trainer.topic}
            </div>
            <div className="ticket-room">
              <strong>Room:</strong> Room {trainer.room}
            </div>
          </div>
          <div className="ticket-footer">
            <small>Assigned: {formatDate(trainer.assignedAt)}</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentResults;
