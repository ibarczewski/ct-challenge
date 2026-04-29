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

export async function generateCode(): Promise<string> {
  let code: string;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while (cars.has(code));
  return code;
}

export async function createCar(code: string): Promise<Car> {
  const car: Car = {
    code,
    status: 'building',
    createdAt: Date.now(),
    passengers: [],
  };
  cars.set(code, car);
  return car;
}

export async function getCar(code: string): Promise<Car | undefined> {
  return cars.get(code);
}

export async function joinCar(code: string, passengerName: string): Promise<Car | null> {
  const car = cars.get(code);
  if (!car || car.status !== 'building') return null;
  const existingNames = car.passengers.map((p) => p.name);
  let name = passengerName.trim() || 'Guest';
  if (existingNames.includes(name)) {
    name = `${name} 2`;
  }
  car.passengers.push({ name, items: [] });
  return car;
}

export async function addItem(
  code: string,
  passengerName: string,
  item: OrderItem
): Promise<Car | null> {
  const car = cars.get(code);
  if (!car || car.status !== 'building') return null;
  const passenger = car.passengers.find((p) => p.name === passengerName);
  if (!passenger) return null;
  passenger.items.push(item);
  return car;
}

export async function lockCar(code: string): Promise<Car | null> {
  const car = cars.get(code);
  if (!car) return null;
  car.status = 'preparing';
  return car;
}

export async function readyCar(code: string): Promise<Car | null> {
  const car = cars.get(code);
  if (!car) return null;
  car.status = 'ready';
  return car;
}

// Pre-seeded demo car — open /kitchen/1207 immediately on server start
createCar('1207');
