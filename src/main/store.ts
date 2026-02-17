import Store from "electron-store";

import type { PersistedTab } from "../shared/types";

interface StoreSchema {
  tabs: PersistedTab[];
  soundEnabled: boolean;
}

const store = new Store<StoreSchema>({
  name: "colmena-sessions",
  defaults: {
    tabs: [],
    soundEnabled: true,
  },
});

export function saveTabs(tabs: PersistedTab[]): void {
  store.set("tabs", tabs);
}

export function loadTabs(): PersistedTab[] {
  return store.get("tabs", []);
}

export function getSoundEnabled(): boolean {
  return store.get("soundEnabled", true);
}

export function setSoundEnabled(enabled: boolean): void {
  store.set("soundEnabled", enabled);
}
