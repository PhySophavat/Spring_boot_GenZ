import React, { useState, useEffect } from "react";
import { CreditCard, Plus, Snowflake, Zap, ShieldCheck, Eye, EyeOff, RotateCcw, Trash2, Edit2, Loader2, Building2 } from "lucide-react";
import { type Card, getCards, saveCard, toggleCardStatus, updateCard, deleteCard } from "../../services/cardService";

const CardItem = ({ card, onUpdate }: { card: Card; onUpdate: () => void }) => {
  const [showNumber, setShowNumber] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFlip = () => {
    if (isLoading) return;
    setIsLoading(true);
    // Simulate loading circle when flipping to back
    setTimeout(() => {
      setIsLoading(false);
      setIsFlipped(!isFlipped);
    }, 600);
  };

  const handleToggleStatus = () => {
    toggleCardStatus(card.id);
    onUpdate();
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this card?")) {
      deleteCard(card.id);
      onUpdate();
    }
  };

  const handleEdit = () => {
    const newHolder = window.prompt("Enter new card holder name:", card.cardHolder);
    if (newHolder) {
      updateCard(card.id, { cardHolder: newHolder });
      onUpdate();
    }
  };

  return (
    <div className="group relative flex flex-col gap-4" style={{ perspective: '1000px' }}>
      {/* The Physical Card Look */}
      <div 
        className="relative h-56 w-full rounded-3xl transition-all duration-700 ease-in-out"
        style={{ 
          transformStyle: 'preserve-3d', 
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front of Card */}
        <div 
          className={`absolute inset-0 w-full h-full rounded-3xl p-6 text-white shadow-2xl ${
            card.status === "FROZEN" 
              ? "bg-gradient-to-br from-slate-400 to-slate-600 grayscale"
              : card.type === "VISA" 
                ? "bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900" 
                : "bg-gradient-to-br from-orange-500 via-red-500 to-pink-600"
          }`} 
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Decorative Elements */}
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-black/10 blur-2xl pointer-events-none" />
          
          <div className="relative flex h-full flex-col justify-between z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/90">
                 <Building2 className="h-6 w-6 opacity-90" />
                 <span className="font-bold tracking-wide opacity-90">FlexBank</span>
              </div>
              <span className="font-['Manrope',sans-serif] text-2xl font-black italic tracking-widest text-white drop-shadow-md">
                {card.type}
              </span>
            </div>

            <div className="flex items-center justify-between mt-2">
               <div className="h-8 w-12 rounded bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                  <div className="h-5 w-8 rounded-sm border border-white/40 bg-gradient-to-br from-yellow-200/60 to-yellow-500/60" />
               </div>
               
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between group/number">
                 <p className="font-mono text-xl tracking-[0.15em] text-white/95 sm:text-2xl drop-shadow-md transition-all">
                   {showNumber ? card.cardNumber.match(/.{1,4}/g)?.join(' ') : `**** **** **** ${card.cardNumber.slice(-4)}`}
                 </p>
                 <button 
                   onClick={() => setShowNumber(!showNumber)} 
                   className="p-1.5 hover:bg-white/20 rounded-full transition-colors opacity-50 group-hover/number:opacity-100"
                 >
                    {showNumber ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                 </button>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-white/80">
                <div>
                  <span className="block text-[8px] opacity-70 mb-0.5">Card Holder</span>
                  <span className="text-white drop-shadow-sm truncate max-w-[150px] inline-block">{card.cardHolder}</span>
                </div>
                <div>
                  <span className="block text-[8px] opacity-70 mb-0.5">Expires</span>
                  <span className="text-white drop-shadow-sm">{card.expiryDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back of Card */}
        <div 
          className={`absolute inset-0 w-full h-full rounded-3xl text-white shadow-2xl ${
            card.status === "FROZEN" 
              ? "bg-gradient-to-br from-slate-500 to-slate-700 grayscale"
              : "bg-gradient-to-br from-slate-800 to-slate-900"
          }`} 
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="w-full h-12 bg-black/80 mt-6 shadow-sm"></div>
          <div className="p-6">
             <div className="w-full h-10 bg-slate-200 rounded flex justify-end items-center px-4 mt-2">
                <span className="text-black font-mono italic font-bold bg-white px-2 py-1 text-sm rounded shadow-sm">
                  {showNumber ? card.cvv : '***'}
                </span>
             </div>
             <p className="text-[9px] opacity-60 mt-6 text-center leading-relaxed px-4">
               This card is property of FlexBank. Authorized signature required. If found, please return to the nearest FlexBank branch.
             </p>
          </div>
        </div>
      </div>

      {/* Card Actions Container */}
      <div className="flex flex-col gap-3 rounded-[20px] border border-slate-200/80 bg-white p-4 shadow-sm z-10 relative">
        <div className="flex items-center justify-between">
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
            onClick={handleFlip}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <RotateCcw className="w-3.5 h-3.5" />}
            {isLoading ? "Loading..." : isFlipped ? "Show Front" : "Show Back"}
          </button>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100/80">
          <div className="flex gap-1.5">
            <button onClick={handleEdit} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group relative" title="Edit Card">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={handleDelete} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group relative" title="Delete Card">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={handleToggleStatus}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              card.status === "ACTIVE" 
                ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20"
            }`}
          >
            {card.status === "ACTIVE" ? (
              <><Snowflake className="h-3.5 w-3.5" /> Freeze</>
            ) : (
              <><Zap className="h-3.5 w-3.5" /> Unfreeze</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);

  const loadCards = () => {
    setCards(getCards());
  };

  useEffect(() => {
    loadCards();
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
    loadCards();
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
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-slate-800 hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          Virtual Card
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <CardItem key={card.id} card={card} onUpdate={loadCards} />
        ))}
      </div>
    </div>
  );
}
