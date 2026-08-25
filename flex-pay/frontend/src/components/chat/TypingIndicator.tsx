/**
 * TypingIndicator.tsx — Animated three-dot typing indicator.
 * Shown when the other user is typing in the conversation.
 */
interface Props {
  names: string[];
}

export default function TypingIndicator({ names }: Props) {
  if (names.length === 0) return null;

  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
      ? `${names[0]} and ${names[1]} are typing`
      : "Several people are typing";

  return (
    <div className="flex items-center gap-2 px-4 py-1 animate-in fade-in duration-300">
      {/* Animated dots bubble */}
      <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-bl-sm px-3 py-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-gray-300 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-gray-400 italic">{label}</span>
    </div>
  );
}
