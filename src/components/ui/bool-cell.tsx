interface BoolCellProps {
  value: boolean | undefined;
  yes: string;
  no: string;
  unknown: string;
}

export function BoolCell({ value, yes, no, unknown }: BoolCellProps) {
  if (value === undefined) {
    return <>{unknown}</>;
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          value ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"
        }`}
      />
      {value ? yes : no}
    </span>
  );
}
