export interface Contact {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  isFavorite: boolean;
}

const STORAGE_KEY = "flexpay_contacts";

export function getContacts(): Contact[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    // Initial mock data
    const initial: Contact[] = [
      { id: "1", name: "Alice Johnson", accountNumber: "123456789", bankName: "Flex Bank", isFavorite: true },
      { id: "2", name: "Bob Smith", accountNumber: "987654321", bankName: "Global Bank", isFavorite: false }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(data);
}

export function saveContact(contact: Omit<Contact, "id">): Contact {
  const contacts = getContacts();
  const newContact = { ...contact, id: Date.now().toString() };
  contacts.push(newContact);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  return newContact;
}

export function deleteContact(id: string): void {
  const contacts = getContacts();
  const filtered = contacts.filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function toggleFavorite(id: string): void {
  const contacts = getContacts();
  const index = contacts.findIndex((c) => c.id === id);
  if (index !== -1) {
    contacts[index].isFavorite = !contacts[index].isFavorite;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  }
}
