import { mock } from "bun:test";

export const getBrightnessAsyncMock = mock(() => Promise.resolve(0.5));
export const setBrightnessAsyncMock = mock(() => Promise.resolve());

export type ExpoBrightnessMocks = {
  getBrightnessAsync: typeof getBrightnessAsyncMock;
  setBrightnessAsync: typeof setBrightnessAsyncMock;
};

export const expoBrightnessMocks: ExpoBrightnessMocks = {
  getBrightnessAsync: getBrightnessAsyncMock,
  setBrightnessAsync: setBrightnessAsyncMock,
};

export function getExpoBrightnessMocks(): ExpoBrightnessMocks {
  return (
    globalThis as typeof globalThis & {
      __expoBrightnessMocks: ExpoBrightnessMocks;
    }
  ).__expoBrightnessMocks;
}
