import React, { useState } from 'react';
import './TrainerForm.css';

const TrainerForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    channel: '',
    category: '',
    room: ''
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Employee ID: must be exactly 9 digits and contain only numbers, no spaces
    if (!formData.employeeId) {
      newErrors.employeeId = 'Employee ID is required';
    } else if (!/^\d{9}$/.test(formData.employeeId)) {
      newErrors.employeeId = 'Employee ID must be exactly 9 digits';
    }

    // Name: must contain only letters and spaces
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name.trim())) {
      newErrors.name = 'Name must contain only letters and spaces';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }

    // Channel: must be selected
    if (!formData.channel) {
      newErrors.channel = 'Channel selection is required';
    }

    // Category: must be selected
    if (!formData.category) {
      newErrors.category = 'Category selection is required';
    }

    // Room: must be selected
    if (!formData.room) {
      newErrors.room = 'Room selection is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submission attempted with data:', formData);

    if (validateForm()) {
      console.log('Validation check result: true');
      onSubmit(formData);
    } else {
      console.log('Validation check result: false', errors);
    }
  };

  return (
    <div className="trainer-form-container">
      <div className="form-card">
        <div className="form-header">
          <h2>Trainer Registration</h2>
          <p>Enter your details to get topic</p>
        </div>

        <form onSubmit={handleSubmit} className="trainer-form">
          <div className="form-group">
            <label htmlFor="employeeId" className="form-label">
              Employee ID <span className="required">*</span>
            </label>
            <input
              type="text"
              id="employeeId"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              className={`form-input ${errors.employeeId ? 'error' : ''}`}
              placeholder="Enter your Employee ID"
              disabled={loading}
              maxLength="9"
            />
            {errors.employeeId && (
              <span className="error-message">{errors.employeeId}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Enter your full name"
              disabled={loading}
            />
            {errors.name && (
              <span className="error-message">{errors.name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="channel" className="form-label">
              Channel <span className="required">*</span>
            </label>
            <select
              id="channel"
              name="channel"
              value={formData.channel}
              onChange={handleChange}
              className={`form-select ${errors.channel ? 'error' : ''}`}
              disabled={loading}
            >
              <option value="">Select Channel</option>
              <option value="Banca">Banca</option>
              <option value="Retail">Retail</option>
            </select>
            {errors.channel && (
              <span className="error-message">{errors.channel}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="category" className="form-label">
              Category <span className="required">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`form-select ${errors.category ? 'error' : ''}`}
              disabled={loading}
            >
              <option value="">Select Category</option>
              <option value="Rookie">Rookie</option>
              <option value="Vintage">Vintage</option>
            </select>
            {errors.category && (
              <span className="error-message">{errors.category}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="room" className="form-label">
              Room <span className="required">*</span>
            </label>
            <select
              id="room"
              name="room"
              value={formData.room}
              onChange={handleChange}
              className={`form-select ${errors.room ? 'error' : ''}`}
              disabled={loading}
            >
              <option value="">Select Room</option>
              <option value="1">Room 1</option>
              <option value="2">Room 2</option>
              <option value="3">Room 3</option>
            </select>
            {errors.room && (
              <span className="error-message">{errors.room}</span>
            )}
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-spinner">
                <span className="spinner"></span>
                Processing...
              </span>
            ) : (
              'Get My Topic'
            )}
          </button>
        </form>

        <div className="form-footer">
          <p className="help-text">
            Make sure to enter correct details. Once assigned, you cannot change your topic.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrainerForm;