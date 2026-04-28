export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: 'tenders' | 'sandwiches' | 'sides' | 'drinks';
};

export const MENU: MenuItem[] = [
  { id: 't1', name: '3-Piece Tender Combo', price: 9.49, category: 'tenders' },
  { id: 't2', name: 'Spicy Tender Basket', price: 8.99, category: 'tenders' },
  { id: 's1', name: 'Classic Crispy Sandwich', price: 8.49, category: 'sandwiches' },
  { id: 's2', name: 'Nashville Hot Sandwich', price: 9.49, category: 'sandwiches' },
  { id: 's3', name: 'Honey Butter Sandwich', price: 8.99, category: 'sandwiches' },
  { id: 'si1', name: 'Mac & Cheese', price: 3.49, category: 'sides' },
  { id: 'si2', name: 'Coleslaw', price: 2.49, category: 'sides' },
  { id: 'si3', name: 'Seasoned Fries', price: 2.99, category: 'sides' },
  { id: 'd1', name: 'Sweet Tea (32oz)', price: 2.49, category: 'drinks' },
  { id: 'd2', name: 'Lemonade (32oz)', price: 2.79, category: 'drinks' },
];
