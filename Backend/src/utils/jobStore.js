import crypto from 'node:crypto';

// In-memory OCR job registry: POST /upload/ocr creates a job and returns its
// id immediately; the frontend polls GET /upload/ocr/:jobId for live progress
// and fetches GET /upload/ocr/:jobId/download when done.
// Shape per job: { id, status, stage, done, total, percent, resultPath,
//   resultName, error, createdAt }
// status: queued | processing | done | error
// stage: queued | rendering | ocr | assembling | saving | done | error
const jobs = new Map();

// Job records are tiny; keep 2h so late downloads still work. Result PDFs in
// public/temp are left on disk (also served statically).
const TTL_MS = 2 * 60 * 60 * 1000;

export function createJob(meta = {}) {
    const job = {
        id: crypto.randomUUID(),
        status: 'queued',
        stage: 'queued',
        done: 0,
        total: null,
        percent: 0,
        resultPath: null,
        resultName: null,
        error: null,
        createdAt: Date.now(),
        ...meta,
    };
    jobs.set(job.id, job);
    return job;
}

export function updateJob(id, patch = {}) {
    const job = jobs.get(id);
    if (!job) return null;
    Object.assign(job, patch);
    if (typeof job.done === 'number' && typeof job.total === 'number' && job.total > 0) {
        job.percent = Math.min(100, Math.round((job.done / job.total) * 100));
    } else if (job.status === 'done') {
        job.percent = 100;
    }
    return job;
}

export function getJob(id) {
    return jobs.get(id) || null;
}

// Only these fields ever leave the server (no absolute paths).
export function publicJob(job) {
    if (!job) return null;
    const { id, status, stage, done, total, percent, resultName, error } = job;
    return { id, status, stage, done, total, percent, resultName, error };
}

setInterval(() => {
    const now = Date.now();
    for (const [id, job] of jobs) {
        if (now - job.createdAt > TTL_MS) jobs.delete(id);
    }
}).unref();
