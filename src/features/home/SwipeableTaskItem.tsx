import React, { useRef, useState } from 'react';
import styles from './SwipeableTaskItem.module.css';

export type SwipeableTaskItemProps = {
  id: string;
  title: string;
  subtitle?: string;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
};

const SWIPE_THRESHOLD = 80; // px

export function SwipeableTaskItem({
                                    id,
                                    title,
                                    subtitle,
                                    onComplete,
                                    onDelete,
                                    onEdit,
                                  }: SwipeableTaskItemProps) {
  const startX = useRef<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // nur linke Maustaste / Touch
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    startX.current = e.clientX;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging || startX.current == null) return;
    const deltaX = e.clientX - startX.current;
    // leicht begrenzen, damit es „soft“ bleibt
    setOffsetX(Math.max(Math.min(deltaX, 120), -120));
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging || startX.current == null) return;
    const deltaX = e.clientX - startX.current;

    setIsDragging(false);
    startX.current = null;
    setOffsetX(0);

    if (deltaX < SWIPE_THRESHOLD) {
      onDelete(id); // nach links
    } else if (deltaX > -SWIPE_THRESHOLD) {
      onComplete(id); // nach rechts
    }
  }

  function handleClick() {
    // Nur normales Klicken → Edit
    if (!isDragging) {
      onEdit(id);
    }
  }

  return (
    <div className={styles.wrapper}>
      {/* Hintergrund-Actions */}
      <div className={styles.background}>
        <div className={styles.deleteBackground}>Löschen</div>
        <div className={styles.completeBackground}>Erledigt</div>
      </div>

      {/* Vordergrund-Card, die verschoben wird */}
      <div
        className={styles.card}
        style={{ transform: `translateX(${offsetX}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleClick}
      >
        <div className={styles.textContainer}>
          <div className={styles.title}>{title}</div>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>

        {/* Fallback-Actions für Desktop (optional, aber praktisch) */}
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
