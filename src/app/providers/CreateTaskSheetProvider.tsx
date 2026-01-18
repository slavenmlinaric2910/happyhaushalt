import { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRepo, useMemberRepo } from './RepoProvider';
import { CreateTaskSheet } from '../../features/tasks/CreateTaskSheet';
import { useNavigate } from 'react-router-dom';

interface CreateTaskSheetContextValue {
  openSheet: () => void;
  closeSheet: () => void;
}

const CreateTaskSheetContext = createContext<CreateTaskSheetContextValue | null>(null);

export function CreateTaskSheetProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const repo = useRepo();
  const memberRepo = useMemberRepo();
  const [isOpen, setIsOpen] = useState(false);

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

  const handleCreateChore = () => {
    setIsOpen(false);
    navigate('/chores');
  };

  const handleCreateOneTimeTask = () => {
    setIsOpen(false);
    // TODO: Navigate to create one-time task page or open task creation form
    console.log('Create one-time task - to be implemented');
  };

  return (
    <CreateTaskSheetContext.Provider
      value={{
        openSheet: () => setIsOpen(true),
        closeSheet: () => setIsOpen(false),
      }}
    >
      {children}
      <CreateTaskSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        members={members}
        onCreateChore={handleCreateChore}
        onCreateOneTimeTask={handleCreateOneTimeTask}
      />
    </CreateTaskSheetContext.Provider>
  );
}

export function useCreateTaskSheet(): CreateTaskSheetContextValue {
  const context = useContext(CreateTaskSheetContext);
  if (!context) {
    throw new Error('useCreateTaskSheet must be used within CreateTaskSheetProvider');
  }
  return context;
}
