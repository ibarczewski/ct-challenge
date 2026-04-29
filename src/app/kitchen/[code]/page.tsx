'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Car } from '@/lib/store';

const STATUS_LABELS: Record<string, string> = {
  building: 'BUILDING',
  locked: 'LOCKED',
  preparing: 'PREPARING',
  ready: 'READY',
};

const STATUS_COLORS: Record<string, string> = {
  building: 'bg-yellow-500 text-black',
  locked: 'bg-orange-500 text-black',
  preparing: 'bg-green-500 text-black',
  ready: 'bg-blue-500 text-white',
};

// Stable key for each item so we can detect new arrivals
function itemKey(passengerName: string, index: number) {
  return `${passengerName}:${index}`;
}

export default function KitchenPage() {
  const { code } = useParams<{ code: string }>();
  const [car, setCar] = useState<Car | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [flashKeys, setFlashKeys] = useState<Set<string>>(new Set());
  const seenKeys = useRef<Set<string>>(new Set());

  const handleFinishOrder = async () => {
    setFinishing(true);
    const res = await fetch(`/api/car/${code}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ready' }),
    });
    if (res.ok) {
      const data: Car = await res.json();
      setCar(data);
    }
    setFinishing(false);
  };

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/car/${code}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const data: Car = await res.json();

        // Find items we haven't seen before
        const newKeys: string[] = [];
        data.passengers.forEach((p) => {
          p.items.forEach((_, i) => {
            const key = itemKey(p.name, i);
            if (!seenKeys.current.has(key)) {
              seenKeys.current.add(key);
              newKeys.push(key);
            }
          });
        });

        if (newKeys.length > 0) {
          setFlashKeys((prev) => {
            const next = new Set(prev);
            newKeys.forEach((k) => next.add(k));
            return next;
          });
          // Clear flash after animation completes
          setTimeout(() => {
            setFlashKeys((prev) => {
              const next = new Set(prev);
              newKeys.forEach((k) => next.delete(k));
              return next;
            });
          }, 1000);
        }

        setCar(data);
        setLastUpdated(new Date());
      } catch {
        // silently retry on next interval
      }
    };

    poll();
    const id = setInterval(poll, 1500);
    return () => clearInterval(id);
  }, [code]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400 text-xl">Car code {code} not found.</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500 text-lg animate-pulse">Connecting to order {code}…</p>
      </div>
    );
  }

  const allItems = car.passengers.flatMap((p) =>
    p.items.map((item) => ({ ...item, passengerName: p.name }))
  );

  const total = allItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-gray-950 p-6 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-gray-700 pb-4">
        <div>
          <p className="text-gray-500 text-sm uppercase tracking-widest">Jimmy's Chicken Shack</p>
          <h1 className="text-4xl font-black text-white tracking-tight">
            ORDER #{code}
          </h1>
        </div>
        <div className="text-right">
          <span
            className={`inline-block px-4 py-2 rounded text-sm font-black uppercase tracking-widest ${
              STATUS_COLORS[car.status] ?? 'bg-gray-700 text-white'
            }`}
          >
            {STATUS_LABELS[car.status] ?? car.status}
          </span>
          {lastUpdated && (
            <p className="text-gray-600 text-xs mt-1">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>

      {/* Passenger sections */}
      {car.passengers.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-600 text-lg">Waiting for passengers to join…</p>
          <p className="text-gray-700 text-sm mt-2">Car code: {code}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {car.passengers.map((passenger) => (
            <div key={passenger.name} className="border border-gray-800 rounded-lg p-4">
              <h2 className="text-yellow-400 font-bold text-lg uppercase tracking-wide mb-3">
                {passenger.name}
              </h2>
              {passenger.items.length === 0 ? (
                <p className="text-gray-600 text-sm italic">No items yet…</p>
              ) : (
                <ul className="space-y-1">
                  {passenger.items.map((item, i) => {
                    const key = itemKey(passenger.name, i);
                    return (
                      <li
                        key={i}
                        className={`flex justify-between text-sm rounded px-1 ${
                          flashKeys.has(key) ? 'flash-new' : ''
                        }`}
                      >
                        <span className="text-white">{item.name}</span>
                        <span className="text-gray-400">${item.price.toFixed(2)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Total */}
      {allItems.length > 0 && (
        <div className="mt-6 border-t border-gray-700 pt-4 flex justify-between text-white">
          <span className="font-bold uppercase tracking-widest">Total</span>
          <span className="font-black text-xl">${total.toFixed(2)}</span>
        </div>
      )}

      {/* Finish Order button — shown when preparing */}
      {car.status === 'preparing' && (
        <div className="mt-8">
          <button
            onClick={handleFinishOrder}
            disabled={finishing}
            className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black text-lg rounded-lg py-4 disabled:opacity-40 transition-colors"
          >
            {finishing ? 'Finishing…' : 'Finish Order'}
          </button>
        </div>
      )}

      {/* Ready — deliver to window */}
      {car.status === 'ready' && (
        <div className="mt-8 bg-blue-950 border border-blue-700 rounded-lg p-6 text-center">
          <p className="text-blue-300 text-xs uppercase tracking-widest mb-1">Order Ready</p>
          <p className="text-white font-black text-2xl">Deliver to Window 2</p>
          <p className="text-blue-400 text-sm mt-1">hand off to the customer</p>
        </div>
      )}

      {/* Live indicator */}
      {car.status === 'building' && (
        <p className="text-center text-gray-700 text-xs mt-8">
          Live · polling every 1.5s
        </p>
      )}
    </div>
  );
}
