'use client';

import { useEffect, useState } from 'react';
import type { Car } from '@/lib/store';

type Phase = 'idle' | 'active' | 'confirmed';

export default function DriverPage() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(false);

  // Poll when active
  useEffect(() => {
    if (phase !== 'active' || !car) return;

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

  // IDLE — no car yet
  if (phase === 'idle') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 max-w-sm mx-auto text-center">
        <h1 className="text-4xl font-black text-white mb-2">SHOTGUN</h1>
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
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 max-w-sm mx-auto text-center">
        <div className="text-6xl mb-4">🍗</div>
        <h2 className="text-3xl font-black text-green-400 mb-2">Order Sent!</h2>
        <p className="text-gray-400 mb-2">Car #{car?.code}</p>
        <p className="text-gray-500 text-sm mb-6">Kitchen is preparing your order.</p>
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
            <h1 className="text-white font-black">SHOTGUN</h1>
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
        <div className="bg-gray-800 rounded-lg p-4 mb-6 text-center">
          <p className="text-gray-400 text-sm">Tell your crew to go to</p>
          <p className="text-white font-mono text-lg font-bold">
            /join/{car?.code}
          </p>
          <p className="text-gray-500 text-xs mt-1">or share the car code: <span className="text-yellow-400 font-bold">{car?.code}</span></p>
          <a
            href={`/join/${car?.code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 bg-yellow-400 text-black font-black text-sm rounded-lg px-4 py-2"
          >
            Add my order
          </a>
        </div>

        {/* Passenger orders */}
        {car?.passengers.length === 0 ? (
          <p className="text-gray-600 text-center text-sm py-8">
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
          <div className="flex justify-between text-white mb-4 px-1">
            <span className="text-gray-400">Running total</span>
            <span className="font-bold">${total.toFixed(2)}</span>
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
