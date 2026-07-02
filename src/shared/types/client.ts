import type { Attachment } from './attachment';

export interface ClientContact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface ClientContract {
  id: string;
  title: string;
  number: string;
  date: string;
  notes: string;
}

export interface Client {
  id: string;
  name: string;
  description: string;
  email: string;
  phone: string;
  contacts: ClientContact[];
  contracts: ClientContract[];
  files: Attachment[];
  notes: string;
  createdAt: string;
}
