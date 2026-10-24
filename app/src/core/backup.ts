// SPDX-License-Identifier: AGPL-3.0-or-later
// Montagem do estado exportável: backup local sem credenciais de IA.

import { AppState } from '../types';

/**
 * Cria uma cópia profunda do estado pronta para virar arquivo JSON.
 *
 * A chave de IA é uma credencial do usuário: ela fica apenas neste aparelho
 * (IndexedDB/localStorage) e nunca deve sair no backup. O campo `apiKey`
 * permanece no objeto, vazio, para manter o tipo `AISettingsState` íntegro.
 *
 * O estado original não é alterado — nada aqui muta `state`.
 */
export function toExportableState(state: AppState): AppState {
  // Round-trip JSON: clona objetos e arrays aninhados e já aplica as mesmas
  // regras de serialização do arquivo exportado.
  const copy = JSON.parse(JSON.stringify(state)) as AppState;

  if (copy.ai) {
    copy.ai = { ...copy.ai, apiKey: '' };
  }

  return copy;
}
