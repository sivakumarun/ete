import React, { useState, useEffect, useMemo, useRef } from 'react';
import './SpinWheel.css';

const SpinWheel = ({ trainer, onSpinComplete, existingAssignments = [] }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [rotation, setRotation] = useState(0); // used for the final/actual spin
  const [idleRotation, setIdleRotation] = useState(0); // slow idle rotation
  const idleRotationRef = useRef(0);
  const [hasSpun, setHasSpun] = useState(false);
  const [assignedTopic, setAssignedTopic] = useState('');

  // Topic pools
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

  // Filter topics based on trainer and existing assignments
  const userTopics = useMemo(() => {
    if (!trainer || !trainer.channel || !trainer.category) return [];
    const topicKey = `${trainer.channel.toLowerCase()}_${trainer.category.toLowerCase()}`;
    const allTopics = TOPIC_POOLS[topicKey] || [];
    const assignedTopicsInRoom = existingAssignments
      .filter(a => a.room === trainer.room)
      .map(a => a.topic);
    return allTopics.filter(t => !assignedTopicsInRoom.includes(t));
  }, [trainer, existingAssignments]);

  const selectedTopicIndex = useMemo(() => {
    if (trainer && trainer.topic) {
      return userTopics.findIndex(t => t === trainer.topic);
    }
    return -1;
  }, [userTopics, trainer]);

  // Idle rotation: small slow movement while not spinning and not yet assigned
  useEffect(() => {
    let interval = null;
    if (!isSpinning && !hasSpun) {
      interval = setInterval(() => {
        setIdleRotation(prev => {
          const next = (prev + 0.2) % 360; // very slow
          idleRotationRef.current = next;
          return next;
        });
      }, 30);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSpinning, hasSpun]);

  // Start spin only when user clicks
  const startSpin = () => {
    if (isSpinning || hasSpun) return;
    if (selectedTopicIndex === -1) return; // nothing to spin for

    const segmentAngle = 360 / userTopics.length;
    const targetAngle = selectedTopicIndex * segmentAngle;
    // big spin (7200 = 20 full rotations) + correct offset so chosen segment aligns under the pointer
    const spinDegrees = 7200 + (360 - targetAngle) + (segmentAngle / 2);

    // Start from the current displayed angle (idleRotationRef)
    const startFrom = idleRotationRef.current || idleRotation;
    const finalRotation = startFrom + spinDegrees;

    setIsSpinning(true);
    setHasSpun(true);
    setAssignedTopic(userTopics[selectedTopicIndex]);
    // set rotation to the large final value - CSS transition will animate it
    setRotation(finalRotation);

    // Wait for the duration of the CSS spin (9s) + small buffer
    const spinDuration = 6500;
    setTimeout(() => {
      setIsSpinning(false);
      setShowModal(true);
    }, spinDuration);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    onSpinComplete?.();
  };

  // visual props
  const buttonClass = `spin-button-center ${isSpinning ? 'spinning-glow' : ''} ${isSpinning || hasSpun || selectedTopicIndex === -1 ? 'disabled' : ''}`;
  const wheelFilter = isSpinning ? 'drop-shadow(0 0 20px rgba(102, 126, 234, 0.5))' : 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2))';

  // compute transform: use rotation if spinning/hasSpun, otherwise show idleRotation
  const displayedRotation = (isSpinning || hasSpun) ? rotation : idleRotation;
  const transitionStyle = isSpinning ? 'transform 9s cubic-bezier(0.23, 1, 0.32, 1)' : 'transform 0.2s linear';

  if (!trainer) {
    return null;
  }

  return (
    <div className="spin-wheel-container">
      <div className="wheel-header">
        <h1 className="header-title">Training Topic Spin Wheel</h1>
      </div>

      <div className="wheel-wrapper">
        <div className="wheel-svg-container">
          {/* pointer is inside the same relatively-positioned container for consistent alignment */}
          <div className="triangle-pointer" />

          <svg
            width="100%"
            height="100%"
            viewBox="0 0 400 400"
            className="spin-wheel-svg"
            style={{
              transform: `rotate(${displayedRotation}deg)`,
              filter: wheelFilter,
              transition: transitionStyle,
            }}
          >
            <circle cx="200" cy="200" r="196" fill="none" stroke="#333" strokeWidth="8" />
            {userTopics.map((topic, index) => {
              const segmentAngle = 360 / userTopics.length;
              const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
              const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);

              const x1 = 200 + 188 * Math.cos(startAngle);
              const y1 = 200 + 188 * Math.sin(startAngle);
              const x2 = 200 + 188 * Math.cos(endAngle);
              const y2 = 200 + 188 * Math.sin(endAngle);

              const largeArcFlag = segmentAngle > 180 ? 1 : 0;

              const pathData = [
                `M 200 200`,
                `L ${x1} ${y1}`,
                `A 188 188 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');

              const middleAngle = startAngle + (segmentAngle * Math.PI / 360);
              const textRadius = 130;
              const textX = 200 + textRadius * Math.cos(middleAngle);
              const textY = 200 + textRadius * Math.sin(middleAngle);
              const textRotation = (index * segmentAngle + segmentAngle / 2) + 90;

              const baseFontSize = userTopics.length > 12 ? 10 : userTopics.length > 8 ? 11 : 12;

              return (
                <g key={index}>
                  <path d={pathData} fill={segmentColors[index % segmentColors.length]} stroke="white" strokeWidth="2" />
                  <text
                    x={textX}
                    y={textY}
                    fill="white"
                    fontSize={baseFontSize}
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${textRotation} ${textX} ${textY})`}
                    className="segment-text"
                  >
                    {topic.length > 15 ? (
                      <>
                        <tspan x={textX} dy="-6">{topic.substring(0, 15)}</tspan>
                        <tspan x={textX} dy="12">{topic.substring(15)}</tspan>
                      </>
                    ) : (
                      <tspan x={textX}>{topic}</tspan>
                    )}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Center circular SPIN button */}
          <button
            onClick={startSpin}
            disabled={isSpinning || hasSpun || selectedTopicIndex === -1}
            className={buttonClass}
            aria-label="Spin the wheel"
          >
            SPIN
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Here is your Topic, All the Best..!</h3>
            <div className="modal-topic-box">
              <p className="modal-topic-name">{assignedTopic}</p>
            </div>
            <div className="modal-buttons">
              <button onClick={handleCloseModal} className="modal-close-button">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// segmentColors placed after the component to keep the top cleaner (same palette you used)
const segmentColors = [
  '#ED1C24', '#00A99D', '#FDB913', '#2E3192', '#8CC63E', '#93278F',
  '#ED1C24', '#00A99D', '#FDB913', '#2E3192', '#8CC63E', '#93278F',
  '#ED1C24', '#00A99D', '#FDB913', '#2E3192', '#8CC63E', '#93278F',
  '#ED1C24', '#00A99D', '#FDB913', '#2E3192', '#8CC63E'
];

export default SpinWheel;