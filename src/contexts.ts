import type { App } from "obsidian";

import { createContext } from "react";

export const ObsidianAppContext = createContext<App | null>(null);
