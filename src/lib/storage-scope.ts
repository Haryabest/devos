export const WORKSPACE_STORAGE_KEYS = [
  'devos:projects',
  'devos:groups',
  'devos:tasks',
  'devos:docs',
  'devos:api',
  'devos:clients',
  'devos:git',
  'devos:roadmap',
  'devos:figma',
  'devos:settings',
  'devos:team',
  'devos:project-links',
] as const;

type ScopeHandler = (mode: 'switch' | 'logout') => void | Promise<void>;

let scopeHandler: ScopeHandler | null = null;
let getScope: () => string = () => 'anonymous';

export function setStorageScopeGetter(getter: () => string) {
  getScope = getter;
}

export function registerWorkspaceScopeHandler(handler: ScopeHandler) {
  scopeHandler = handler;
}

export function onAuthScopeSwitch() {
  void scopeHandler?.('switch');
}

export function onAuthLogout() {
  void scopeHandler?.('logout');
}

export function getStorageScope(): string {
  return getScope();
}

export function scopedStorageKey(base: string): string {
  return `${base}:${getStorageScope()}`;
}

function migrateLegacyKey(base: string, scopedKey: string): string | null {
  const legacy = localStorage.getItem(base);
  if (!legacy) return null;
  if (localStorage.getItem(scopedKey)) return null;
  localStorage.setItem(scopedKey, legacy);
  return legacy;
}

export function readScopedItem(base: string): string | null {
  const key = scopedStorageKey(base);
  return localStorage.getItem(key) ?? migrateLegacyKey(base, key);
}

export function writeScopedItem(base: string, value: string): void {
  localStorage.setItem(scopedStorageKey(base), value);
}

export function removeScopedItem(base: string): void {
  localStorage.removeItem(scopedStorageKey(base));
}
