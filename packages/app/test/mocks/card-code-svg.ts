import { mock } from "bun:test";
import React from "react";

mock.module("react-native-barcode-svg", () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement("Barcode", props),
}));

mock.module("react-native-qrcode-svg", () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement("QRCode", { testID: "qrcode", ...props }),
}));
