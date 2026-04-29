import { NextRequest, NextResponse } from 'next/server';
import {
  getCar,
  createCar,
  generateCode,
  joinCar,
  addItem,
  lockCar,
  readyCar,
} from '@/lib/store';
import { MENU } from '@/lib/menu';

type RouteContext = { params: Promise<{ code: string }> };

// GET /api/car/[code] — read car state
// GET /api/car/new — create a new car and return it
export async function GET(_req: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  if (code === 'new') {
    const newCode = await generateCode();
    const car = await createCar(newCode);
    return NextResponse.json(car);
  }

  const car = await getCar(code);
  if (!car) {
    return NextResponse.json({ error: 'Car not found' }, { status: 404 });
  }
  return NextResponse.json(car);
}

// POST /api/car/[code]
// Body: { action: 'join', passengerName: string }
//     | { action: 'addItem', passengerName: string, menuItemId: string }
export async function POST(req: NextRequest, context: RouteContext) {
  const { code } = await context.params;
  const body = await req.json();

  if (body.action === 'join') {
    const car = await joinCar(code, body.passengerName);
    if (!car) {
      return NextResponse.json(
        { error: 'Car not found or not accepting passengers' },
        { status: 400 }
      );
    }
    return NextResponse.json(car);
  }

  if (body.action === 'addItem') {
    const menuItem = MENU.find((m) => m.id === body.menuItemId);
    if (!menuItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 400 });
    }
    const car = await addItem(code, body.passengerName, {
      menuItemId: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
    });
    if (!car) {
      return NextResponse.json(
        { error: 'Could not add item — car locked or passenger not found' },
        { status: 400 }
      );
    }
    return NextResponse.json(car);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// PATCH /api/car/[code]
// Body: { action: 'lock' } | { action: 'ready' }
export async function PATCH(req: NextRequest, context: RouteContext) {
  const { code } = await context.params;
  const body = await req.json();

  if (body.action === 'lock') {
    const car = await lockCar(code);
    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }
    return NextResponse.json(car);
  }

  if (body.action === 'ready') {
    const car = await readyCar(code);
    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }
    return NextResponse.json(car);
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
