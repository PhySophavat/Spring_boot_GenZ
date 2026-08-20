export interface Card {
  id: string;
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  cvv: string;
  type: "VISA" | "MASTERCARD";
  status: "ACTIVE" | "FROZEN";
}

const STORAGE_KEY = "flexpay_cards";

export function getCards(): Card[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const initial: Card[] = [
      {
        id: "1",
        cardNumber: "4111222233334444",
        cardHolder: "Admin User",
        expiryDate: "12/28",
        cvv: "123",
        type: "VISA",
        status: "ACTIVE"
      }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
}

export function saveCard(card: Omit<Card, "id">): Card {
  const cards = getCards();
  const newCard = { ...card, id: Date.now().toString() };
  cards.push(newCard);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  return newCard;
}

export function toggleCardStatus(id: string): void {
  const cards = getCards();
  const index = cards.findIndex((c) => c.id === id);
  if (index !== -1) {
    cards[index].status = cards[index].status === "ACTIVE" ? "FROZEN" : "ACTIVE";
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }
}

export function updateCard(id: string, updates: Partial<Card>): void {
  const cards = getCards();
  const index = cards.findIndex((c) => c.id === id);
  if (index !== -1) {
    cards[index] = { ...cards[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }
}

export function deleteCard(id: string): void {
  const cards = getCards();
  const updatedCards = cards.filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCards));
}
