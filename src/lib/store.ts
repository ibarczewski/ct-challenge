import { Redis } from '@upstash/redis';

const kv = Redis.fromEnv();

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

export async function generateCode(): Promise<string> {
  let code: string;
  do {
    code = Math.floor(1000 + Math.random() * 9000).toString();
  } while ((await getCar(code)) !== undefined);
  return code;
}

export async function createCar(code: string): Promise<Car> {
  const car: Car = {
    code,
    status: 'building',
    createdAt: Date.now(),
    passengers: [],
  };
  await kv.set(`car:${code}`, car);
  return car;
}

export async function getCar(code: string): Promise<Car | undefined> {
  const car = await kv.get<Car>(`car:${code}`);
  return car ?? undefined;
}

export async function joinCar(code: string, passengerName: string): Promise<Car | null> {
  const car = await getCar(code);
  if (!car || car.status !== 'building') return null;
  const existingNames = car.passengers.map((p) => p.name);
  let name = passengerName.trim() || 'Guest';
  if (existingNames.includes(name)) {
    name = `${name} 2`;
  }
  car.passengers.push({ name, items: [] });
  await kv.set(`car:${code}`, car);
  return car;
}

export async function addItem(
  code: string,
  passengerName: string,
  item: OrderItem
): Promise<Car | null> {
  const car = await getCar(code);
  if (!car || car.status !== 'building') return null;
  const passenger = car.passengers.find((p) => p.name === passengerName);
  if (!passenger) return null;
  passenger.items.push(item);
  await kv.set(`car:${code}`, car);
  return car;
}

export async function lockCar(code: string): Promise<Car | null> {
  const car = await getCar(code);
  if (!car) return null;
  car.status = 'preparing';
  await kv.set(`car:${code}`, car);
  return car;
}

export async function readyCar(code: string): Promise<Car | null> {
  const car = await getCar(code);
  if (!car) return null;
  car.status = 'ready';
  await kv.set(`car:${code}`, car);
  return car;
}
