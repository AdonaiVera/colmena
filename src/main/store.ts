import Store from "electron-store";
import type { PersistedTab } from "../shared/types";

interface StoreSchema {
  tabs: PersistedTab[];
}

const store = new Store<StoreSchema>({
  name: "colmena-sessions",
  defaults: {
    tabs: [],
  },
});

export function saveTabs(tabs: PersistedTab[]): void {
  store.set("tabs", tabs);
}

export function loadTabs(): PersistedTab[] {
  return store.get("tabs", []);
}
