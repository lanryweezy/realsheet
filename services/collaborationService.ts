import { SelectionRange } from '../types';

export interface Presence {
  userId: string;
  userName: string;
  color: string;
  selection: SelectionRange | null;
  lastActive: number;
}

const CHANNEL_NAME = 'realsheet_collaboration';

export class CollaborationService {
  private channel: BroadcastChannel;
  private onPresenceUpdate: (presences: Presence[]) => void;
  private presences: Map<string, Presence> = new Map();
  private currentUser: Presence;

  constructor(userName: string, onPresenceUpdate: (presences: Presence[]) => void) {
    this.channel = new BroadcastChannel(CHANNEL_NAME);
    this.onPresenceUpdate = onPresenceUpdate;

    this.currentUser = {
      userId: Math.random().toString(36).substr(2, 9),
      userName,
      color: this.getRandomColor(),
      selection: null,
      lastActive: Date.now()
    };

    this.channel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'presence') {
        this.presences.set(payload.userId, payload);
        this.cleanupPresences();
        this.onPresenceUpdate(Array.from(this.presences.values()));
      }
    };

    // Broadcast initial presence
    this.broadcastPresence();

    // Periodically broadcast presence to keep alive
    setInterval(() => this.broadcastPresence(), 5000);
  }

  private getRandomColor() {
    const colors = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80', '#2dd4bf', '#22d3ee', '#38bdf8', '#818cf8', '#a78bfa', '#e879f9', '#f472b6'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  private cleanupPresences() {
    const now = Date.now();
    for (const [userId, presence] of this.presences.entries()) {
      if (now - presence.lastActive > 15000) {
        this.presences.delete(userId);
      }
    }
  }

  private broadcastPresence() {
    this.currentUser.lastActive = Date.now();
    this.channel.postMessage({ type: 'presence', payload: this.currentUser });
  }

  updateSelection(selection: SelectionRange | null) {
    this.currentUser.selection = selection;
    this.broadcastPresence();
  }

  disconnect() {
    this.channel.close();
  }
}
