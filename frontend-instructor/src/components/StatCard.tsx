type Props = { label: string; value: string; sub: string; icon: string; accent?: string };
export function StatCard({ label, value, sub, icon, accent = "bg-zinc-900" }: Props) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-sm ${accent}`}>{icon}</div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight">{value}</p>
      <p className="text-xs text-zinc-500">{sub}</p>
    </div>
  );
}
