import { useRef, useEffect } from 'react';
import { Avatar, AvatarId, AVATARS } from './avatars';
import styles from './AvatarCarousel.module.css';

interface AvatarCarouselProps {
  value: AvatarId;
  onChange: (id: AvatarId) => void;
  avatars?: Avatar[];
}

export function AvatarCarousel({
  value,
  onChange,
  avatars = AVATARS,
}: AvatarCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Scroll selected avatar into view on mount or when value changes
  useEffect(() => {
    if (selectedRef.current && containerRef.current) {
      const container = containerRef.current;
      const selected = selectedRef.current;
      const containerRect = container.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();
      
      const scrollLeft =
        selected.offsetLeft -
        containerRect.width / 2 +
        selectedRect.width / 2;
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth',
      });
    }
  }, [value]);

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    id: AvatarId
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(id);
    }
  };

  return (
    <div className={styles.carousel} ref={containerRef}>
      {avatars.map((avatar) => {
        const isSelected = avatar.id === value;
        return (
          <button
            key={avatar.id}
            ref={isSelected ? selectedRef : null}
            type="button"
            className={`${styles.avatarItem} ${isSelected ? styles.selected : ''}`}
            onClick={() => onChange(avatar.id)}
            onKeyDown={(e) => handleKeyDown(e, avatar.id)}
            aria-label={`Select ${avatar.label} avatar`}
            aria-pressed={isSelected}
          >
            <img
              src={avatar.src}
              alt={avatar.label}
              className={styles.avatarImage}
            />
            <span className={styles.avatarLabel}>{avatar.label}</span>
          </button>
        );
      })}
    </div>
  );
}

