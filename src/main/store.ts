import Store from "electron-store";

import type { PersistedTab, Group } from "../shared/types";
import { DEFAULT_GROUPS } from "../shared/types";

interface StoreSchema {
  tabs: PersistedTab[];
  soundEnabled: boolean;
  groups: Group[];
}

const store = new Store<StoreSchema>({
  name: "colmena-sessions",
  defaults: {
    tabs: [],
    soundEnabled: true,
    groups: DEFAULT_GROUPS,
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

export function loadGroups(): Group[] {
  return store.get("groups", DEFAULT_GROUPS);
}

export function saveGroups(groups: Group[]): void {
  store.set("groups", groups);
}
