import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  calculateNextDueDate,
  civilDate,
  completeTaskWithRepeat,
  validDate,
  validateEvent,
} from './domain';
import type { Task } from '../types';

describe('domain — datas', () => {
  it('civilDate usa America/Sao_Paulo por padrão', () => {
    // 02:00Z = 23:00 do dia anterior em São Paulo (UTC-3).
    expect(civilDate(new Date('2026-01-01T02:00:00Z'))).toBe('2025-12-31');
  });

  it('addDays avança um dia', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
  });

  it('addMonths faz clamp no fim do mês (31/01 + 1 mês)', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
  });

  it('validDate aceita data real e rejeita data inexistente', () => {
    expect(validDate('2026-02-28')).toBe(true);
    expect(validDate('2026-02-30')).toBe(false);
  });
});

describe('domain — validateEvent', () => {
  it('exige título', () => {
    expect(validateEvent({ title: '  ', date: '2026-05-10', allDay: true })).toBe('Informe o título.');
  });

  it('rejeita data inválida', () => {
    expect(validateEvent({ title: 'Reunião', date: '2026-13-01', allDay: true })).toBe(
      'Informe uma data válida.'
    );
  });

  it('aceita evento válido', () => {
    expect(validateEvent({ title: 'Reunião', date: '2026-05-10', allDay: true })).toBeNull();
  });
});

describe('domain — recorrência e idempotência', () => {
  it('calculateNextDueDate usa addMonths', () => {
    expect(calculateNextDueDate('2026-01-31', { unit: 'months', amount: 1 })).toBe('2026-02-28');
  });

  it('completeTaskWithRepeat não duplica série com pendência existente', () => {
    const tasks = [
      {
        id: 't1',
        title: 'Pagar conta',
        done: false,
        seriesId: 'serie-1',
        repeatAfter: { unit: 'months', amount: 1 },
      },
      { id: 't2', title: 'Pagar conta', done: false, seriesId: 'serie-1' },
    ] as unknown as Task[];
    const result = completeTaskWithRepeat(tasks, 't1', {
      completionDate: '2026-01-31',
      newId: 't3',
    });
    expect(result.duplicated).toBe(true);
    expect(result.tasks).toHaveLength(2);
  });
});
