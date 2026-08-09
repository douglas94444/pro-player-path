const REMINDER_KEY = "jogador-pro-streak-reminder";

export async function requestStreakReminderPermission(): Promise<NotificationPermission | "unsupported"> {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function scheduleStreakReminder(nome: string, streak: number) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    localStorage.setItem(
      REMINDER_KEY,
      JSON.stringify({ nome, streak, scheduledAt: Date.now(), hour: 20 }),
    );
  } catch {
    /* ignore */
  }

  // Dispara um lembrete se o usuário ainda estiver com o app aberto no horário alvo,
  // e também registra intent para o próximo retorno ao app.
  const now = new Date();
  const target = new Date();
  target.setHours(20, 0, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  const delay = Math.min(target.getTime() - now.getTime(), 2147483647);

  window.setTimeout(() => {
    try {
      new Notification("Streak em risco 🔥", {
        body: `${nome}, treine hoje e mantenha ${Math.max(streak, 1)} dia(s) seguidos.`,
        tag: "streak-reminder",
      });
    } catch {
      /* ignore */
    }
  }, delay);
}

export function maybeNotifyStreakOnOpen(nome: string, streak: number, treinouHoje: boolean) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted" || treinouHoje) return;
  const hour = new Date().getHours();
  if (hour < 18) return;

  const dayKey = `streak-nudge-${new Date().toISOString().slice(0, 10)}`;
  try {
    if (sessionStorage.getItem(dayKey)) return;
    sessionStorage.setItem(dayKey, "1");
  } catch {
    return;
  }

  try {
    new Notification("Não quebre a sequência", {
      body: streak > 0 ? `${nome}, seu streak de ${streak} dia(s) precisa de você hoje.` : `${nome}, bora treinar hoje?`,
      tag: "streak-nudge",
    });
  } catch {
    /* ignore */
  }
}
