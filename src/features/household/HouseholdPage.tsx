import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useHouseholdRepo, useMemberRepo } from '../../app/providers/RepoProvider';
import { useAuth } from '../../app/providers/AuthProvider';
import { useOfflineQuery } from '../../app/hooks/useOfflineQuery';
import { db } from '../../core/offline/db';
import type { Household, Member } from '../../core/types';
import { Card } from '../../core/ui/Card';
import { Button } from '../../core/ui/Button';
import { Users, Plus, UserPlus, LogOut, Lock, ThumbsUp, ArrowRight } from 'lucide-react';
import styles from './HouseholdPage.module.css';
import { ConfirmDialog } from '../../core/ui/ConfirmDialog';
import { InviteModal } from './InviteModal';

export function HouseholdPage() {
  const householdRepo = useHouseholdRepo();
  const memberRepo = useMemberRepo();
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const { user, signOut } = useAuth();
  const userId = user?.id || '';

  const [copied, setCopied] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const leaveHouseholdMutation = useMutation({
    mutationFn: async () => {
      await memberRepo.leaveCurrentHousehold();
    },
    onSuccess: async () => {
      // Clear cached data so stale household/member info can't reappear after leaving
      queryClient.clear();

      // Sign out to remove session/user data (team requirement)
      await signOut();

      // Redirect to login and prevent the browser back button from returning here
      navigate('/login', { replace: true });
    },
    onError: (error) => {
      console.error('Failed to leave household:', error);
    },
  });

  // Fetch member via offline query (cached)
  const { data: member } = useOfflineQuery({
    queryKey: ['member', userId],
    queryFn: () => memberRepo.getCurrentMember(),
    staleTime: 1000 * 60 * 5,
    readFromDexie: async (key) => {
      const [, userIdFromKey] = key;
      if (!userIdFromKey || typeof userIdFromKey !== 'string') return null;
      const m = await db.members.where('userId').equals(userIdFromKey).first();
      return m || null;
    },
    writeToDexie: async (data) => {
      if (data) await db.members.put(data);
    },
  });

  const {
    data: householdData,
    isLoading,
    error: householdError,
  } = useOfflineQuery<{ household: Household | null; members: Member[] }>({
    queryKey: ['household-with-members', userId],
    queryFn: async () => householdRepo.getCurrentHouseholdWithMembers(member),
    enabled: member !== undefined,
    refetchOnMount: 'always',
    staleTime: 1000 * 60,
    readFromDexie: async () => {
      const household = await db.households.toCollection().first();
      if (!household) return { household: null, members: [] };
      const members = await db.members.where('householdId').equals(household.id).toArray();
      return { household, members };
    },
    writeToDexie: async (data) => {
      if (data.household) await db.households.put(data.household);
      if (data.members.length > 0) await db.members.bulkPut(data.members);
    },
  });

  const household = householdData?.household;
  const members = useMemo(() => householdData?.members || [], [householdData?.members]);

  const handleCopyCode = async () => {
    if (!household?.joinCode) return;
    try {
      await navigator.clipboard.writeText(household.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy join code:', error);
    }
  };

  const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    if (target.src.endsWith('.webp')) {
      target.src = target.src.replace('.webp', '.png');
    } else {
      target.src = '/avatars/broom-buddy.png';
    }
  };

  const creatorName = useMemo(() => {
    if (!household?.createdBy) return 'Unknown';
    const creatorMember = members.find((m: Member) => m.userId === household.createdBy);
    return creatorMember?.displayName || 'Unknown';
  }, [household?.createdBy, members]);

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
                <div
                  className={styles.skeleton}
                  style={{ width: '56px', height: '56px', borderRadius: '12px', margin: '0 auto 0.75rem' }}
                />
                <div className={styles.skeleton} style={{ width: '80px', height: '16px', margin: '0 auto' }} />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (householdError) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Household</h1>
        </header>
        <Card>
          <p className={styles.errorMessage}>Failed to load household. Please try again later.</p>
        </Card>
      </div>
    );
  }

  if (!household) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Household</h1>
        </header>
        <Card>
          <p className={styles.emptyMessage}>No household found. Create one to get started.</p>
          <Button onClick={() => navigate('/onboarding')} style={{ marginTop: '1rem' }}>
            Go to Onboarding
          </Button>
        </Card>
      </div>
    );
  }

  const joinCodeChars = household.joinCode.split('');

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{household.name}</h1>
          <p className={styles.metadata}>
            {members.length} {members.length === 1 ? 'member' : 'members'} • Created by {creatorName}
          </p>
        </div>
      </header>

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
            <div className={styles.joinCodeBoxes} onClick={handleCopyCode}>
              {joinCodeChars.map((char, index) => (
                <span key={index} className={styles.joinCodeBox}>
                  {char}
                </span>
              ))}
            </div>
          </div>
          <div className={styles.joinCodeInstructions}>
            <p>Tap code to copy</p>
            <p>Share this code with others to invite them to your household.</p>
          </div>
        </Card>
      </div>

      {copied && (
        <div className={styles.copiedBanner}>
          <ThumbsUp size={18} />
          <span>Copied to clipboard</span>
          <ArrowRight size={18} />
        </div>
      )}

      <section className={styles.membersSection}>
        <div className={styles.membersHeader}>
          <h2 className={styles.membersTitle}>Members</h2>
          <div className={styles.memberCountBadge}>
            <Users size={16} />
            <span>{members.length}</span>
          </div>
        </div>

        <div className={styles.membersGrid}>
          {members.map((member: Member) => {
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

          <Card className={styles.inviteCard} onClick={() => setShowInviteModal(true)}>
            <div className={styles.inviteIcon}>
              <Plus size={24} />
            </div>
            <p className={styles.inviteText}>Invite someone</p>
          </Card>
        </div>
      </section>

      <div className={styles.actionButtons}>
        <Button onClick={() => setShowInviteModal(true)} className={styles.inviteButton}>
          <UserPlus size={18} />
          Invite
        </Button>

        <Button
          onClick={() => setShowLeaveDialog(true)}
          disabled={leaveHouseholdMutation.isPending}
          variant="ghost"
          className={styles.leaveButton}
        >
          <LogOut size={18} />
          {leaveHouseholdMutation.isPending ? 'Leaving…' : 'Leave'}
        </Button>
      </div>

      <ConfirmDialog
        open={showLeaveDialog}
        title="Leave household?"
        description="You will be logged out and lose access to this household. You can rejoin with the join code."
        confirmLabel={leaveHouseholdMutation.isPending ? 'Leaving…' : 'Leave'}
        cancelLabel="Cancel"
        confirmVariant="primary"
        confirmDisabled={leaveHouseholdMutation.isPending}
        onCancel={() => setShowLeaveDialog(false)}
        onConfirm={async () => {
          setShowLeaveDialog(false);
          await leaveHouseholdMutation.mutateAsync();
        }}
      />

      <InviteModal
        isOpen={showInviteModal}
        joinCode={household.joinCode}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
}
