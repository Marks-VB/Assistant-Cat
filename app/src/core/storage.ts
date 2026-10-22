// SPDX-License-Identifier: AGPL-3.0-or-later
// GatoStorage - Camada de Persistência Assíncrona Local-First (IndexedDB / localStorage)

import { AppState } from '../types';

const DB_NAME = 'assistente-gato-db';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';
const STATE_KEY = 'current_state';

class StorageManager {
  private mode: 'idb' | 'local' | 'memory' = 'idb';
  private memoryCache: AppState | null = null;

  async init(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      this.mode = 'local';
      return;
    }
    return new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = () => {
          this.mode = 'idb';
          req.result.close();
          resolve();
        };
        req.onerror = () => {
          this.mode = 'local';
          resolve();
        };
      } catch {
        this.mode = 'local';
        resolve();
      }
    });
  }

  async load(): Promise<AppState | null> {
    if (this.mode === 'memory') return this.memoryCache;
    if (this.mode === 'local') {
      try {
        const raw = localStorage.getItem(DB_NAME);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }
    return new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const getReq = store.get(STATE_KEY);
          getReq.onsuccess = () => {
            db.close();
            resolve(getReq.result || null);
          };
          getReq.onerror = () => {
            db.close();
            resolve(null);
          };
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async save(state: AppState): Promise<void> {
    this.memoryCache = state;
    if (this.mode === 'memory') return;
    if (this.mode === 'local') {
      try {
        localStorage.setItem(DB_NAME, JSON.stringify(state));
      } catch (err) {
        console.warn('Falha ao salvar no localStorage:', err);
      }
      return;
    }
    return new Promise((resolve, reject) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const putReq = store.put(state, STATE_KEY);
          putReq.onsuccess = () => {
            db.close();
            resolve();
          };
          putReq.onerror = () => {
            db.close();
            reject(putReq.error);
          };
        };
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  getMode() {
    return this.mode;
  }
}

export const GatoStorage = new StorageManager();
