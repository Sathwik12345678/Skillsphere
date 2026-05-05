export default function ButtonLoader({ label }) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <span className="flex gap-1">
        <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-current" />
      </span>
      <span>{label}</span>
    </span>
  );
}
