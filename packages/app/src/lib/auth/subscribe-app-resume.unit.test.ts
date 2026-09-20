import { beforeEach, describe, expect, it, mock } from "bun:test";

import {
  clearAppStateMocks,
  emitAppStateChange,
  removeAppStateListenerMock,
} from "../../../test/mocks/react-native-app-state";
import { subscribeOnAppResume } from "./subscribe-app-resume";

describe("[Unit] subscribeOnAppResume", () => {
  const onResume = mock(() => {});

  beforeEach(() => {
    onResume.mockClear();
    clearAppStateMocks();
  });

  it("calls onResume when the app becomes active", () => {
    const unsubscribe = subscribeOnAppResume(onResume);

    emitAppStateChange("background");
    expect(onResume).not.toHaveBeenCalled();

    emitAppStateChange("active");
    expect(onResume).toHaveBeenCalledTimes(1);

    unsubscribe();
    expect(removeAppStateListenerMock).toHaveBeenCalledTimes(1);
  });
});
