import React from 'react';
import styles from './Components.module.css';

export default function LiveSmsScanner() {
  return (
    <div className={styles.subComponent}>
      <h3 className={styles.titleRed}>🔴 Live SMS Scanner Active</h3>
      <p className={styles.text}>Waiting for incoming messages...</p>
    </div>
  );
}