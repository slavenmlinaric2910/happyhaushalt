import { useEffect } from 'react';
import { ClipboardList, RefreshCw } from 'lucide-react';
import styles from './BottomSheet.module.css';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: () => void;
  onCreateChore: () => void;
}

export function BottomSheet({
  isOpen,
  onClose,
  onCreateTask,
  onCreateChore,
}: BottomSheetProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`${styles.sheet} ${isOpen ? styles.sheetVisible : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Create new item"
      >
        <div className={styles.handle} />
        <h2 className={styles.title}>Create New</h2>
        <div className={styles.options}>
          <button className={styles.option} onClick={onCreateTask}>
            <div className={styles.optionIcon}>
              <ClipboardList size={20} />
            </div>
            <div className={styles.optionContent}>
              <div className={styles.optionTitle}>Create Task</div>
              <div className={styles.optionDescription}>
                Add a one-time task with a due date
              </div>
            </div>
          </button>
          <button
            className={`${styles.option} ${styles.optionDisabled}`}
            onClick={onCreateChore}
          >
            <div className={`${styles.optionIcon} ${styles.optionIconDisabled}`}>
              <RefreshCw size={20} />
            </div>
            <div className={styles.optionContent}>
              <div className={styles.optionTitle}>Create Chore</div>
              <div className={styles.optionDescription}>
                Coming soon — recurring tasks
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
