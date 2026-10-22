import { parentPort, workerData } from 'node:worker_threads';
import { SpendStore } from '../lib/store.ts';

const store = new SpendStore(workerData.path);
try {
  const flag = new Int32Array(workerData.start);
  Atomics.wait(flag, 0, 0);
  const result = store.decide(workerData.id, workerData.actor, workerData.input);
  parentPort!.postMessage({ ok: true, status: result.status });
} catch (error) {
  parentPort!.postMessage({ ok: false, status: error instanceof Error && 'status' in error ? error.status : 500 });
} finally { store.close(); }
