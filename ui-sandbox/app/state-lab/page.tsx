'use client';

import { useEffect, useState } from 'react';
import ApiErrorNotice from '@/components/ApiErrorNotice';
import { api, resetSandboxData } from '@/lib-ui/api-client';
import type { ApiErrorCode, ApiResult } from '@/lib-ui/api-client';

type ErrorCase = {
  code: Exclude<ApiErrorCode, 'network'>;
  title: string;
  call: string;
  run: () => Promise<ApiResult<unknown>>;
};

const CASES: ErrorCase[] = [
  {
    code: 401,
    title: '401 — not signed in',
    call: 'api.getMe({ forceError: 401 })',
    run: () => api.getMe({ forceError: 401 }),
  },
  {
    code: 403,
    title: '403 — not permitted (expected authorization outcome)',
    call: "api.getRequest('r-001', { forceError: 403 })",
    run: () => api.getRequest('r-001', { forceError: 403 }),
  },
  {
    code: 404,
    title: '404 — not found or not visible',
    call: "api.getRequest('r-001', { forceError: 404 })",
    run: () => api.getRequest('r-001', { forceError: 404 }),
  },
  {
    code: 409,
    title: '409 — duplicate vote or terminal request',
    call: "api.submitDecision('r-001', { roleSlot: 'senior_a', vote: 'approve' }, { forceError: 409 })",
    run: () =>
      api.submitDecision(
        'r-001',
        { roleSlot: 'senior_a', vote: 'approve' },
        { forceError: 409 },
      ),
  },
  {
    code: 422,
    title: '422 — invalid input',
    call: 'api.createRequest({ ...invalid }, { forceError: 422 })',
    run: () =>
      api.createRequest(
        {
          title: '',
          amountMinor: -1,
          currency: 'USD',
          category: '',
          businessReason: '',
        },
        { forceError: 422 },
      ),
  },
];

async function runCases() {
  return Promise.all(
    CASES.map(async (testCase) => {
      const result = await testCase.run();
      return [testCase.code, result] as const;
    }),
  );
}

export default function StateLabPage() {
  const [results, setResults] = useState<Record<number, ApiResult<unknown>>>({});
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let alive = true;

    void runCases().then((entries) => {
      if (alive) setResults(Object.fromEntries(entries));
    });

    return () => {
      alive = false;
    };
  }, []);

  async function rerun() {
    setRunning(true);
    const entries = await runCases();
    setResults(Object.fromEntries(entries));
    setRunning(false);
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Error-state lab</p>
          <h1>Five failure states, four deliberately different treatments</h1>
          <p className="lede">
            Each card below calls the fixture adapter with a sandbox-only{' '}
            <code>forceError</code> option. The adapter returns a typed failure, and the same
            shared <code>ApiErrorNotice</code> renders it. No normal screen passes{' '}
            <code>forceError</code>.
          </p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => void rerun()} disabled={running}>
          {running ? 'Running…' : 'Re-run all'}
        </button>
      </div>

      <div className="sandbox-note">
        <strong>Why these are distinct.</strong> 403 is a normal authorization outcome, not a
        crash. 404 deliberately does not reveal whether the object exists. 409 means a
        duplicate vote or a terminal request. 422 is a validation failure. The UI copy and
        tone are different for each; none of them is a silent empty state.
      </div>

      <div className="state-lab-grid">
        {CASES.map((testCase) => {
          const result = results[testCase.code];

          return (
            <section className="state-case" key={testCase.code}>
              <div className="state-case-head">
                <span className="code-big">{testCase.code}</span>
                <div>
                  <h2>{testCase.title}</h2>
                  <p>
                    <code>{testCase.call}</code>
                  </p>
                </div>
              </div>

              {!result ? (
                <div className="loading-stack" aria-live="polite">
                  <div className="skeleton" />
                </div>
              ) : result.ok ? (
                <div className="form-errors" role="alert">
                  Unexpected success. The forced-error switch did not fire.
                </div>
              ) : (
                <ApiErrorNotice error={result} context="Forced fixture error" />
              )}
            </section>
          );
        })}
      </div>

      <section className="card state-lab-notes">
        <h2>How to read this page</h2>
        <ul>
          <li>
            <strong>401</strong> is about the session. The real app gets a TideCloak token; the
            sandbox has no login.
          </li>
          <li>
            <strong>403</strong> is a normal permission outcome. The server refuses; the UI
            does not enforce eligibility.
          </li>
          <li>
            <strong>404</strong> is used for missing objects and for objects the server does
            not disclose to this identity.
          </li>
          <li>
            <strong>409</strong> covers one-vote-per-reviewer and terminal requests. A denial
            is terminal.
          </li>
          <li>
            <strong>422</strong> is a validation rejection. Client checks are convenience
            only.
          </li>
        </ul>
        <div className="state-lab-actions">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              resetSandboxData();
              void rerun();
            }}
          >
            Reset fixture store and re-run
          </button>
          <span className="muted">
            The reset only touches the in-memory fixture store.
          </span>
        </div>
      </section>
    </div>
  );
}
