// Whether Nebula Raid's window is open (src/command/ArcadeWindow.tsx): the cozy break room's arcade cabinet opens it.
import { create } from 'zustand';

export const useArcade = create<{ open: boolean }>(() => ({ open: false }));

export const openArcade = () => useArcade.setState({ open: true });
export const closeArcade = () => useArcade.setState({ open: false });
