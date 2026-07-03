import type { IncomingMessage, ServerResponse } from "http";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  (res as any).setHeader("Content-Type", "application/json");
  (res as any).statusCode = 200;
  (res as any).end(JSON.stringify([{ id: "1", name: "Raw handler works!" }]));
}
