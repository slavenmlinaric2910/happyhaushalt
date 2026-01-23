import { X } from 'lucide-react';
import styles from './CreateModal.module.css';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: () => void;
  onCreateChore: () => void;
}

export function CreateModal({
  isOpen,
  onClose,
  onCreateTask,
  onCreateChore,
}: CreateModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.modal}>
        <div className={styles.handle} />
        <div className={styles.header}>
          <h2 className={styles.title}>Create</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <div className={styles.content}>
          <button
            onClick={onCreateTask}
            className={styles.option}
          >
            <div className={styles.optionLabel}>Create Task</div>
            <div className={styles.optionDescription}>Add a single task</div>
          </button>

          <button
            onClick={onCreateChore}
            className={styles.option}
          >
            <div className={styles.optionLabel}>Create Chore</div>
            <div className={styles.optionDescription}>Set up a recurring chore</div>
          </button>
        </div>
      </div>
    </>
  );
}
