import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createScopedPersistStorage } from '@/lib/scoped-storage';
import type { Attachment, Client, ClientContact, ClientContract } from '@/shared/types';
import { useSaveStore } from '@/stores/save-store';
import { useProjectsStore } from '@/stores/projects-store';
import {
  isServerSyncEnabled,
  persistClientCreate,
  persistClientRemove,
  persistClientUpdate,
} from '@/lib/server-persist';

export interface NewClient {
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

interface ClientsState {
  clients: Client[];
  add: (input: NewClient) => Client;
  update: (id: string, patch: Partial<Client>) => void;
  remove: (id: string) => void;
  getById: (id: string) => Client | undefined;
  addContact: (clientId: string, input: Omit<ClientContact, 'id'>) => void;
  removeContact: (clientId: string, contactId: string) => void;
  addContract: (clientId: string, input: Omit<ClientContract, 'id'>) => void;
  removeContract: (clientId: string, contractId: string) => void;
  addFile: (clientId: string, input: { kind: Attachment['kind']; label: string; value: string }) => void;
  removeFile: (clientId: string, fileId: string) => void;
  setFromServer: (clients: Client[]) => void;
}

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function syncClientById(get: () => ClientsState, id: string) {
  if (!isServerSyncEnabled()) return;
  const client = get().clients.find((c) => c.id === id);
  if (client) void persistClientUpdate(client).catch(() => undefined);
}

export const useClientsStore = create<ClientsState>()(
  persist(
    (set, get) => ({
      clients: [],

      add: (input) => {
        const client: Client = {
          id: uid(),
          name: input.name.trim(),
          description: input.description?.trim() ?? '',
          email: input.email?.trim() ?? '',
          phone: input.phone?.trim() ?? '',
          contacts: [],
          contracts: [],
          files: [],
          notes: input.notes?.trim() ?? '',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ clients: [client, ...s.clients] }));
        useSaveStore.getState().markSaved();
        if (isServerSyncEnabled()) {
          void persistClientCreate(client)
            .then((saved) => {
              if (saved && saved.id !== client.id) {
                useClientsStore.setState((s) => ({
                  clients: s.clients.map((c) => (c.id === client.id ? saved : c)),
                }));
              }
            })
            .catch(() => undefined);
        }
        return client;
      },

      update: (id, patch) => {
        set((s) => ({
          clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }));
        useSaveStore.getState().markSaved();
        syncClientById(get, id);
      },

      remove: (id) => {
        set((s) => ({ clients: s.clients.filter((c) => c.id !== id) }));
        useProjectsStore.getState().projects
          .filter((p) => p.clientId === id)
          .forEach((p) => useProjectsStore.getState().update(p.id, { clientId: null }));
        useSaveStore.getState().markSaved();
        if (isServerSyncEnabled()) void persistClientRemove(id).catch(() => undefined);
      },

      getById: (id) => get().clients.find((c) => c.id === id),

      addContact: (clientId, input) => {
        const contact: ClientContact = {
          id: uid(),
          name: input.name.trim(),
          role: input.role.trim(),
          email: input.email.trim(),
          phone: input.phone.trim(),
        };
        const client = get().getById(clientId);
        if (!client) return;
        get().update(clientId, { contacts: [...client.contacts, contact] });
      },

      removeContact: (clientId, contactId) => {
        const client = get().getById(clientId);
        if (!client) return;
        get().update(clientId, {
          contacts: client.contacts.filter((c) => c.id !== contactId),
        });
      },

      addContract: (clientId, input) => {
        const contract: ClientContract = {
          id: uid(),
          title: input.title.trim(),
          number: input.number.trim(),
          date: input.date.trim(),
          notes: input.notes.trim(),
        };
        const client = get().getById(clientId);
        if (!client) return;
        get().update(clientId, { contracts: [...client.contracts, contract] });
      },

      removeContract: (clientId, contractId) => {
        const client = get().getById(clientId);
        if (!client) return;
        get().update(clientId, {
          contracts: client.contracts.filter((c) => c.id !== contractId),
        });
      },

      addFile: (clientId, input) => {
        const file: Attachment = {
          id: uid(),
          kind: input.kind,
          label: input.label.trim() || (input.kind === 'link' ? input.value.trim() : 'Файл'),
          value: input.value.trim(),
          createdAt: new Date().toISOString(),
        };
        const client = get().getById(clientId);
        if (!client) return;
        get().update(clientId, { files: [...client.files, file] });
      },

      removeFile: (clientId, fileId) => {
        const client = get().getById(clientId);
        if (!client) return;
        get().update(clientId, { files: client.files.filter((f) => f.id !== fileId) });
      },

      setFromServer: (clients) => {
        set({ clients });
        useSaveStore.getState().markSaved();
      },
    }),
    {
      name: 'devos:clients',
      skipHydration: true,
      storage: createJSONStorage(() => createScopedPersistStorage('devos:clients')),
      version: 1,
    },
  ),
);
