import { ImageInfo } from './types';

type Job = { id: string; file: File; name: string; path: string; sizeBytes: number };

type WorkerSlot = { worker: Worker; busy: boolean; job?: Job };

export class Scanner {
  private workers: WorkerSlot[] = [];
  private queue: Job[] = [];
  private done = 0;
  private total = 0;
  private cancelled = false;
  private finished = false;
  private onItem?: (x: ImageInfo) => void;
  private onProgress?: (done: number, total: number) => void;
  private onFinish?: () => void;

  constructor(private readonly concurrency = Math.min(8, Math.max(2, typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4))) {}

  scan(files: File[], onItem: (x: ImageInfo) => void, onProgress: (done: number, total: number) => void, onFinish: () => void) {
    this.cancel();
    this.finished = false;
    this.cancelled = false;
    this.done = 0;
    this.total = files.length;
    this.onItem = onItem;
    this.onProgress = onProgress;
    this.onFinish = onFinish;
    this.queue = files.map((file, i) => ({
      id: `${i}-${file.name}-${file.size}-${file.lastModified}`,
      file,
      name: file.name,
      path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
      sizeBytes: file.size,
    }));

    if (!this.total) return this.finish();
    const count = Math.min(this.concurrency, this.total);
    for (let i = 0; i < count; i++) {
      const worker = new Worker(new URL('../workers/parser.worker.ts', import.meta.url));
      const slot: WorkerSlot = { worker, busy: false };
      worker.onmessage = (event: MessageEvent<ImageInfo>) => this.handleResult(slot, event.data);
      worker.onerror = () => this.handleWorkerError(slot);
      this.workers.push(slot);
    }
    this.fill();
  }

  private fill() {
    for (const slot of this.workers) {
      if (this.cancelled || slot.busy) continue;
      const job = this.queue.shift();
      if (!job) continue;
      slot.busy = true;
      slot.job = job;
      slot.worker.postMessage({ ...job });
    }
    if (!this.queue.length && this.done >= this.total) this.finish();
  }

  private handleResult(slot: WorkerSlot, result: ImageInfo) {
    slot.busy = false;
    slot.job = undefined;
    this.done++;
    this.onItem?.(result);
    this.onProgress?.(this.done, this.total);
    if (this.done >= this.total) this.finish();
    else this.fill();
  }

  private handleWorkerError(slot: WorkerSlot) {
    const job = slot.job;
    slot.busy = false;
    slot.job = undefined;
    if (job) {
      this.done++;
      this.onItem?.({ id: job.id, name: job.name, path: job.path, sizeBytes: job.sizeBytes, status: 'error', format: 'UNKNOWN', error: 'Ошибка фонового обработчика' });
      this.onProgress?.(this.done, this.total);
    }
    if (this.done >= this.total) this.finish();
    else this.fill();
  }

  private finish() {
    if (this.finished) return;
    this.finished = true;
    for (const slot of this.workers) slot.worker.terminate();
    this.workers = [];
    this.onFinish?.();
  }

  cancel() {
    if (!this.workers.length && !this.queue.length) return;
    this.cancelled = true;
    this.queue = [];
    for (const slot of this.workers) slot.worker.terminate();
    this.workers = [];
    this.finished = true;
  }
}
