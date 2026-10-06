# Frames and embedded player — Playwright and TypeScript

[Versão em português](README.md)

Tests against hosted [Test Pages, by Alan Richardson](https://testpages.eviltester.com/pages/embedded-pages/). The focus is working with separate documents on the same screen: iframes, a legacy frameset and a cross-origin podcast player.

## Run

Node.js 22.9 or later. CI uses Node 24 and Chromium.

```bash
cp .env.example .env
npm ci
npx playwright install chromium
npm run typecheck
npm test
```

On PowerShell, use `Copy-Item .env.example .env`. On Linux, install the browser with `npx playwright install --with-deps chromium`. No local application needs to be started.

`BASE_URL` selects Test Pages; `PODCAST_URL` identifies the iframe already embedded by the host. Process variables take precedence over `.env`. Changing a URL requires a target with the same contract; tests do not inject content or construct a replacement page.

## Scenarios

| Risk | Check |
| --- | --- |
| Interacting with the wrong document | Two iframes share the ID `alist`. Selection uses `src`; adding 12 + 7 changes only the interactive frame and preserves the sibling list and host. |
| Using stale context | Reloading the child frame and the host are separate scenarios. Both require initial state and a successful new interaction. |
| Mixing legacy regions | The frameset contains five frames. Tests verify the heading, list and last item in the three central regions. |
| Navigation staying inside a frame | A real `target="_top"` link exits the frameset. The next interaction uses the new page's iframes. |
| A visible player that does not play | A click starts the podcast; the final media response must be 200/206 with an audio content type. Time must advance, pause and continue after resuming. |
| A seek control that does nothing | The player's button advances approximately 15 seconds while keeping playback paused. |

`tests/frames.spec.ts` contains five scenarios; `tests/player.spec.ts` contains two. `frameLocator` scopes selection to the appropriate document and resolves it again after navigation. Tests do not retain element handles across reloads.

Player interactions use application buttons. Reading `HTMLAudioElement` checks time, pause and error state; it does not call `play()`, set `currentTime` or replace network responses. The real download redirects to a CDN: the test verifies the final response rather than treating the intermediate 302 as delivered audio.

## Gate and investigation

CI requires typecheck, passing tests and valid JUnit, with no skipped cases or empty report. `test.only` is forbidden in CI. No test retries, sleeps or mocked responses.

A host or audio-provider outage remains a failed run. Investigate navigation and media status first, then the frame/URL in the trace and the scenario expectation. Do not silently switch providers or treat a skipped test as working functionality.

Open **Actions → Tests → run → Summary** for counts and the gate decision. Artifact `test-results` includes JUnit, summary and HTML report; failures add screenshots and traces. Retention is seven days. Locally, `npm run report` opens the HTML. Generated output and `.env` are excluded from Git from the first commit.

## Limits and references

The iframe form is a JavaScript counter without persistence or a backend transaction. The frameset demonstrates a legacy integration technique, not a client system. The player is audio-only; video, DRM, advertising, autoplay and audio fidelity are not covered. The YouTube embed on the same page is outside the gate.

- [iFrames and counter](https://testpages.eviltester.com/pages/embedded-pages/iframes/)
- [Legacy frameset](https://testpages.eviltester.com/pages/embedded-pages/frames/)
- [Host with external content and podcast](https://testpages.eviltester.com/pages/embedded-pages/external-content/)
- [Interactive document served by the site](https://testpages.eviltester.com/frame-includes/iframe-interactive.html)

These are public practice environments. The suite uses one worker and a fresh session per scenario; it does not run load tests or modify other users' data.
