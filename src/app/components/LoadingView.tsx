import styles from './LoadingView.module.css';

export function LoadingView() {
  return (
    <div className={styles.container}>
      <p className={styles.text}>Loading…</p>
    </div>
  );
}

