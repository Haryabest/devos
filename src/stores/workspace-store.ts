import { create } from 'zustand';

interface WorkspaceState {
  currentWorkspaceId: string | null;
  setCurrent: (id: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  currentWorkspaceId: null,
  setCurrent: (id) => set({ currentWorkspaceId: id }),
}));
