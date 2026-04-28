export type OrderItem = {
  menuItemId: string;
  name: string;
  price: number;
};

export type Passenger = {
  name: string;
  items: OrderItem[];
};

export type CarStatus = 'building' | 'locked' | 'preparing' | 'ready';

export type Car = {
  code: string;
  status: CarStatus;
  createdAt: number;
  passengers: Passenger[];
};

// Module-level Map — persists between requests in Next.js dev mode
const cars = new Map<string, Car>();

export function generateCode(): string {
  let code: string;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (cars.has(code));
  return code;
}

export function createCar(code: string): Car {
  const car: Car = {
    code,
    status: 'building',
    createdAt: Date.now(),
    passengers: [],
  };
  cars.set(code, car);
  return car;
}

export function getCar(code: string): Car | undefined {
  return cars.get(code);
}

export function joinCar(code: string, passengerName: string): Car | null {
  const car = cars.get(code);
  if (!car || car.status !== 'building') return null;
  // Avoid duplicate names — append number if needed
  const existingNames = car.passengers.map((p) => p.name);
  let name = passengerName.trim() || 'Guest';
  if (existingNames.includes(name)) {
    name = `${name} 2`;
  }
  car.passengers.push({ name, items: [] });
  return car;
}

export function addItem(
  code: string,
  passengerName: string,
  item: OrderItem
): Car | null {
  const car = cars.get(code);
  if (!car || car.status !== 'building') return null;
  const passenger = car.passengers.find((p) => p.name === passengerName);
  if (!passenger) return null;
  passenger.items.push(item);
  return car;
}

export function lockCar(code: string): Car | null {
  const car = cars.get(code);
  if (!car) return null;
  car.status = 'preparing';
  return car;
}

export function readyCar(code: string): Car | null {
  const car = cars.get(code);
  if (!car) return null;
  car.status = 'ready';
  return car;
}

// Pre-seed a demo car so the kitchen can be opened before the demo starts
createCar('1207');
