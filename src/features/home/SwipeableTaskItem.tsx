import React, { useRef, useState } from 'react';
import styles from './SwipeableTaskItem.module.css';

export type SwipeableTaskItemProps = {
  id: string;
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  tag?: { label: string; variant: 'task' | 'chore' };
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
};

const SWIPE_THRESHOLD = 60; // px
const TAP_SLOP = 8; // px: kleine Bewegungen gelten noch als "Tap"

export function SwipeableTaskItem({
                                    id,
                                    title,
                                    subtitle,
                                    leftIcon,
                                    tag,
                                    onComplete,
                                    onDelete,
                                    onEdit,
                                  }: SwipeableTaskItemProps) {
  const startX = useRef<number | null>(null);
  const moved = useRef(false);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // nur linke Maustaste / Touch
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    startX.current = e.clientX;
    moved.current = false;
    setIsDragging(true);

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging || startX.current == null) return;

    const deltaX = e.clientX - startX.current;

    if (Math.abs(deltaX) > TAP_SLOP) {
      moved.current = true;
    }

    setOffsetX(Math.max(Math.min(deltaX, 120), -120));
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging || startX.current == null) return;

    const deltaX = e.clientX - startX.current;

    setIsDragging(false);
    startX.current = null;
    setOffsetX(0);

    if (deltaX <= -SWIPE_THRESHOLD) {
      onDelete(id); // Swipe nach links
      return;
    }

    if (deltaX >= SWIPE_THRESHOLD) {
      onComplete(id); // Swipe nach rechts
      return;
    }

    // sonst: keine Action (Tap wird über onClick behandelt)
  }

  function handleClick() {
    // Nur echter Tap/Click (ohne nennenswerte Bewegung) → Edit
    if (!moved.current) {
      onEdit(id);
    }
  }

  return (
    <div className={styles.wrapper}>
      {tag && (
        <span className={`${styles.tag} ${styles[tag.variant]}`}>
          {tag.label}
        </span>
      )}
      <div className={styles.background}>
        <div className={styles.completeBackground}>Erledigt</div>
        <div className={styles.deleteBackground}>Löschen</div>
      </div>

      <div
        className={styles.card}
        style={{ transform: `translateX(${offsetX}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
      >
        {leftIcon ? <div className={styles.leftIcon}>{leftIcon}</div> : null}

        <div className={styles.textContainer}>
          <div className={styles.title}>{title}</div>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.deleteButton}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
          >
            ✕
          </button>
          <button
            type="button"
            className={styles.completeButton}
            onClick={(e) => {
              e.stopPropagation();
              onComplete(id);
            }}
          >
            ✓
          </button>
        </div>
      </div>
    </div>
  );
}
