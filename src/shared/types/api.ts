export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiEndpoint {
  id: string;
  projectId: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: string;
  body: string;
}
