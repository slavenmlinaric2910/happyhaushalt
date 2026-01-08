import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHouseholdRepo } from '../../app/providers/RepoProvider';
import { Card } from '../../core/ui/Card';
import { Button } from '../../core/ui/Button';
import styles from './OnboardingPage.module.css';

type Mode = 'create' | 'join';

export function OnboardingPage() {
  const navigate = useNavigate();
  const householdRepo = useHouseholdRepo();
  const [mode, setMode] = useState<Mode>('create');
  const [householdName, setHouseholdName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!householdName.trim()) {
      setError('Please enter a household name');
      return;
    }

    setIsLoading(true);
    try {
      await householdRepo.createHousehold(householdName.trim());
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create household. Please try again.');
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
      await householdRepo.joinByCode(trimmedCode);
      navigate('/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join household. Please check the code and try again.');
      setIsLoading(false);
    }
  };

  const handleJoinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto uppercase and remove spaces
    const value = e.target.value.toUpperCase().replace(/\s/g, '');
    setJoinCode(value);
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.title}>Get Started</h1>
        
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
      </div>
    </div>
  );
}

