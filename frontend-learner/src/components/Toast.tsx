type Props = { children: string };

export function Toast({ children }: Props) {
  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 border border-ink bg-ink px-5 py-2.5 text-sm font-medium text-ink-inverse shadow-xl"
    >
      {children}
    </div>
  );
}
