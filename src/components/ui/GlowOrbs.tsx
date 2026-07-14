export function GlowOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-accent-from/30 blur-[100px]" />
      <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-accent-to/25 blur-[110px]" />
      <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-accent-from/15 blur-[90px]" />
    </div>
  );
}
