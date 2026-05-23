import { mock } from "bun:test";
import React, { useEffect, useState } from "react";

type SheetComponent = React.ComponentType;

const sheetRegistry = new Map<string, SheetComponent>();
const sheetPayloads = new Map<string, unknown>();
let activeSheetId: string | null = null;
const listeners = new Set<() => void>();

function notifySheetChange() {
  for (const listener of listeners) {
    listener();
  }
}

function ActionSheet({ children }: { children?: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children);
}

function SheetProvider({ children }: { children?: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children);
}

function ActiveSheets() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((value) => value + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (activeSheetId == null) {
    return null;
  }

  const Sheet = sheetRegistry.get(activeSheetId);
  if (Sheet == null) {
    return null;
  }

  return React.createElement(Sheet);
}

function SheetRegister({ sheets }: { sheets: Record<string, SheetComponent> }) {
  for (const [id, Sheet] of Object.entries(sheets)) {
    sheetRegistry.set(id, Sheet);
  }

  return React.createElement(ActiveSheets);
}

const SheetManager = {
  show: async <T>(id: string, options?: { payload?: T }) => {
    if (options?.payload !== undefined) {
      sheetPayloads.set(id, options.payload);
    }
    activeSheetId = id;
    notifySheetChange();
    return undefined;
  },
  hide: async (id?: string) => {
    if (id == null || activeSheetId === id) {
      activeSheetId = null;
      notifySheetChange();
    }
  },
};

function useSheetPayload<SheetId extends string>(id?: SheetId) {
  const sheetId = id ?? activeSheetId;
  if (sheetId == null) {
    return undefined;
  }
  return sheetPayloads.get(sheetId) as Sheets[SheetId]["payload"] | undefined;
}

function useSheetRef() {
  return {
    current: {
      hide: () => {
        void SheetManager.hide();
      },
    },
  };
}

type Sheets = Record<string, { payload?: unknown }>;

mock.module("react-native-actions-sheet", () => ({
  __esModule: true,
  default: ActionSheet,
  SheetProvider,
  SheetRegister,
  SheetManager,
  useSheetPayload,
  useSheetRef,
}));
