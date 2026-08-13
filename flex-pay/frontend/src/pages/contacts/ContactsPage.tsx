import React, { useState, useEffect } from "react";
import { BookUser, Star, Trash2, Plus, Building2, Smartphone } from "lucide-react";
import { type Contact, getContacts, saveContact, deleteContact, toggleFavorite } from "../../services/contactService";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: "", accountNumber: "", bankName: "" });

  useEffect(() => {
    setContacts(getContacts());
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.accountNumber || !formData.bankName) return;
    
    saveContact({ ...formData, isFavorite: false });
    setContacts(getContacts());
    setFormData({ name: "", accountNumber: "", bankName: "" });
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    deleteContact(id);
    setContacts(getContacts());
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
    setContacts(getContacts());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
            Address Book
          </p>
          <h1 className="mt-1 font-['Manrope',sans-serif] text-2xl font-extrabold text-slate-900">
            Contacts
          </h1>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-600/30"
        >
          <Plus className="h-4 w-4" />
          Add Contact
        </button>
      </div>

      {/* Add Contact Form */}
      {isAdding && (
        <form onSubmit={handleAdd} className="rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm animate-in slide-in-from-top-4 fade-in duration-300">
          <h2 className="mb-4 font-['Manrope',sans-serif] text-lg font-bold text-slate-800">New Contact</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">Account Number</label>
              <input
                type="text"
                required
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="123456789"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">Bank Name</label>
              <input
                type="text"
                required
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Flex Bank"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700"
            >
              Save Contact
            </button>
          </div>
        </form>
      )}

      {/* Contacts Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {contacts.map((contact) => (
          <div key={contact.id} className="group relative flex flex-col rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <BookUser className="h-6 w-6" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleFavorite(contact.id)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                    contact.isFavorite ? "bg-amber-100 text-amber-500" : "bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-400"
                  }`}
                >
                  <Star className="h-4 w-4" fill={contact.isFavorite ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-['Manrope',sans-serif] text-lg font-bold text-slate-900">{contact.name}</h3>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Smartphone className="h-4 w-4 text-slate-400" />
                  <span className="font-mono text-xs">{contact.accountNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-semibold uppercase">{contact.bankName}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {contacts.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 py-16 text-center">
            <BookUser className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm font-medium text-slate-500">No contacts found. Add one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
