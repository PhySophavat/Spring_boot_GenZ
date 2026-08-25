/**
 * UserSearch.tsx — Modal/overlay to search users and start a new conversation.
 */
import { useEffect, useRef, useState } from "react";
import { Search, UserPlus, X, Loader2, User } from "lucide-react";
import { searchUsers, type MemberInfo } from "../../services/chatApi";

interface Props {
  onSelect: (user: MemberInfo) => void;
  onClose: () => void;
}

export default function UserSearch({ onSelect, onClose }: Props) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<MemberInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!keyword.trim()) { setResults([]); return; }

    timerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const users = await searchUsers(keyword.trim());
        setResults(users);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, [keyword]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-violet-600" />
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">New Conversation</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition"
          >
            <X size={15} />
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search users by name..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:ring-2 focus:ring-violet-400 transition"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="text-violet-400 animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-gray-400 gap-2">
              <User size={28} className="opacity-30" />
              <p className="text-sm">{keyword ? "No users found" : "Start typing to search"}</p>
            </div>
          ) : (
            results.map((user) => (
              <button
                key={user.id}
                onClick={() => { onSelect(user); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {(user.fullName ?? "?")
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">{user.role?.toLowerCase()}</p>
                </div>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                  user.onlineStatus === "ONLINE"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                }`}>
                  {user.onlineStatus}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
