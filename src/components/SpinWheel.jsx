import React, { useState, useEffect, useMemo } from 'react';
import './SpinWheel.css';

const SpinWheel = ({ trainer, onSpinComplete }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [excitement, setExcitement] = useState(0);
  const [showCountdown, setShowCountdown] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [sparkles, setSparkles] = useState([]);
  const [anticipationText, setAnticipationText] = useState('Get ready for your assignment!');

  // Topic pools based on channel and category
  const TOPIC_POOLS = {
    banca_rookie: [
      'Customer Service Excellence', 'Banking Regulations', 'Digital Banking Fundamentals',
      'Sales Techniques', 'Risk Management Basics', 'Customer Onboarding Process',
      'Financial Literacy', 'Product Knowledge', 'Compliance Training', 'Communication Skills',
      'Branch Operations', 'KYC Procedures'
    ],
    banca_vintage: [
      'Advanced Banking Products', 'Market Analysis', 'Investment Advisory',
      'Regulatory Compliance', 'Leadership Skills', 'Strategic Planning',
      'Advanced Risk Assessment', 'Portfolio Management', 'Customer Retention',
      'Digital Transformation', 'Wealth Management', 'Corporate Banking'
    ],
    retail_rookie: [
      'Retail Sales Basics', 'Customer Interaction', 'POS Systems',
      'Inventory Management', 'Visual Merchandising', 'Cash Handling',
      'Product Presentation', 'Store Operations', 'Customer Complaints',
      'Team Collaboration', 'Loss Prevention', 'Store Safety'
    ],
    retail_vintage: [
      'Advanced Retail Strategies', 'Team Leadership', 'Profit Optimization',
      'Customer Analytics', 'Store Management', 'Supply Chain Basics',
      'Performance Metrics', 'Training & Development', 'Quality Assurance',
      'Innovation in Retail', 'Digital Commerce', 'Brand Management'
    ]
  };

  // Get topics for the current user
  const userTopics = useMemo(() => {
    const key = `${trainer.channel.toLowerCase()}_${trainer.category.toLowerCase()}`;
    return TOPIC_POOLS[key] || [];
  }, [trainer.channel, trainer.category]);

  // Calculate which topic should be "selected" based on actual assignment
  const selectedTopicIndex = useMemo(() => {
    return userTopics.findIndex(topic => topic === trainer.topic);
  }, [userTopics, trainer.topic]);

  const anticipationMessages = [
    `Scanning ${trainer.channel} topics...`,
    `Matching ${trainer.category} expertise...`,
    'Analyzing your profile...',
    'Finding perfect topic match...',
    'Almost there!'
  ];

  useEffect(() => {
    // Countdown before spin
    const countdownTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setShowCountdown(false);
          setTimeout(() => startSpin(), 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, []);

  // Generate sparkle effects
  const generateSparkles = () => {
    const newSparkles = [];
    for (let i = 0; i < 12; i++) {
      newSparkles.push({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 1 + Math.random() * 2
      });
    }
    setSparkles(newSparkles);
  };

  const startSpin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    generateSparkles();

    // Progressive excitement build-up
    const excitementInterval = setInterval(() => {
      setExcitement(prev => Math.min(prev + 1, 100));
    }, 40);

    // Change anticipation messages during spin
    const messageInterval = setInterval(() => {
      setAnticipationText(anticipationMessages[Math.floor(Math.random() * anticipationMessages.length)]);
    }, 800);

    // Calculate rotation to land on the assigned topic
    const segmentAngle = 360 / userTopics.length;
    const targetAngle = selectedTopicIndex * segmentAngle;

    // Add multiple full rotations for dramatic effect
    const fullRotations = 8 + Math.random() * 4; // 8-12 rotations
    const finalRotation = (fullRotations * 360) + (360 - targetAngle) - (segmentAngle / 2);

    setRotation(prev => prev + finalRotation);

    // Stop spinning with dramatic reveal
    setTimeout(() => {
      clearInterval(excitementInterval);
      clearInterval(messageInterval);
      setIsSpinning(false);
      setExcitement(100);
      setAnticipationText('Perfect Match Found!');

      setTimeout(() => {
        setShowResult(true);
        generateSparkles(); // Extra sparkles for result reveal

        setTimeout(() => {
          onSpinComplete();
        }, 3000);
      }, 1000);
    }, 5000);
  };

  return (
    <div className="spin-wheel-container">
      {/* Sparkle Effects */}
      <div className="sparkles-container">
        {sparkles.map(sparkle => (
          <div
            key={sparkle.id}
            className="sparkle"
            style={{
              left: `${sparkle.left}%`,
              top: `${sparkle.top}%`,
              animationDelay: `${sparkle.delay}s`,
              animationDuration: `${sparkle.duration}s`
            }}
          />
        ))}
      </div>

      {/* Countdown Overlay */}
      {showCountdown && (
        <div className="countdown-overlay">
          <div className="countdown-circle">
            <span className="countdown-number">{countdown}</span>
          </div>
          <p className="countdown-text">Preparing {trainer.channel} {trainer.category} topics...</p>
        </div>
      )}

      <div className="wheel-header">
        <h2>{trainer.channel} Topic Assignment</h2>
        <p>Welcome, <strong>{trainer.name}</strong>! Your {trainer.category} level topics await...</p>

        {/* Excitement Meter */}
        <div className="excitement-meter">
          <div className="meter-label">Assignment Progress</div>
          <div className="meter-bar">
            <div
              className="meter-fill"
              style={{ width: `${excitement}%` }}
            />
          </div>
          <div className="meter-percentage">{excitement}%</div>
        </div>
      </div>

      <div className="wheel-section">
        <div className="wheel-wrapper">
          {/* Glow effect when spinning */}
          <div className={`wheel-glow ${isSpinning ? 'active' : ''}`} />

          <div
            className={`wheel ${isSpinning ? 'spinning' : ''}`}
            style={{
              transform: `rotate(${rotation}deg)`,
              boxShadow: isSpinning ? '0 0 50px rgba(102, 126, 234, 0.8)' : '0 10px 30px rgba(0, 0, 0, 0.2)'
            }}
          >
            {userTopics.map((topic, index) => {
              const segmentAngle = 360 / userTopics.length;
              const isSelected = index === selectedTopicIndex;

              return (
                <div
                  key={index}
                  className={`wheel-segment ${isSelected ? 'selected-segment' : ''}`}
                  style={{
                    transform: `rotate(${segmentAngle * index}deg)`,
                    clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos(Math.PI * segmentAngle / 180)}% ${50 - 50 * Math.sin(Math.PI * segmentAngle / 180)}%)`
                  }}
                >
                  <span
                    className="segment-text"
                    style={{
                      transform: `translateX(-50%) rotate(${-segmentAngle * index + segmentAngle/2}deg)`,
                      fontSize: userTopics.length > 10 ? '0.7rem' : '0.8rem'
                    }}
                  >
                    {topic}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="wheel-pointer">
            <div className="pointer-glow" />
          </div>

          <div className="wheel-center">
            <div className={`center-circle ${isSpinning ? 'pulsing' : ''}`}>
              {isSpinning ? (
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              ) : (
                <div className="center-content">
                  <span className="success-icon">✓</span>
                  <div className="center-text">{trainer.channel}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="assignment-details">
        <div className="detail-card">
          <h3>Your Profile</h3>
          <div className="profile-item">
            <span className="profile-icon">🆔</span>
            <span><strong>Employee ID:</strong> {trainer.employeeId}</span>
          </div>
          <div className="profile-item">
            <span className="profile-icon">🏢</span>
            <span><strong>Channel:</strong> {trainer.channel}</span>
          </div>
          <div className="profile-item">
            <span className="profile-icon">⭐</span>
            <span><strong>Category:</strong> {trainer.category}</span>
          </div>
          <div className="profile-item">
            <span className="profile-icon">🏠</span>
            <span><strong>Room:</strong> Room {trainer.room}</span>
          </div>
          <div className="available-topics">
            <strong>Available Topics: {userTopics.length}</strong>
          </div>
        </div>

        {showResult && (
          <div className="result-card animate-in">
            <div className="success-header">
              <h3>Perfect Match Found!</h3>
              <div className="achievement-badge">
                <span>{trainer.channel} Expert Assignment</span>
              </div>
            </div>

            <div className="assignment-result">
              <div className="result-item topic-reveal">
                <span className="result-label">Your Assigned Topic:</span>
                <div className="result-value topic">
                  <span className="topic-icon">📚</span>
                  {trainer.topic}
                  <span className="topic-icon">📚</span>
                </div>
              </div>

              <div className="celebration-message">
                <p>Perfect match for your {trainer.category} level in {trainer.channel}!</p>
                <div className="confidence-score">
                  <span>Topic Match Score: </span>
                  <span className="score">100%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Message with Animation */}
      <div className="status-message">
        <p className={`spinning-text ${isSpinning ? 'active' : ''}`}>
          {anticipationText}
        </p>
        {isSpinning && (
          <div className="progress-dots">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpinWheel;
