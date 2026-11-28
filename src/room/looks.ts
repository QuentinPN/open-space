// Who wears which look in the rooms (both room styles): the user their own, an automaton its robot, a session or a
// sub-agent named like a crew member that member's, anyone else a look of their own, stable (chibi.ts lookOfStranger).
import { runOfPerson } from '../../shared/automata.ts';
import type { CrewMember } from '../../shared/protocol.ts';
import type { Look } from '../../shared/look.ts';
import { AUTOMATON_LOOK, DEFAULT_LOOK } from '../design/people-palette.ts';
import { lookOfStranger } from './chibi.ts';
import { PLAYER_ID } from './scene.ts';

/** `name`: the person's name in the room (a session's, a visitor's). */
export function crewLook(personId: string, name: string, crew: readonly CrewMember[]): Look {
  if (personId === PLAYER_ID) return crew.find((member) => member.self)?.look ?? DEFAULT_LOOK;
  // an automaton, and the runs it started (their faces on its tag): never a look of the crew
  if (runOfPerson(personId)) return AUTOMATON_LOOK;
  const member = crew.find((candidate) => !candidate.self && candidate.name === name);
  return member ? member.look ?? DEFAULT_LOOK : lookOfStranger(personId);
}
