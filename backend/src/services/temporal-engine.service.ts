export type TemporalEvent = {
  id: string;
  occurredAt: string;
  entity: string;
  eventType: string;
  status: string;
  value: Record<string, unknown>;
  encounterId: string;
  confidence: number | null;
};

/** Deterministic chronological ordering (oldest → newest). Stable by id. */
export function orderEventsChronologically<T extends TemporalEvent>(
  events: T[],
): T[] {
  return [...events].sort((a, b) => {
    const timeDiff =
      new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.id.localeCompare(b.id);
  });
}

export function groupTimelineByDate<T extends TemporalEvent>(events: T[]) {
  const ordered = orderEventsChronologically(events);
  const groups = new Map<string, T[]>();

  for (const event of ordered) {
    const day = event.occurredAt.slice(0, 10);
    const list = groups.get(day) ?? [];
    list.push(event);
    groups.set(day, list);
  }

  return [...groups.entries()].map(([date, items]) => ({
    date,
    events: items,
  }));
}
