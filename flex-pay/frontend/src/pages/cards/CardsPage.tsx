import React, { useState, useEffect } from "react";
import { CreditCard, Plus, Snowflake, Zap, ShieldCheck } from "lucide-react";
import { type Card, getCards, saveCard, toggleCardStatus } from "../../services/cardService";

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setCards(getCards());
  }, []);

  const handleAddCard = () => {
    saveCard({
      cardNumber: "4000" + Math.floor(100000000000 + Math.random() * 900000000000).toString(),
      cardHolder: "Admin User",
      expiryDate: "12/29",
      cvv: Math.floor(100 + Math.random() * 900).toString(),
      type: Math.random() > 0.5 ? "VISA" : "MASTERCARD",
      status: "ACTIVE"
    });
    setCards(getCards());
    setIsAdding(false);
  };

  const handleToggleStatus = (id: string) => {
    toggleCardStatus(id);
    setCards(getCards());
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
            Payment Methods
          </p>
          <h1 className="mt-1 font-['Manrope',sans-serif] text-2xl font-extrabold text-slate-900">
            My Cards
          </h1>
        </div>
        <button
          onClick={handleAddCard}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Virtual Card
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div key={card.id} className="group relative flex flex-col gap-4">
            {/* The Physical Card Look */}
            <div className={`relative h-56 overflow-hidden rounded-3xl p-6 text-white shadow-2xl transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] ${
              card.status === "FROZEN" 
                ? "bg-gradient-to-br from-slate-400 to-slate-600 grayscale"
                : card.type === "VISA" 
                  ? "bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900" 
                  : "bg-gradient-to-br from-orange-500 via-red-500 to-pink-600"
            }`}>
              {/* Decorative Card Elements */}
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-black/10 blur-2xl pointer-events-none" />
              
              <div className="relative flex h-full flex-col justify-between z-10">
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-12 items-center justify-center rounded bg-white/20 backdrop-blur-sm">
                    {/* Chip simulation */}
                    <div className="h-5 w-8 rounded-sm border border-white/30 bg-gradient-to-br from-yellow-200/50 to-yellow-500/50" />
                  </div>
                  <span className="font-['Manrope',sans-serif] text-xl font-black italic tracking-widest text-white/90">
                    {card.type}
                  </span>
                </div>

                <div>
                  <p className="font-mono text-xl tracking-[0.2em] text-white/90 sm:text-2xl drop-shadow-md">
                    **** **** **** {card.cardNumber.slice(-4)}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-white/70">
                    <div>
                      <span className="block text-[8px] opacity-70">Card Holder</span>
                      <span className="text-white drop-shadow-sm">{card.cardHolder}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] opacity-70">Expires</span>
                      <span className="text-white drop-shadow-sm">{card.expiryDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Actions */}
            <div className="flex items-center justify-between rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                {card.status === "ACTIVE" ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    <ShieldCheck className="h-3 w-3" /> Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <Snowflake className="h-3 w-3" /> Frozen
                  </span>
                )}
              </div>
              
              <button
                onClick={() => handleToggleStatus(card.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                  card.status === "ACTIVE" 
                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                    : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20"
                }`}
              >
                {card.status === "ACTIVE" ? (
                  <><Snowflake className="h-3.5 w-3.5" /> Freeze Card</>
                ) : (
                  <><Zap className="h-3.5 w-3.5" /> Unfreeze</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
