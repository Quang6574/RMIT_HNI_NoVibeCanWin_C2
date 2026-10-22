import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Decision, RoleSlot, SpendRequest } from '../types/contract.ts';
import { applyDecision, canView, HttpError, parseRequest, parseDecision, validateReviewers } from './rules.ts';
import type { Actor } from './rules.ts';

type RequestRow = Omit<SpendRequest, 'decisions' | 'assignedReviewers'> & Record<RoleSlot, string>;
const selectRequest = `SELECT id, title, amount_minor AS amountMinor, currency, category,
  business_reason AS businessReason, requester_sub AS requesterSub, created_at AS createdAt,
  senior_a, senior_b, ceo, status FROM requests`;

export class SpendStore {
  db: DatabaseSync;
  constructor(path: string) {
    if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY, title TEXT NOT NULL, amount_minor INTEGER NOT NULL CHECK(amount_minor BETWEEN 1 AND 100000000),
        currency TEXT NOT NULL CHECK(currency='USD'), category TEXT NOT NULL, business_reason TEXT NOT NULL,
        requester_sub TEXT NOT NULL, created_at TEXT NOT NULL,
        senior_a TEXT NOT NULL, senior_b TEXT NOT NULL, ceo TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending','approved','denied')),
        CHECK(senior_a<>senior_b AND senior_a<>ceo AND senior_b<>ceo),
        CHECK(requester_sub<>senior_a AND requester_sub<>senior_b AND requester_sub<>ceo)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS decisions (
        request_id TEXT NOT NULL REFERENCES requests(id), reviewer_sub TEXT NOT NULL,
        role_slot TEXT NOT NULL CHECK(role_slot IN ('senior_a','senior_b','ceo')),
        vote TEXT NOT NULL CHECK(vote IN ('approve','reject')), comment TEXT,
        decided_at TEXT NOT NULL,
        UNIQUE(request_id,reviewer_sub), UNIQUE(request_id,role_slot)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS audit_events (
        id INTEGER PRIMARY KEY, happened_at TEXT NOT NULL, actor_sub TEXT NOT NULL,
        request_id TEXT NOT NULL, action TEXT NOT NULL, outcome TEXT NOT NULL
      ) STRICT;`);
  }
  close() { this.db.close(); }
  private transaction<T>(operation: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = operation();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }
  private audit(actor: Actor, id: string, action: string, outcome: string) {
    this.db.prepare('INSERT INTO audit_events(happened_at,actor_sub,request_id,action,outcome) VALUES(?,?,?,?,?)')
      .run(new Date().toISOString(), actor.sub, id, action, outcome);
  }
  private load(id: string): SpendRequest | null {
    const row = this.db.prepare(`${selectRequest} WHERE id=?`).get(id) as RequestRow | undefined;
    if (!row) return null;
    const { senior_a, senior_b, ceo, ...request } = row;
    const rows = this.db.prepare(`SELECT request_id AS requestId, reviewer_sub AS reviewerSub,
      role_slot AS roleSlot, vote, comment, decided_at AS decidedAt FROM decisions
      WHERE request_id=? ORDER BY rowid`).all(id) as unknown as (Decision & { comment: string | null })[];
    const decisions: Decision[] = rows.map(({ comment, ...decision }) => ({ ...decision, ...(comment === null ? {} : { comment }) }));
    return { ...request, assignedReviewers: { senior_a, senior_b, ceo }, decisions };
  }
  get(id: string, actor: Actor): SpendRequest {
    const request = this.load(id);
    if (!request || !canView(request, actor)) throw new HttpError(404, 'Request not found or not visible.');
    return request;
  }
  list(actor: Actor): SpendRequest[] {
    // shortcut: a single demo workspace scans its small queue; add scoped SQL pagination when request volume grows.
    return this.db.prepare('SELECT id FROM requests ORDER BY created_at DESC, id').all()
      .map(row => this.load(row.id as string)!).filter(request => canView(request, actor));
  }
  create(actor: Actor, body: unknown, reviewers: Record<RoleSlot, string>): SpendRequest {
    if (!actor.roles.includes('spend_requester')) throw new HttpError(403, 'The verified spend_requester role is required.');
    const input = parseRequest(body);
    validateReviewers(reviewers);
    if (Object.values(reviewers).includes(actor.sub)) throw new HttpError(403, 'The requester must differ from all three configured reviewers.');
    const request: SpendRequest = { ...input, id: randomUUID(), requesterSub: actor.sub, createdAt: new Date().toISOString(), assignedReviewers: { ...reviewers }, decisions: [], status: 'pending' };
    return this.transaction(() => {
      this.db.prepare(`INSERT INTO requests(id,title,amount_minor,currency,category,business_reason,requester_sub,created_at,senior_a,senior_b,ceo,status)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,'pending')`).run(request.id, request.title, request.amountMinor, request.currency, request.category, request.businessReason,
          actor.sub, request.createdAt, reviewers.senior_a, reviewers.senior_b, reviewers.ceo);
      this.audit(actor, request.id, 'request.created', 'pending');
      return request;
    });
  }
  decide(id: string, actor: Actor, body: unknown): { status: SpendRequest['status']; request: SpendRequest } {
    const input = parseDecision(body);
    try {
      return this.transaction(() => {
        const current = this.load(id);
        if (!current) throw new HttpError(404, 'Request not found.');
        const request = applyDecision(current, actor, input);
        const decision = request.decisions.at(-1)!;
        this.db.prepare('INSERT INTO decisions(request_id,reviewer_sub,role_slot,vote,comment,decided_at) VALUES(?,?,?,?,?,?)')
          .run(id, actor.sub, input.roleSlot, input.vote, input.comment ?? null, decision.decidedAt);
        this.db.prepare('UPDATE requests SET status=? WHERE id=?').run(request.status, id);
        this.audit(actor, id, 'decision.recorded', input.vote);
        return { status: request.status, request };
      });
    } catch (error) {
      if (error instanceof HttpError) this.audit(actor, id, 'decision.denied', String(error.status));
      throw error;
    }
  }
}

const globalStore = globalThis as typeof globalThis & { spendStore?: SpendStore };
export function getStore(): SpendStore {
  return globalStore.spendStore ??= new SpendStore(resolve(process.cwd(), 'data', 'spend.sqlite'));
}
export function configuredReviewers(): Record<RoleSlot, string> {
  return { senior_a: process.env.SPEND_SENIOR_A_SUB ?? '', senior_b: process.env.SPEND_SENIOR_B_SUB ?? '', ceo: process.env.SPEND_CEO_SUB ?? '' };
}
