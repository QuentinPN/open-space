// Who sits where. Seats are stable: someone already seated keeps their chair; newcomers take a free one.
export interface SeatRequest { id: string }

/**
 * Seats the first `seatCount` requests (the caller orders them by priority); the others get no seat. Free seats are
 * taken in the room's order, which spreads newcomers over it. `previous`: the seats people had before. `reserved`:
 * seats nobody gets (the one the user sits on).
 */
export function assignSeats(requests: readonly SeatRequest[], previous: ReadonlyMap<string, number>, seatCount: number, reserved: ReadonlySet<number> = new Set()): Map<string, number> {
  const admitted = requests.slice(0, seatCount - reserved.size);
  const seats = new Map<string, number>();
  const taken = new Set<number>(reserved);
  for (const { id } of admitted) {
    const seat = previous.get(id);
    if (seat === undefined || taken.has(seat)) continue;
    seats.set(id, seat);
    taken.add(seat);
  }
  let next = 0;
  for (const { id } of admitted) {
    if (seats.has(id)) continue;
    while (taken.has(next)) next++;
    seats.set(id, next);
    taken.add(next);
  }
  return seats;
}

/**
 * The seats the user put people on, as saved (localStorage, by room): those of a seat the room still has. Anything
 * else saved there (an older room's, a broken value) is left out. Both room styles.
 */
export function savedSeats(saved: unknown, seatCount: number): Map<string, number> {
  if (!saved || typeof saved !== 'object') return new Map();
  return new Map(Object.entries(saved).filter((entry): entry is [string, number] => Number.isInteger(entry[1]) && entry[1] >= 0 && entry[1] < seatCount));
}

/**
 * The seats kept by hand after a move: each one's seat now (`seated`), and those kept before for people not in the
 * room, unless someone now sits on theirs (one person per seat).
 */
export function keepSeats(kept: ReadonlyMap<string, number>, seated: ReadonlyMap<string, number>): Map<string, number> {
  const bySeat = new Map([...kept].map(([id, seat]) => [seat, id]));
  for (const [id, seat] of seated) bySeat.set(seat, id);
  return new Map([...bySeat].map(([seat, id]) => [id, seat]));
}
