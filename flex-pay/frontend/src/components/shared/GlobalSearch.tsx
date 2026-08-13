import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, User } from "lucide-react";
import { fetchUsers } from "../../services/userService";
import type { User as UserType } from "../../types/user";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const allUsers = await fetchUsers();
        const lowerQuery = query.toLowerCase();
        const filtered = allUsers.filter(
          (u) =>
            u.fullName.toLowerCase().includes(lowerQuery) ||
            u.email.toLowerCase().includes(lowerQuery) ||
            (u.phoneNumber && u.phoneNumber.includes(lowerQuery))
        );
        setUsers(filtered);
        setIsOpen(true);
      } catch (error) {
        console.error("Failed to search users", error);
      } finally {
        setLoading(false);
      }
    }, 300); // debounce

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: "8px",
          border: "1px solid #e8ecf0",
          borderRadius: "10px",
          padding: "8px 14px",
          background: "#f8fafc",
          width: "300px",
          position: "relative",
          zIndex: 50
        }}
      >
        <Search size={14} color="#94a3b8" />
        <input
          type="search"
          placeholder="Search users by name, email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (users.length > 0) setIsOpen(true);
          }}
          style={{
            border: "none", background: "transparent",
            fontSize: "13px", color: "#334155",
            outline: "none", width: "100%",
          }}
        />
        {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div 
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #e8ecf0",
            borderRadius: "12px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            maxHeight: "320px",
            overflowY: "auto",
            zIndex: 40,
            padding: "8px"
          }}
        >
          {users.length === 0 && query.trim() !== "" && !loading ? (
            <div style={{ padding: "16px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
              No users found for "{query}"
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
              {users.map((user) => (
                <li key={user.id}>
                  <button
                    onClick={() => {
                      setQuery(user.fullName);
                      setIsOpen(false);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ 
                      width: "32px", height: "32px", borderRadius: "50%", 
                      background: "#e0e7ff", color: "#4f46e5", 
                      display: "flex", alignItems: "center", justifyContent: "center" 
                    }}>
                      <User size={16} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>{user.fullName}</p>
                      <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>{user.email || user.phoneNumber}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
