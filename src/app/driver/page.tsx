'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Car } from '@/lib/store';
import { MENU, type MenuItem } from '@/lib/menu';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? '';

type Phase = 'idle' | 'active' | 'confirmed';

const CATEGORIES = ['tenders', 'sandwiches', 'sides', 'drinks'] as const;

const DEMO_NAMES = [
  'Ava', 'Ben', 'Cal', 'Dana', 'Eli', 'Faye', 'Gus', 'Hana',
  'Ivy', 'Jake', 'Kim', 'Leo', 'Mia', 'Noel', 'Ora', 'Pete',
  'Quinn', 'Rae', 'Sam', 'Tess', 'Uma', 'Vince', 'Wren', 'Zoe',
];

function randomName() {
  return DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
}

export default function DriverPage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(false);

  // Driver self-order state
  const [driverNameInput, setDriverNameInput] = useState(() => randomName());
  const [driverName, setDriverName] = useState('');
  const [driverJoining, setDriverJoining] = useState(false); // name input visible
  const [driverJoined, setDriverJoined] = useState(false);   // joined, menu visible

  // Poll when active or confirmed (need to catch the ready state)
  useEffect(() => {
    if ((phase !== 'active' && phase !== 'confirmed') || !car) return;

    const poll = async () => {
      const res = await fetch(`/api/car/${car.code}`);
      if (!res.ok) return;
      const data: Car = await res.json();
      setCar(data);
    };

    const id = setInterval(poll, 1500);
    return () => clearInterval(id);
  }, [phase, car?.code]);

  const handleCreateCar = async () => {
    setLoading(true);
    const res = await fetch('/api/car/new');
    const data: Car = await res.json();
    setCar(data);
    setPhase('active');
    setLoading(false);
  };

  const handleDriverJoin = async () => {
    if (!car || !driverNameInput.trim()) return;
    const res = await fetch(`/api/car/${car.code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', passengerName: driverNameInput.trim() }),
    });
    if (res.ok) {
      const data: Car = await res.json();
      const me = data.passengers[data.passengers.length - 1];
      setDriverName(me.name);
      setCar(data);
      setDriverJoining(false);
      setDriverJoined(true);
    }
  };

  const handleDriverAddItem = async (item: MenuItem) => {
    if (!car || !driverName) return;
    const res = await fetch(`/api/car/${car.code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addItem', passengerName: driverName, menuItemId: item.id }),
    });
    if (res.ok) {
      const data: Car = await res.json();
      setCar(data);
    }
  };

  const handleLockAndPay = async () => {
    if (!car) return;
    const res = await fetch(`/api/car/${car.code}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'lock' }),
    });
    if (res.ok) {
      const data: Car = await res.json();
      setCar(data);
      setPhase('confirmed');
    }
  };

  const allItems = car?.passengers.flatMap((p) =>
    p.items.map((item) => ({ ...item, passengerName: p.name }))
  ) ?? [];

  const total = allItems.reduce((sum, item) => sum + item.price, 0);

  const myItems = car?.passengers.find((p) => p.name === driverName)?.items ?? [];

  // IDLE — no car yet
  if (phase === 'idle') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 max-w-sm mx-auto text-center">
        <h1 className="text-4xl font-black text-white mb-2">PILE-IN</h1>
        <p className="text-yellow-400 mb-2">Jimmy's Chicken Shack</p>
        <p className="text-gray-500 text-sm mb-10">
          Start a group order. Share the code with your crew.
        </p>
        <button
          onClick={handleCreateCar}
          disabled={loading}
          className="w-full bg-yellow-400 text-black font-black text-xl rounded-xl py-4 disabled:opacity-40"
        >
          {loading ? 'Starting…' : 'Start Order'}
        </button>
      </div>
    );
  }

  // CONFIRMED — order locked and paid
  if (phase === 'confirmed') {
    const isReady = car?.status === 'ready';
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 max-w-sm mx-auto text-center">
        {isReady ? (
          <>
            <div className="text-6xl mb-4">🍗</div>
            <h2 className="text-3xl font-black text-white mb-2">Proceed to Window 2</h2>
            <p className="text-blue-400 mb-6">Your order is ready for pickup!</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">🍗</div>
            <h2 className="text-3xl font-black text-green-400 mb-2">Order Sent!</h2>
            <p className="text-gray-400 mb-2">Car #{car?.code}</p>
            <p className="text-gray-500 text-sm mb-6">Kitchen is preparing your order.</p>
          </>
        )}
        <div className="w-full bg-gray-800 rounded-lg p-4 text-left space-y-1 mb-4">
          {allItems.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-300">
                {item.name}
                <span className="text-gray-600 ml-2">· {item.passengerName}</span>
              </span>
              <span className="text-gray-400">${item.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="w-full flex justify-between text-white font-black text-lg px-1">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    );
  }

  // ACTIVE — showing live order
  return (
    <div className="min-h-screen bg-gray-950 max-w-sm mx-auto pb-28">
      {/* Header */}
      <div className="sticky top-0 bg-gray-950 border-b border-gray-800 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-black">PILE-IN</h1>
            <p className="text-gray-500 text-xs">Jimmy's Chicken Shack</p>
          </div>
          <div className="text-right">
            <p className="text-yellow-400 font-black text-2xl tracking-widest">{car?.code}</p>
            <p className="text-gray-600 text-xs">Share this code</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-6">
        {/* Share instructions */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 flex flex-col items-center gap-3">
          <QRCodeSVG
            value={`${BASE_URL}/join/${car?.code}`}
            size={160}
            bgColor="#1f2937"
            fgColor="#ffffff"
            className="rounded"
          />
          <div className="text-center">
            <p className="text-gray-400 text-sm">Scan to join · or enter code</p>
            <p className="text-yellow-400 font-black text-2xl tracking-widest font-mono">{car?.code}</p>
          </div>
        </div>

        {/* Passenger orders */}
        {car?.passengers.length === 0 ? (
          <p className="text-gray-600 text-center text-sm py-4">
            Waiting for passengers to join…
          </p>
        ) : (
          <div className="space-y-4 mb-6">
            {car?.passengers.map((passenger) => (
              <div key={passenger.name} className="bg-gray-800 rounded-lg p-4">
                <p className="text-yellow-400 font-bold text-sm uppercase mb-2">
                  {passenger.name}
                  <span className="text-gray-600 font-normal ml-2">
                    ({passenger.items.length} item{passenger.items.length !== 1 ? 's' : ''})
                  </span>
                </p>
                {passenger.items.length === 0 ? (
                  <p className="text-gray-600 text-xs italic">Still deciding…</p>
                ) : (
                  passenger.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-300">{item.name}</span>
                      <span className="text-gray-500">${item.price.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        )}

        {/* Running total */}
        {allItems.length > 0 && (
          <div className="flex justify-between text-white mb-6 px-1">
            <span className="text-gray-400">Running total</span>
            <span className="font-bold">${total.toFixed(2)}</span>
          </div>
        )}

        {/* Driver self-order */}
        {!driverJoining && !driverJoined && (
          <button
            onClick={() => setDriverJoining(true)}
            className="w-full bg-gray-800 hover:bg-gray-700 text-yellow-400 font-black text-sm rounded-lg py-3 mb-6 transition-colors"
          >
            + Add my order
          </button>
        )}

        {driverJoining && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-3">What's your name?</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={driverNameInput}
                onChange={(e) => setDriverNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleDriverJoin()}
                className="flex-1 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                autoFocus
              />
              <button
                onClick={handleDriverJoin}
                disabled={!driverNameInput.trim()}
                className="bg-yellow-400 text-black font-black text-sm rounded-lg px-4 py-2 disabled:opacity-40"
              >
                Go
              </button>
            </div>
          </div>
        )}

        {driverJoined && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-xs uppercase tracking-widest">Your order</p>
              {myItems.length > 0 && (
                <p className="text-yellow-400 text-xs font-bold">
                  {myItems.length} item{myItems.length !== 1 ? 's' : ''} · ${myItems.reduce((s, i) => s + i.price, 0).toFixed(2)}
                </p>
              )}
            </div>
            {CATEGORIES.map((category) => {
              const items = MENU.filter((m) => m.category === category);
              return (
                <div key={category} className="mb-4">
                  <p className="text-gray-600 text-xs uppercase tracking-widest mb-2">{category}</p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleDriverAddItem(item)}
                        className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700 active:bg-yellow-400 active:text-black rounded-lg px-4 py-3 text-left transition-colors"
                      >
                        <span className="text-white font-medium text-sm">{item.name}</span>
                        <span className="text-yellow-400 font-bold text-sm ml-4 shrink-0">${item.price.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lock & Pay — fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 p-4 max-w-sm mx-auto">
        <button
          onClick={handleLockAndPay}
          disabled={allItems.length === 0}
          className="w-full bg-green-500 hover:bg-green-400 text-black font-black text-xl rounded-xl py-4 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Lock & Pay · ${total.toFixed(2)}
        </button>
        <p className="text-gray-700 text-xs text-center mt-2">
          {allItems.length === 0
            ? 'Waiting for items before you can pay'
            : 'This will lock the order and notify the kitchen'}
        </p>
      </div>
    </div>
  );
}
