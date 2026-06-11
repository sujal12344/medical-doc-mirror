import { Path2D } from "@napi-rs/canvas";

if (typeof global !== "undefined") {
  (global as any).Path2D = Path2D;
}
if (typeof globalThis !== "undefined") {
  (globalThis as any).Path2D = Path2D;
}
