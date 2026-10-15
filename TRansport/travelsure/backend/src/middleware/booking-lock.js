// Serialize booking mutations across consent, payment and cancellation requests.
// Reload the persisted booking only after this lock has been acquired.
const queues = new Map();
export async function bookingLock(req, res, next) {
  if (req.method !== "POST") return next();
  const id = req.params.id;
  const previous = queues.get(id) || Promise.resolve();
  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });
  queues.set(id, current);
  await previous;
  let finished = false;
  const unlock = () => {
    if (finished) return;
    finished = true;
    release();
    if (queues.get(id) === current) queues.delete(id);
  };
  res.once("finish", unlock);
  res.once("close", unlock);
  if (res.destroyed) return unlock();
  next();
}
