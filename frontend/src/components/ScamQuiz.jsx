// src/components/ScamQuiz.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios'; // 🌟 1. Import Axios
import { FiPlay, FiAward, FiCheckCircle, FiXCircle, FiChevronRight, FiShield, FiLoader } from 'react-icons/fi';
import styles from './ScamQuiz.module.css';

export default function ScamQuiz() {
  const [gameState, setGameState] = useState('start'); // 'start', 'playing', 'result'
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // 🌟 2. New State for API Data
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🌟 3. Fetch Questions Function
  const fetchQuizData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await axios.get('http://localhost:4000/api/quiz/generate', {
        withCredentials: true // CRITICAL: Ensure the user is logged in
      });
      
      setQuestions(response.data);
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to load quiz:", err);
      setError("Failed to generate the training module. Please check your connection.");
      setIsLoading(false);
    }
  };

  // 🌟 4. Fetch exactly once when the component mounts
  useEffect(() => {
    fetchQuizData();
  }, []);

  const handleStart = () => {
    setGameState('playing');
    setCurrentQuestion(0);
    setScore(0);
    setSelectedOption(null);
    setShowExplanation(false);
  };

  const handleSelectOption = (index) => {
    if (showExplanation) return; 
    setSelectedOption(index);
    setShowExplanation(true);
    
    // We assume the AI correctly maps the answer to 0, 1, or 2
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

  // 🌟 5. Play Again triggers a brand new AI generation!
  const handlePlayAgain = () => {
    setGameState('start');
    fetchQuizData(); // Fetch 10 completely new questions
  };

  return (
    <div className={styles.container}>
      
      <div className={styles.header}>
        <h2 className={styles.title}>ScamSpotter Academy</h2>
        <p className={styles.subtitle}>Train your brain to detect manipulation tactics and cyber fraud.</p>
      </div>

      <div className={styles.gameArea}>
        
        {/* --- LOADING SCREEN --- */}
        {isLoading && (
          <div className={styles.startScreen} style={{ padding: '4rem 2rem' }}>
            <FiLoader className={styles.heroIcon} style={{ animation: 'spin 2s linear infinite' }} />
            <h3>Generating Threat Simulation...</h3>
            <p>Our AI is analyzing the latest global cyber threats to build your personalized quiz.</p>
          </div>
        )}

        {/* --- ERROR SCREEN --- */}
        {error && !isLoading && (
          <div className={styles.startScreen}>
            <FiXCircle className={styles.heroIcon} style={{ color: '#ef4444' }} />
            <h3>Connection Error</h3>
            <p>{error}</p>
            <button className={styles.primaryBtn} onClick={fetchQuizData}>
              Try Again
            </button>
          </div>
        )}

        {/* --- START SCREEN --- */}
        {gameState === 'start' && !isLoading && !error && (
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
        {gameState === 'playing' && questions.length > 0 && (
          <div className={styles.quizScreen}>
            
            <div className={styles.progressHeader}>
              <span className={styles.questionCounter}>Question {currentQuestion + 1} of {questions.length}</span>
              <span className={styles.scoreCounter}>Score: {score}</span>
            </div>
            
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${((currentQuestion) / questions.length) * 100}%`, transition: 'width 0.3s ease' }}
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
              {/* 🌟 6. Adjusted score thresholds for 10 questions */}
              {score === 1000 ? "Flawless! You are a master at spotting scams." : 
               score >= 700 ? "Good effort! But scammers are tricky. Keep training." : 
               "You are at high risk! Please review the Recovery Hub to secure your accounts."}
            </p>

            {/* Play Again fetches new questions! */}
            <button className={styles.primaryBtn} onClick={handlePlayAgain}>
              Play Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
}