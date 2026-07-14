/**
 * App shell placeholder. Metric views (map, charts) arrive as vertical slices;
 * i18n, theme toggle and motion foundation land in the frontend-foundation tasks.
 */
export default function App() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex items-center gap-3">
        <span className="inline-block size-3 rotate-45 rounded-sm bg-cuebiq-teal" />
        <span className="inline-block size-3 rotate-45 rounded-sm bg-cuebiq-blue-light" />
        <span className="inline-block size-3 rotate-45 rounded-sm bg-cuebiq-blue" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">Impression Explorer</h1>
      <p className="max-w-md text-sm text-white/60">
        Explore US advertising impression density. The app shell is up — metrics
        are shipped as vertical slices.
      </p>
    </div>
  );
}
