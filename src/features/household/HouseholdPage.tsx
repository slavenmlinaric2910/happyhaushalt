import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRepo } from '../../app/providers/RepoProvider';
import { Card } from '../../core/ui/Card';
import { Button } from '../../core/ui/Button';
import { Copy, Check } from 'lucide-react';
import styles from './HouseholdPage.module.css';

export function HouseholdPage() {
  const repo = useRepo();
  const [copied, setCopied] = useState(false);

  const { data: household } = useQuery({
    queryKey: ['household'],
    queryFn: () => repo.getCurrentHousehold(),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members', household?.id],
    queryFn: async () => {
      if (!household) return [];
      return repo.listMembers(household.id);
    },
    enabled: !!household,
  });

  const handleCopyCode = async () => {
    if (household?.joinCode) {
      await navigator.clipboard.writeText(household.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Household</h1>
      {household ? (
        <>
          <Card className={styles.joinCodeCard}>
            <div className={styles.joinCodeHeader}>
              <h2 className={styles.joinCodeLabel}>Join Code</h2>
              <Button
                variant="ghost"
                onClick={handleCopyCode}
                className={styles.copyButton}
              >
                {copied ? (
                  <>
                    <Check size={16} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <p className={styles.joinCode}>{household.joinCode}</p>
          </Card>
          <div className={styles.membersSection}>
            <h2 className={styles.membersTitle}>Members</h2>
            <div className={styles.membersList}>
              {members.length === 0 ? (
                <p className={styles.empty}>No members yet</p>
              ) : (
                members.map((member) => (
                  <Card key={member.id} className={styles.memberCard}>
                    <p className={styles.memberName}>{member.displayName}</p>
                  </Card>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <Card>
          <p>No household found. Create one to get started.</p>
        </Card>
      )}
    </div>
  );
}

