// src/components/ScamQuiz.jsx
import React, { useState } from 'react';
import { FiPlay, FiAward, FiCheckCircle, FiXCircle, FiChevronRight, FiShield } from 'react-icons/fi';
import styles from './ScamQuiz.module.css';

export default function ScamQuiz() {
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'result'
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Gamified Quiz Data
  const questions = [
    {
      type: "sms",
      scenario: "You receive a WhatsApp message from an unknown number: 'HR Dept: Your profile is shortlisted for a part-time job. Earn ₹5,000 daily. Click here to register: http://job-portal-vip.com'",
      options: [
        "Click the link to see if the job is real.",
        "Reply asking for the company name.",
        "Block and report the number immediately."
      ],
      correctAnswer: 2,
      explanation: "This is a classic 'Task Scam'. Scammers lure you with high daily returns for easy work, eventually asking you to pay a 'registration fee' or stealing your banking details via the fake link."
    },
    {
      type: "call",
      scenario: "You get a call from someone claiming to be from the CBI. They say your Aadhaar card was found in a money laundering bust and demand you stay on a Skype video call.",
      options: [
        "Stay on the call to prove your innocence.",
        "Hang up and dial 1930 to report the threat.",
        "Pay the 'security deposit' they ask for to avoid arrest."
      ],
      correctAnswer: 1,
      explanation: "This is a 'Digital Arrest' scam. Real law enforcement will never interrogate you over Skype or ask for money to clear your name. Hang up immediately and report it."
    },
    {
      type: "email",
      scenario: "An email from 'Netflix Support' says your account is suspended. The email address is 'support-team@netflix-billing-update.info'.",
      options: [
        "Click the link and update your credit card.",
        "Ignore the email, it's clearly a phishing attempt.",
        "Forward the email to your friends to warn them."
      ],
      correctAnswer: 1,
      explanation: "Always check the sender's email address! Official companies use their primary domain (e.g., @netflix.com). Complex domains like 'netflix-billing-update.info' are always phishing attempts."
    }
  ];

  const handleStart = () => {
    setGameState('playing');
    setCurrentQuestion(0);
    setScore(0);
    setSelectedOption(null);
    setShowExplanation(false);
  };

  const handleSelectOption = (index) => {
    if (showExplanation) return; // Prevent changing answer after submission
    setSelectedOption(index);
    setShowExplanation(true);
    
    if (index === questions[currentQuestion].correctAnswer) {
      setScore(score + 100);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setGameState('result');
    }
  };

  return (
    <div className={styles.container}>
      
      <div className={styles.header}>
        <h2 className={styles.title}>ScamSpotter Academy</h2>
        <p className={styles.subtitle}>Train your brain to detect manipulation tactics and cyber fraud.</p>
      </div>

      <div className={styles.gameArea}>
        
        {/* --- START SCREEN --- */}
        {gameState === 'start' && (
          <div className={styles.startScreen}>
            <div className={styles.shieldWrapper}>
              <FiShield className={styles.heroIcon} />
            </div>
            <h3>Daily ScamSpotter Challenge</h3>
            <p>Can you identify the latest phishing links, digital arrests, and OTP frauds? Test your reflexes and earn points!</p>
            <button className={styles.primaryBtn} onClick={handleStart}>
              <FiPlay /> Start Challenge
            </button>
          </div>
        )}

        {/* --- PLAYING SCREEN --- */}
        {gameState === 'playing' && (
          <div className={styles.quizScreen}>
            
            <div className={styles.progressHeader}>
              <span className={styles.questionCounter}>Question {currentQuestion + 1} of {questions.length}</span>
              <span className={styles.scoreCounter}>Score: {score}</span>
            </div>
            
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${((currentQuestion) / questions.length) * 100}%` }}
              ></div>
            </div>

            <div className={styles.scenarioCard}>
              <div className={styles.scenarioType}>
                {questions[currentQuestion].type.toUpperCase()} SCENARIO
              </div>
              <p className={styles.scenarioText}>{questions[currentQuestion].scenario}</p>
            </div>

            <div className={styles.optionsList}>
              {questions[currentQuestion].options.map((option, index) => {
                let optionStyle = styles.optionBtn;
                if (showExplanation) {
                  if (index === questions[currentQuestion].correctAnswer) {
                    optionStyle = `${styles.optionBtn} ${styles.correctOption}`;
                  } else if (index === selectedOption) {
                    optionStyle = `${styles.optionBtn} ${styles.wrongOption}`;
                  } else {
                    optionStyle = `${styles.optionBtn} ${styles.disabledOption}`;
                  }
                } else if (index === selectedOption) {
                  optionStyle = `${styles.optionBtn} ${styles.selectedOption}`;
                }

                return (
                  <button 
                    key={index} 
                    className={optionStyle}
                    onClick={() => handleSelectOption(index)}
                    disabled={showExplanation}
                  >
                    <span className={styles.optionLetter}>{String.fromCharCode(65 + index)}</span>
                    <span className={styles.optionText}>{option}</span>
                    {showExplanation && index === questions[currentQuestion].correctAnswer && <FiCheckCircle className={styles.feedbackIcon} />}
                    {showExplanation && index === selectedOption && index !== questions[currentQuestion].correctAnswer && <FiXCircle className={styles.feedbackIcon} />}
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <div className={`${styles.explanationBox} ${selectedOption === questions[currentQuestion].correctAnswer ? styles.expCorrect : styles.expWrong}`}>
                <h4>{selectedOption === questions[currentQuestion].correctAnswer ? "Correct! +100 Points" : "Watch Out!"}</h4>
                <p>{questions[currentQuestion].explanation}</p>
                <button className={styles.nextBtn} onClick={handleNext}>
                  {currentQuestion < questions.length - 1 ? "Next Question" : "See Final Score"} <FiChevronRight />
                </button>
              </div>
            )}

          </div>
        )}

        {/* --- RESULT SCREEN --- */}
        {gameState === 'result' && (
          <div className={styles.resultScreen}>
            <FiAward className={styles.awardIcon} />
            <h3>Challenge Complete!</h3>
            <div className={styles.finalScoreBox}>
              <span className={styles.scoreLabel}>Total Score</span>
              <span className={styles.scoreValue}>{score}</span>
            </div>
            
            <p className={styles.resultMessage}>
              {score === 300 ? "Flawless! You are a master at spotting scams." : 
               score >= 100 ? "Good effort! But scammers are tricky. Keep training." : 
               "You are at high risk! Please review the Recovery Hub to secure your accounts."}
            </p>

            <button className={styles.primaryBtn} onClick={handleStart}>
              Play Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}