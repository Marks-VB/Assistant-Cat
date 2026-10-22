// SPDX-License-Identifier: AGPL-3.0-or-later
// GatoDomain - Regras de Negócio Puras e Determinísticas para o Assistant Cat

import {
  CalendarEvent,
  Task,
  Memory,
  Proposal,
  AppState,
  WeeklyRecap,
  RepeatAfter,
  TrashItem
} from '../types';

export const clean = (s: string) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export function civilDate(now: Date | string = new Date(), timeZone = 'America/Sao_Paulo'): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date(now));
  const p = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function addMonths(iso: string, n: number): string {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7)) - 1;
  const d = Number(iso.slice(8, 10));
  const targetTotalMonths = y * 12 + m + Number(n);
  const targetYear = Math.floor(targetTotalMonths / 12);
  const targetMonth = ((targetTotalMonths % 12) + 12) % 12;
  const maxDays = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const finalDay = Math.min(d, maxDays);
  return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(finalDay).padStart(2, '0')}`;
}

export function validDate(s: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(s) &&
    !Number.isNaN(Date.parse(s + 'T12:00:00Z')) &&
    new Date(s + 'T12:00:00Z').toISOString().slice(0, 10) === s
  );
}

export function validateEvent(e: Partial<CalendarEvent>): string | null {
  if (!e || !String(e.title || '').trim()) return 'Informe o título.';
  if (!e.date || !validDate(e.date)) return 'Informe uma data válida.';
  if (e.recurrence && !['none', 'daily', 'weekly', 'monthly'].includes(e.recurrence)) return 'Recorrência inválida.';
  if (e.allDay) {
    if (e.endDate && (!validDate(e.endDate) || e.endDate < e.date))
      return 'A data final deve ser igual ou posterior à data inicial.';
    return null;
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time || '')) return 'Informe um horário válido.';
  if (!Number.isFinite(Number(e.duration)) || Number(e.duration) < 1 || Number(e.duration) > 1440)
    return 'Duração inválida.';
  return null;
}

export function eventOccursOn(e: CalendarEvent, targetDate: string): boolean {
  if (!e || !validDate(e.date) || !validDate(targetDate)) return false;
  if (targetDate < e.date) return false;
  const recurrence = e.recurrence || 'none';
  const span =
    e.allDay && e.endDate && e.endDate >= e.date
      ? Math.round((new Date(e.endDate + 'T12:00:00Z').getTime() - new Date(e.date + 'T12:00:00Z').getTime()) / 86400000)
      : 0;

  if (recurrence === 'none') {
    if (e.allDay) {
      const end = e.endDate || e.date;
      return e.date <= targetDate && targetDate <= end;
    }
    return e.date === targetDate;
  }
  if (recurrence === 'daily') return true;
  if (recurrence === 'weekly') {
    const diffDays = Math.round(
      (new Date(targetDate + 'T12:00:00Z').getTime() - new Date(e.date + 'T12:00:00Z').getTime()) / 86400000
    );
    return diffDays % 7 <= span;
  }
  if (recurrence === 'monthly') {
    const dayS = Number(e.date.slice(8, 10));
    const yearT = Number(targetDate.slice(0, 4));
    const monthT = Number(targetDate.slice(5, 7));
    const dayT = Number(targetDate.slice(8, 10));
    const maxDays = new Date(Date.UTC(yearT, monthT, 0)).getUTCDate();
    const startDay = Math.min(dayS, maxDays);
    const endDay = Math.min(dayS + span, maxDays);
    return dayT >= startDay && dayT <= endDay;
  }
  return false;
}

export function conflicts(events: CalendarEvent[], e: CalendarEvent): CalendarEvent[] {
  if (e.allDay) return [];
  const start = (x: CalendarEvent) => Date.parse(`${x.date}T${x.time}:00Z`);
  return events.filter(
    x =>
      !x.allDay &&
      x.id !== e.id &&
      start(x) < start(e) + Number(e.duration) * 60000 &&
      start(e) < start(x) + Number(x.duration) * 60000
  );
}

export function calculateNextDueDate(completionDate: string, repeatAfter: RepeatAfter): string {
  if (!validDate(completionDate)) throw Error('Data de conclusão inválida.');
  if (!repeatAfter || !['days', 'weeks', 'months'].includes(repeatAfter.unit))
    throw Error('Unidade de repetição inválida.');
  const amount = Number(repeatAfter.amount);
  if (!Number.isFinite(amount) || amount < 1) throw Error('Intervalo de repetição inválido.');
  if (repeatAfter.unit === 'days') return addDays(completionDate, amount);
  if (repeatAfter.unit === 'weeks') return addDays(completionDate, amount * 7);
  if (repeatAfter.unit === 'months') return addMonths(completionDate, amount);
  throw Error('Unidade de repetição inválida.');
}

export function completeTaskWithRepeat(
  tasks: Task[],
  taskId: string,
  options: {
    completionDate?: string;
    now?: Date;
    timeZone?: string;
    newId?: string;
    generateSubtaskId?: (sub: { id: string; title: string }, i: number) => string;
  } = {}
) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return { tasks, completedTask: null, nextTask: null, duplicated: false };
  const completionDate =
    options.completionDate || civilDate(options.now || new Date(), options.timeZone || 'America/Sao_Paulo');
  const seriesId = (task as any).seriesId || task.id;
  const completedTask: Task = { ...task, done: true, completedAt: completionDate };

  if (!task.repeatAfter || !task.repeatAfter.unit || !task.repeatAfter.amount) {
    const nextTasks = tasks.map(t => (t.id === taskId ? completedTask : t));
    return { tasks: nextTasks, completedTask, nextTask: null, duplicated: false };
  }

  const existingPending = tasks.some(
    t => t.id !== taskId && ((t as any).seriesId === seriesId || t.id === (task as any).nextTaskId) && !t.done
  );
  if (existingPending) {
    const nextTasks = tasks.map(t => (t.id === taskId ? completedTask : t));
    return { tasks: nextTasks, completedTask, nextTask: null, duplicated: true };
  }

  const nextDue = calculateNextDueDate(completionDate, task.repeatAfter);
  const nextId = options.newId || 'task-' + Math.random().toString(36).slice(2, 10);
  const nextTask: Task = {
    id: nextId,
    title: task.title,
    due: nextDue,
    priority: task.priority || 'normal',
    repeatAfter: { unit: task.repeatAfter.unit, amount: Number(task.repeatAfter.amount) },
    done: false,
    subtasks: Array.isArray(task.subtasks)
      ? task.subtasks.map((s, i) => ({
          id: options.generateSubtaskId ? options.generateSubtaskId(s, i) : s.id + '-next',
          title: s.title,
          done: false
        }))
      : []
  };

  (completedTask as any).seriesId = seriesId;
  (completedTask as any).nextTaskId = nextId;
  (nextTask as any).seriesId = seriesId;

  const nextTasks = tasks.map(t => (t.id === taskId ? completedTask : t)).concat(nextTask);
  return { tasks: nextTasks, completedTask, nextTask, duplicated: false };
}

export function searchItems(
  state: AppState,
  query: string,
  filters: { type?: 'all' | 'event' | 'task'; status?: 'all' | 'pending' | 'done' } = {}
) {
  const q = clean(query).trim();
  const type = filters.type || 'all';
  const status = filters.status || 'all';
  const results: any[] = [];

  if (type === 'all' || type === 'event') {
    for (const e of state.events || []) {
      const text = clean(`${e.title} ${e.notes || ''} ${e.date || ''} ${e.endDate || ''} ${e.recurrence || ''}`);
      if (!q || text.includes(q)) results.push({ ...e, kind: 'event' });
    }
  }
  if (type === 'all' || type === 'task') {
    for (const t of state.tasks || []) {
      if (status === 'pending' && t.done) continue;
      if (status === 'done' && !t.done) continue;
      const repText = t.repeatAfter ? ` repete ${t.repeatAfter.amount} ${t.repeatAfter.unit}` : '';
      const text = clean(`${t.title} ${t.due || ''}${repText}`);
      if (!q || text.includes(q)) results.push({ ...t, kind: 'task' });
    }
  }
  return results;
}

export function getWeekRange(refDate: string) {
  const d = new Date(refDate + 'T12:00:00Z');
  const day = d.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = addDays(refDate, diffToMonday);
  const end = addDays(start, 6);
  const days: string[] = [];
  for (let i = 0; i < 7; i++) days.push(addDays(start, i));
  return { start, end, days };
}

export function categorizeItem(title: string, notes = ''): string {
  const t = clean(`${title || ''} ${notes || ''}`);
  if (/\b(reuniao|reunioes|projeto|trabalho|sprint|review|cliente|alinhamento|apresentacao|entrega|demo|planejamento|call|sync)\b/.test(t))
    return 'Trabalho';
  if (/\b(saude|medico|medica|consulta|dentista|exame|terapia|remedio|treino|academia|corrida|exercicio|caminhada)\b/.test(t))
    return 'Saúde e Bem-estar';
  if (/\b(estudo|estudos|aula|curso|leitura|livro|oficina|workshop|faculdade|pos|certificacao)\b/.test(t))
    return 'Foco e Estudos';
  if (/\b(festa|aniversario|jantar|almoco|cinema|show|encontro|cafe|amigos|lazer|happy hour)\b/.test(t))
    return 'Social e Lazer';
  if (/\b(mercado|compras|casa|faxina|manutencao|pagamento|banco|conta|gato|pet|veterinario|racao)\b/.test(t))
    return 'Pessoal e Casa';
  return 'Geral';
}

export function calculateWeeklyRecap(state: AppState, referenceDate?: string | Date): WeeklyRecap | null {
  if (!state) return null;
  const refDate = referenceDate
    ? typeof referenceDate === 'string' && validDate(referenceDate)
      ? referenceDate
      : civilDate(referenceDate)
    : civilDate();
  const { start, end, days } = getWeekRange(refDate);

  const events = state.events || [];
  let totalOccurrences = 0,
    totalMinutes = 0,
    allDayCount = 0;
  const categoriesMap: Record<string, number> = {};
  const uniqueEventIds = new Set<string>();

  for (const e of events) {
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      if (eventOccursOn(e, day)) {
        uniqueEventIds.add(e.id);
        const isAllDay = Boolean(e.allDay);
        if (isAllDay) allDayCount++;
        const duration = Number(e.duration) || (isAllDay ? 1440 : 60);
        totalOccurrences++;
        totalMinutes += duration;
        const cat = categorizeItem(e.title, e.notes);
        categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;
      }
    }
  }
  const totalHours = String(Math.round((totalMinutes / 60) * 10) / 10);

  const allTasks = state.tasks || [];
  let weekTasks = allTasks.filter(t => {
    if (t.due && t.due >= start && t.due <= end) return true;
    if (t.completedAt && t.completedAt >= start && t.completedAt <= end) return true;
    return false;
  });
  if (weekTasks.length === 0 && allTasks.length > 0 && !allTasks.some(t => t.due)) {
    weekTasks = allTasks;
  }

  const completedTasks = weekTasks.filter(t => t.done).length;
  const pendingTasks = weekTasks.filter(t => !t.done).length;
  const totalTasks = weekTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  let totalSubtasks = 0,
    completedSubtasks = 0;
  for (const t of weekTasks) {
    if (Array.isArray(t.subtasks)) {
      totalSubtasks += t.subtasks.length;
      completedSubtasks += t.subtasks.filter(s => s.done).length;
    }
  }

  let productivityLevel = 'tranquila';
  let productivityLabel = 'Semana tranquila';
  let catMotivation = 'Uma semana com bastante espaço livre para respirar e planejar com calma.';

  if (completedTasks > 0 && pendingTasks === 0 && totalOccurrences > 0) {
    productivityLevel = 'excelente';
    productivityLabel = 'Conclusão impecável';
    catMotivation = 'Todas as tarefas planejadas foram concluídas e sua agenda foi cumprida com excelência!';
  } else if (completionRate >= 70 || (completedTasks >= 3 && completionRate >= 50)) {
    productivityLevel = 'alta';
    productivityLabel = 'Semana muito produtiva';
    catMotivation = 'Você teve um ritmo admirável esta semana. Celebre cada conquista alcançada!';
  } else if (completedTasks > 0 || (totalOccurrences >= 3 && completionRate >= 30)) {
    productivityLevel = 'equilibrada';
    productivityLabel = 'Ritmo constante';
    catMotivation = 'Passo a passo você cuidou do que importava. Um ótimo progresso com equilíbrio e leveza!';
  } else if (pendingTasks > 0) {
    productivityLevel = 'em_andamento';
    productivityLabel = 'Foco em andamento';
    catMotivation = 'Sem pressa: cada pequena ação conta. Escolha uma tarefa leve para começar o dia.';
  } else if (totalOccurrences > 0) {
    productivityLevel = 'agenda_ativa';
    productivityLabel = 'Agenda ativa';
    catMotivation = 'Sua agenda teve momentos bem marcados. Lembre-se de reservar pausas para recarregar!';
  }

  const assistantName = state.profile?.assistantName || 'Seu Gato Assistente';
  const sDate = start.split('-').reverse().slice(0, 2).join('/');
  const eDate = end.split('-').reverse().slice(0, 2).join('/');
  const year = end.slice(0, 4);
  const lines = [
    '🐾 Retrospectiva Semanal — Assistente Gato',
    `Período: ${sDate} a ${eDate}/${year}`,
    '',
    `📅 Agenda: ${totalOccurrences} compromisso(s) (${totalHours}h ocupadas)`,
    `✅ Afazeres: ${completedTasks} concluído(s), ${pendingTasks} pendente(s) (${completionRate}% de conclusão)`
  ];
  const catEntries = Object.entries(categoriesMap);
  if (catEntries.length > 0) {
    lines.push('', '📊 Distribuição de eventos:');
    for (const [cName, cCount] of catEntries) {
      lines.push(`  • ${cName}: ${cCount}`);
    }
  }
  if (totalSubtasks > 0) {
    lines.push('', `📌 Subtarefas: ${completedSubtasks}/${totalSubtasks} concluídas`);
  }
  lines.push('', `✨ Produtividade: ${productivityLabel}`, `🐱 ${assistantName} diz: “${catMotivation}”`);

  return {
    week: { start, end },
    events: {
      total: totalOccurrences,
      totalMinutes,
      totalHours,
      categories: categoriesMap
    },
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      completionRate,
      subtasks: { total: totalSubtasks, completed: completedSubtasks }
    },
    productivity: {
      level: productivityLevel,
      label: productivityLabel,
      message: catMotivation
    },
    summaryText: lines.join('\n')
  };
}
