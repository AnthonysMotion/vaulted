export function ProfileRoleBadge({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <span
      className="border px-3 py-1 font-mono text-xs uppercase tracking-[-0.01em]"
      style={{
        color,
        borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
        backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}
