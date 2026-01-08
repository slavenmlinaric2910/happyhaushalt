import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHouseholdRepo, useMemberRepo } from '../../app/providers/RepoProvider';
import { useAuth } from '../../app/providers/AuthProvider';
import { Card } from '../../core/ui/Card';
import { Button } from '../../core/ui/Button';
import { AvatarCarousel } from './AvatarCarousel';
import { AVATARS, type AvatarId } from './avatars';
import type { Household } from '../../core/types';
import styles from './OnboardingPage.module.css';

type Mode = 'create' | 'join';
type Step = 1 | 2;

export function OnboardingPage() {
  const navigate = useNavigate();
  const householdRepo = useHouseholdRepo();
  const memberRepo = useMemberRepo();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<Mode>('create');
  const [householdName, setHouseholdName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [household, setHousehold] = useState<Household | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarId, setAvatarId] = useState<AvatarId>(AVATARS[0].id);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill displayName from user metadata
  useEffect(() => {
    if (user && !displayName) {
      const metadata = user.user_metadata;
      const name =
        metadata?.full_name ||
        metadata?.name ||
        (user.email ? user.email.split('@')[0] : '');
      if (name) {
        setDisplayName(name);
      }
    }
  }, [user, displayName]);

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!householdName.trim()) {
      setError('Please enter a household name');
      return;
    }

    setIsLoading(true);
    try {
      const newHousehold = await householdRepo.createHousehold(householdName.trim());
      setHousehold(newHousehold);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create household. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const trimmedCode = joinCode.trim().toUpperCase();
    if (!trimmedCode) {
      setError('Please enter a join code');
      return;
    }

    setIsLoading(true);
    try {
      const joinedHousehold = await householdRepo.joinByCode(trimmedCode);
      setHousehold(joinedHousehold);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join household. Please check the code and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto uppercase and remove spaces
    const value = e.target.value.toUpperCase().replace(/\s/g, '');
    setJoinCode(value);
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError('Please enter a display name');
      return;
    }

    if (!household) {
      setError('Household not found. Please go back and try again.');
      return;
    }

    setIsLoading(true);
    try {
      await memberRepo.ensureMemberExists({
        householdId: household.id,
        displayName: displayName.trim(),
        avatarId,
      });
      navigate('/home', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.title}>
          {step === 1 ? 'Get Started' : 'Create Your Profile'}
        </h1>

        {step === 1 ? (
          <>
            <div className={styles.modeToggle}>
              <button
                type="button"
                className={`${styles.modeButton} ${mode === 'create' ? styles.active : ''}`}
                onClick={() => {
                  setMode('create');
                  setError(null);
                  setJoinCode('');
                }}
              >
                Create Household
              </button>
              <button
                type="button"
                className={`${styles.modeButton} ${mode === 'join' ? styles.active : ''}`}
                onClick={() => {
                  setMode('join');
                  setError(null);
                  setHouseholdName('');
                }}
              >
                Join Household
              </button>
            </div>

            <Card className={styles.card}>
              {mode === 'create' ? (
                <form onSubmit={handleCreateHousehold}>
                  <div className={styles.field}>
                    <label className={styles.label}>Household Name</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={householdName}
                      onChange={(e) => setHouseholdName(e.target.value)}
                      placeholder="e.g., Smith Family"
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>
                  {error && <div className={styles.error}>{error}</div>}
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isLoading}
                    className={styles.submitButton}
                  >
                    {isLoading ? 'Creating...' : 'Create Household'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleJoinHousehold}>
                  <div className={styles.field}>
                    <label className={styles.label}>Join Code</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={joinCode}
                      onChange={handleJoinCodeChange}
                      placeholder="Enter 6-character code"
                      disabled={isLoading}
                      maxLength={6}
                      autoFocus
                    />
                    <p className={styles.hint}>Enter the 6-character code shared by your household</p>
                  </div>
                  {error && <div className={styles.error}>{error}</div>}
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isLoading}
                    className={styles.submitButton}
                  >
                    {isLoading ? 'Joining...' : 'Join Household'}
                  </Button>
                </form>
              )}
            </Card>
          </>
        ) : (
          <Card className={styles.card}>
            <form onSubmit={handleFinish}>
              <div className={styles.field}>
                <label className={styles.label}>Display Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Choose Your Avatar</label>
                <AvatarCarousel
                  value={avatarId}
                  onChange={setAvatarId}
                />
              </div>

              {error && <div className={styles.error}>{error}</div>}
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading}
                className={styles.submitButton}
              >
                {isLoading ? 'Creating Profile...' : 'Finish'}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}

