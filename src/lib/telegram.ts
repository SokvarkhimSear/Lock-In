// Telegram Bot Configuration & Mini App WebApp SDK Integration
import { formatDueDateTimeICT, formatTime12h } from '../utils/timeEngine';

export interface TelegramRecipient {
  id: string;
  name: string;
}

/**
 * Safely resolves the Telegram Bot Token from environment variables:
 * - Vite/React frontend: import.meta.env.VITE_TELEGRAM_BOT_TOKEN
 * - Backend/serverless API routes: process.env.TELEGRAM_BOT_TOKEN
 */
export function getTelegramBotToken(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TELEGRAM_BOT_TOKEN) {
    return import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  }
  if (typeof process !== 'undefined' && process.env && process.env.TELEGRAM_BOT_TOKEN) {
    return process.env.TELEGRAM_BOT_TOKEN;
  }
  return '';
}

export const TELEGRAM_CONFIG = {
  get botToken(): string {
    return getTelegramBotToken();
  },
  userTelegramId: "2128817856",
  recipients: [
    { id: "2128817856", name: "Primary Account" },
    { id: "957660223", name: "Heng Huykeang" }
  ] as TelegramRecipient[],
  get apiUrl(): string {
    const token = getTelegramBotToken();
    return token ? `https://api.telegram.org/bot${token}/sendMessage` : '';
  }
};

// Global TypeScript declaration for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        initData: string;
        initDataUnsafe: Record<string, any>;
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

/**
 * Initialize the Telegram WebApp SDK when running inside Telegram
 */
export function initTelegramWebApp(): void {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    try {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      console.log('Telegram WebApp SDK successfully initialized and expanded');
    } catch (err) {
      console.warn('Could not initialize Telegram WebApp:', err);
    }
  }
}

/**
 * Trigger Haptic Feedback in the Telegram Mini App
 */
export function triggerHapticFeedback(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium'): void {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
    try {
      window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
    } catch (err) {
      console.debug('Haptic feedback not supported on this device/environment', err);
    }
  }
}

/**
 * Dispatches a message to all registered Telegram recipients using fetch()
 */
export async function sendTelegramMessage(text: string, parseMode: 'Markdown' | 'HTML' = 'Markdown'): Promise<boolean> {
  const token = TELEGRAM_CONFIG.botToken;
  const apiUrl = TELEGRAM_CONFIG.apiUrl;

  if (!token || !apiUrl) {
    console.warn(
      'Telegram alert skipped: Bot token not found. Please set VITE_TELEGRAM_BOT_TOKEN (client) or TELEGRAM_BOT_TOKEN (server) environment variable.'
    );
    return false;
  }

  const recipients = TELEGRAM_CONFIG.recipients;
  try {
    const results = await Promise.allSettled(
      recipients.map(async (recipient) => {
        const payload = {
          chat_id: recipient.id,
          text: text,
          parse_mode: parseMode
        };

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!data.ok) {
          console.warn(`Telegram API error sending to ${recipient.name} (${recipient.id}):`, data);
          return false;
        }
        return true;
      })
    );

    const hasSuccess = results.some(
      (res) => res.status === 'fulfilled' && res.value === true
    );
    return hasSuccess;
  } catch (error) {
    console.warn('Failed to send Telegram message:', error);
    return false;
  }
}

/**
 * Notification dispatched when an assignment is due or created
 */
export async function sendAssignmentTelegramReminder(
  action: 'added' | 'completed' | 'due_soon',
  title: string,
  courseCode: string,
  dueDate: string,
  dueTime?: string
): Promise<boolean> {
  const icon = action === 'completed' ? '✅' : action === 'due_soon' ? '⏳' : '📌';
  const actionText =
    action === 'completed'
      ? 'Assignment Completed'
      : action === 'due_soon'
      ? 'Assignment Due Soon'
      : 'New Assignment Added';

  // Format explicitly in Asia/Phnom_Penh (UTC+7)
  const formattedDue = formatDueDateTimeICT(dueDate, dueTime);

  const message = `${icon} *LockIn Notification: ${actionText}*\n\n` +
    `*Course:* ${courseCode}\n` +
    `*Title:* ${title}\n` +
    `*Deadline:* ${formattedDue}\n\n` +
    `_Sent via LockIn Telegram Integration_`;

  return sendTelegramMessage(message);
}

/**
 * Notification dispatched when a schedule block shifts or begins
 */
export async function sendScheduleShiftTelegramReminder(
  blockTitle: string,
  startTime: string,
  endTime: string,
  category: string
): Promise<boolean> {
  const message = `⚡ *LockIn Schedule Shift*\n\n` +
    `*Current Block:* ${blockTitle}\n` +
    `*Time:* ${startTime} - ${endTime}\n` +
    `*Category:* ${category.toUpperCase()}\n\n` +
    `_Locked in. Eliminate distractions and execute._`;

  return sendTelegramMessage(message);
}

/**
 * 1-Hour Pre-Deadline Alert dispatched when an assignment is due in 1 hour.
 * Format: "⚠️ *UPCOMING DEADLINE ALERT*\n\nYour task *[Assignment Name]* is due in 1 hour (at [Exact Time])!\n\nLock in now!"
 */
export async function sendOneHourPreDeadlineAlert(
  assignmentTitle: string,
  dueTime: string
): Promise<boolean> {
  const displayTime = formatTime12h(dueTime) || dueTime;
  const message =
    `⚠️ *UPCOMING DEADLINE ALERT*\n\n` +
    `Your task *${assignmentTitle}* is due in 1 hour (at ${displayTime})!\n\n` +
    `Lock in now!`;

  return sendTelegramMessage(message);
}

/**
 * 6:55 AM Morning Workout Telegram Ping (Mon – Fri)
 * User requested: "🏋️ WORKOUT TIME - Lock in for your 40-min session!"
 */
export async function sendWorkoutTelegramPing(): Promise<boolean> {
  const message =
    `🏋️ *WORKOUT TIME - Lock in for your 40-min session!*\n\n` +
    `*Time:* 07:00 AM – 07:40 AM\n` +
    `*Focus:* Strength, Cardio & Mobility\n` +
    `*Next:* 07:40 AM Shower & Quick Breakfast\n\n` +
    `_Locked in. Hydrate, focus, and dominate the morning!_`;

  return sendTelegramMessage(message);
}


