import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToString } from "react-dom/server";

import * as Sentry from "@sentry/remix";


Sentry.init({
  dsn: "https://940c90fa8abf4320b431423f5aca3090:59cec93c1c56457caf2871a854b80b40@o1061328.ingest.sentry.io/4504822658891776",
  tracesSampleRate: 1,
  integrations: [new Sentry.Integrations.Postgres()],
});

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const markup = renderToString(
    <RemixServer context={remixContext} url={request.url} />
  );

  responseHeaders.set("Content-Type", "text/html");

  return new Response("<!DOCTYPE html>" + markup, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
