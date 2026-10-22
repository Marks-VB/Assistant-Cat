// SPDX-License-Identifier: AGPL-3.0-or-later
// Agendamento de lembretes de compromissos: nativo (Capacitor) e fallback web.

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { CalendarEvent } from '../types';

const CHANNEL_ID = 'compromissos';
const MAX_NOTIFICATION_ID = 2_147_483_000;
const MAX_TIMEOUT = 2_147_483_000;

const webTimers = new Map<string, ReturnType<typeof setTimeout>>();
let channelReady: Promise<void> | null = null;

/** ID numérico estável exigido pelo Android, derivado do UUID do evento. */
export function reminderNotificationId(eventId: string): number {
  let hash = 0;
  for (let i = 0; i < eventId.length; i += 1) {
    hash = (hash * 31 + eventId.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % MAX_NOTIFICATION_ID) + 1;
}

function eventStart(event: CalendarEvent): Date | null {
  if (!event.date || !event.time) return null;
  const [year, month, day] = event.date.split('-').map(Number);
  const [hours, minutes] = event.time.split(':').map(Number);
  if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function reminderTarget(event: CalendarEvent): { at: Date; minutes: number } | null {
  const minutes = event.reminderMinutes;
  if (minutes == null || minutes <= 0) return null;
  const start = eventStart(event);
  if (!start) return null;
  const at = new Date(start.getTime() - minutes * 60_000);
  if (at.getTime() <= Date.now() + 1_000) return null;
  return { at, minutes };
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const current = await LocalNotifications.checkPermissions();
      if (current.display === 'granted') return true;
      if (current.display === 'denied') return false;
      const requested = await LocalNotifications.requestPermissions();
      return requested.display === 'granted';
    } catch (err) {
      console.warn('[Lembretes] Falha ao verificar permissão nativa:', err);
      return false;
    }
  }

  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

function ensureChannel(): Promise<void> {
  if (!channelReady) {
    channelReady = LocalNotifications
      .createChannel({
        id: CHANNEL_ID,
        name: 'Lembretes de compromissos',
        description: 'Avisos enviados antes do início dos compromissos da agenda.',
        importance: 5,
        visibility: 1,
        vibration: true
      })
      .catch((err) => {
        console.warn('[Lembretes] Não foi possível criar o canal Android:', err);
      });
  }
  return channelReady;
}

function clearWebTimer(eventId: string) {
  const timer = webTimers.get(eventId);
  if (timer) {
    clearTimeout(timer);
    webTimers.delete(eventId);
  }
}

/** Reagenda todos os lembretes. Também remove os que ficaram no passado ou foram desativados. */
export async function syncEventReminders(events: CalendarEvent[]): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const ids = events.map((event) => reminderNotificationId(event.id));
    if (ids.length) {
      try {
        await LocalNotifications.cancel({
          notifications: ids.map((id) => ({ id }))
        });
      } catch (err) {
        console.warn('[Lembretes] Falha ao cancelar lembretes antigos:', err);
      }
    }

    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== 'granted') return;

    const notifications = events.flatMap((event) => {
      const target = reminderTarget(event);
      if (!target) return [];
      const title = event.title.length > 80 ? `${event.title.slice(0, 77)}…` : event.title;
      return [{
        id: reminderNotificationId(event.id),
        title: `Em ${target.minutes} min: ${title}`,
        body: `${event.time} · ${event.date}`,
        channelId: CHANNEL_ID,
        smallIcon: 'ic_stat_notify',
        autoCancel: true,
        schedule: {
          at: target.at,
          allowWhileIdle: true
        }
      }];
    });

    if (!notifications.length) return;

    await ensureChannel();
    try {
      await LocalNotifications.schedule({ notifications });
    } catch (err) {
      console.warn('[Lembretes] Falha ao agendar notificações:', err);
    }
    return;
  }

  // Web: agenda apenas enquanto a aba estiver aberta.
  for (const event of events) clearWebTimer(event.id);
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

  for (const event of events) {
    const target = reminderTarget(event);
    if (!target) continue;
    const delay = target.at.getTime() - Date.now();
    if (delay <= 0 || delay > MAX_TIMEOUT) continue;

    const timer = setTimeout(() => {
      webTimers.delete(event.id);
      try {
        new Notification(`Em ${target.minutes} min: ${event.title}`, {
          body: `${event.time} · ${event.date}`,
          tag: `compromisso-${event.id}`
        });
      } catch (err) {
        console.warn('[Lembretes] Falha ao exibir notificação web:', err);
      }
    }, delay);

    webTimers.set(event.id, timer);
  }
}

export async function cancelEventReminder(eventId: string): Promise<void> {
  clearWebTimer(eventId);
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: reminderNotificationId(eventId) }]
    });
  } catch (err) {
    console.warn('[Lembretes] Falha ao cancelar lembrete:', err);
  }
}
