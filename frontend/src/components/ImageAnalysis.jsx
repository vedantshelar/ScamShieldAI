import React from 'react';
import styles from './Components.module.css';

export default function ImageAnalysis() {
  return (
    <div className={styles.subComponent}>
      <h3 className={styles.titleBlue}>🔴 Live SMS Scanner Active</h3>
      <p className={styles.text}>Waiting for incoming messages...</p>
    </div>
  );
}