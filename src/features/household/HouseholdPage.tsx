import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useHouseholdRepo, useMemberRepo } from '../../app/providers/RepoProvider';
import { useAuth } from '../../app/providers/AuthProvider';
import { Card } from '../../core/ui/Card';
import { Button } from '../../core/ui/Button';
import { Users, Plus, UserPlus, LogOut, Lock, ThumbsUp, ArrowRight } from 'lucide-react';
import styles from './HouseholdPage.module.css';

export function HouseholdPage() {
  const householdRepo = useHouseholdRepo();
  const memberRepo = useMemberRepo();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const userId = user?.id || '';

  // Fetch member via React Query (will use cache if BootstrapGuard already fetched it)
  const { data: member } = useQuery({
    queryKey: ['member', userId],
    queryFn: () => memberRepo.getCurrentMember(),
    staleTime: 1000 * 60 * 5, // 5 minutes (member doesn't change often)
  });

  // Pass cached member to avoid duplicate getCurrentMember() call
  const {
    data: householdData,
    isLoading,
    error: householdError,
  } = useQuery({
    queryKey: ['household-with-members', userId],
    queryFn: async () => {
      const result = await householdRepo.getCurrentHouseholdWithMembers(member);
      return result;
    },
    enabled: member !== undefined, // Wait for member query to resolve (even if null)
    refetchOnMount: 'always',
    staleTime: 1000 * 60, // 1 minute (shorter than default 5 min)
  });

  const household = householdData?.household;
  const members = householdData?.members || [];

  const handleCopyCode = async () => {
    if (household?.joinCode) {
      try {
        await navigator.clipboard.writeText(household.joinCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy join code:', error);
      }
    }
  };

  const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Fallback to PNG if WebP fails, then to default avatar
    const target = e.currentTarget;
    if (target.src.endsWith('.webp')) {
      // Try PNG fallback
      const pngSrc = target.src.replace('.webp', '.png');
      target.src = pngSrc;
    } else {
      // Final fallback to default avatar
      target.src = '/avatars/broom-buddy.png';
    }
  };

  // Memoize creator name calculation
  const creatorName = useMemo(() => {
    if (!household?.createdBy) return 'Unknown';
    const creatorMember = members.find((m) => m.userId === household.createdBy);
    return creatorMember?.displayName || 'Unknown';
  }, [household?.createdBy, members]);

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <div className={styles.skeleton} style={{ width: '150px', height: '24px', marginBottom: '0.5rem' }} />
            <div className={styles.skeleton} style={{ width: '200px', height: '16px' }} />
          </div>
        </header>
        <Card className={styles.joinCodeCard}>
          <div className={styles.skeleton} style={{ width: '100px', height: '24px', marginBottom: '1rem' }} />
          <div className={styles.skeleton} style={{ width: '200px', height: '48px' }} />
        </Card>
        <div className={styles.membersSection}>
          <div className={styles.membersHeader}>
            <div className={styles.skeleton} style={{ width: '100px', height: '20px' }} />
            <div className={styles.skeleton} style={{ width: '40px', height: '20px' }} />
          </div>
          <div className={styles.membersGrid}>
            {[1, 2].map((i) => (
              <Card key={i} className={styles.memberCard}>
                <div className={styles.skeleton} style={{ width: '56px', height: '56px', borderRadius: '12px', margin: '0 auto 0.75rem' }} />
                <div className={styles.skeleton} style={{ width: '80px', height: '16px', margin: '0 auto' }} />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (householdError) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Household</h1>
        </header>
        <Card>
          <p className={styles.errorMessage}>
            Failed to load household. Please try again later.
          </p>
        </Card>
      </div>
    );
  }

  // No household state
  if (!household) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Household</h1>
        </header>
        <Card>
          <p className={styles.emptyMessage}>
            No household found. Create one to get started.
          </p>
          <Button
            onClick={() => navigate('/onboarding')}
            style={{ marginTop: '1rem' }}
          >
            Go to Onboarding
          </Button>
        </Card>
      </div>
    );
  }

  // Split join code into individual characters for display
  const joinCodeChars = household.joinCode.split('');

  return (
    <div className={styles.page}>
      {/* Header with title and metadata */}
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{household.name}</h1>
          <p className={styles.metadata}>
            {members.length} {members.length === 1 ? 'member' : 'members'} • Created by {creatorName}
          </p>
        </div>
      </header>

      {/* Join Code Section with decorative house illustration */}
      <div className={styles.joinCodeSection}>
        <picture>
          <source
            srcSet="/illustrations/house_happy_illustration.webp 1x, /illustrations/house_happy_illustration@2x.webp 2x"
            type="image/webp"
          />
          <img
            {...({ fetchpriority: 'high' } as React.ImgHTMLAttributes<HTMLImageElement>)}
            src="/illustrations/house_happy_illustration.webp"
            alt=""
            className={styles.houseDecoration}
            aria-hidden="true"
            width="380"
            height="380"
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src.endsWith('.webp')) {
                target.src = '/illustrations/house_happy_illustration.png';
              }
            }}
          />
        </picture>
        <Card className={styles.joinCodeCard}>
        <div className={styles.joinCodeLabelPill}>
          <span>Join Code</span>
        </div>
        <div className={styles.joinCodeContainer}>
          <div 
            className={styles.joinCodeBoxes}
            onClick={handleCopyCode}
          >
            {joinCodeChars.map((char, index) => (
              <span key={index} className={styles.joinCodeBox}>{char}</span>
            ))}
          </div>
        </div>
        <div className={styles.joinCodeInstructions}>
          <p>Tap code to copy</p>
          <p>Share this code with others to invite them to your household.</p>
        </div>
        </Card>
      </div>

      {/* Copied Notification Banner */}
      {copied && (
        <div className={styles.copiedBanner}>
          <ThumbsUp size={18} />
          <span>Copied to clipboard</span>
          <ArrowRight size={18} />
        </div>
      )}

      {/* Members Section */}
      <section className={styles.membersSection}>
        <div className={styles.membersHeader}>
          <h2 className={styles.membersTitle}>Members</h2>
          <div className={styles.memberCountBadge}>
            <Users size={16} />
            <span>{members.length}</span>
          </div>
        </div>
        <div className={styles.membersGrid}>
          {members.map((member) => {
            const memberIsOwner = member.userId === household.createdBy;
            return (
              <Card key={member.id} className={styles.memberCard}>
                <img
                  src={`/avatars/${member.avatarId}.webp`}
                  srcSet={`/avatars/${member.avatarId}.webp 1x, /avatars/${member.avatarId}@2x.webp 2x`}
                  sizes="230px"
                  alt={member.displayName}
                  className={styles.memberAvatar}
                  loading="lazy"
                  width="230"
                  height="230"
                  onError={handleAvatarError}
                />
                <p className={styles.memberName}>{member.displayName}</p>
                {memberIsOwner && (
                  <div className={styles.ownerTag}>
                    <Lock size={12} />
                    <span>Owner</span>
                  </div>
                )}
              </Card>
            );
          })}
          <Card className={styles.inviteCard} onClick={() => {/* TODO: Handle invite */}}>
            <div className={styles.inviteIcon}>
              <Plus size={24} />
            </div>
            <p className={styles.inviteText}>Invite someone</p>
          </Card>
        </div>
      </section>

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <Button
          onClick={() => {/* TODO: Handle invite */}}
          className={styles.inviteButton}
        >
          <UserPlus size={18} />
          Invite
        </Button>
        <Button
          onClick={() => {/* TODO: Handle leave */}}
          variant="ghost"
          className={styles.leaveButton}
        >
          <LogOut size={18} />
          Leave
        </Button>
      </div>
    </div>
  );
}

