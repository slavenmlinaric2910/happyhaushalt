import { useEffect, useMemo, useState } from 'react';
import { Copy, Link as LinkIcon, Mail, Share2, X } from 'lucide-react';
import { Button } from '../../core/ui/Button';
import { IconButton } from '../../core/ui/IconButton';
import styles from './InviteModal.module.css';

interface InviteModalProps {
  isOpen: boolean;
  joinCode: string;
  onClose: () => void;
}

export function InviteModal({ isOpen, joinCode, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState<'link' | 'message' | null>(null);

  const normalizedCode = useMemo(
    () => joinCode.trim().toUpperCase().replace(/\s/g, '').slice(0, 6),
    [joinCode]
  );

  const inviteUrl = useMemo(() => {
    const path = `/onboarding?join=${normalizedCode}`;
    return new URL(path, window.location.origin).toString();
  }, [normalizedCode]);

  const inviteMessage = useMemo(
    () =>
      `Join my household on HappyHaushalt.\nYour invite link will guide you directly — join code: ${normalizedCode}\n\n${inviteUrl}`,
    [normalizedCode, inviteUrl]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied('link');
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy invite link:', error);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(inviteMessage);
      setCopied('message');
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy invite message:', error);
    }
  };

  const handleShare = async () => {
    if (!('share' in navigator)) {
      await handleCopyMessage();
      return;
    }

    try {
      await navigator.share({
        title: 'HappyHaushalt Invite',
        text: inviteMessage,
        url: inviteUrl,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.error('Failed to share invite:', error);
    }
  };

  const handleEmail = () => {
    const subject = 'Join my household on HappyHaushalt';
    const body = inviteMessage;
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Invite to household">
        <div className={styles.handle} />
        <div className={styles.header}>
          <h2 className={styles.title}>Invite to Household</h2>
          <IconButton
            icon={<X size={20} />}
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close invite modal"
          />
        </div>

        <div className={styles.content}>
          <div className={styles.inviteMessage}>
            <p>Share the invite link with your household.</p>
            <div className={styles.codeRow}>
              <span className={styles.codeLabel}>Join code</span>
              <span className={styles.codePill}>{normalizedCode}</span>
            </div>
            <div className={styles.linkRow}>
              <LinkIcon size={16} />
              <span className={styles.linkText}>{inviteUrl}</span>
            </div>
            {copied === 'link' && <div className={styles.copiedHint}>Invite link copied</div>}
            {copied === 'message' && <div className={styles.copiedHint}>Invite message copied</div>}
          </div>

          <div className={styles.actions}>
            <Button variant="primary" onClick={handleShare} className={styles.primaryAction}>
              <Share2 size={18} />
              Share invite
            </Button>
            <Button variant="secondary" onClick={handleCopyMessage}>
              <Copy size={18} />
              Copy invite message
            </Button>
            <Button variant="secondary" onClick={handleCopyLink}>
              <LinkIcon size={18} />
              Copy invite link
            </Button>
            <Button variant="ghost" onClick={handleEmail}>
              <Mail size={18} />
              Email invite
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
