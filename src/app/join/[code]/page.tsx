'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Car } from '@/lib/store';
import { MENU, type MenuItem } from '@/lib/menu';

type Phase = 'join' | 'ordering' | 'locked';

const CATEGORIES = ['tenders', 'sandwiches', 'sides', 'drinks'] as const;

const DEMO_NAMES = [
  'Ava', 'Ben', 'Cal', 'Dana', 'Eli', 'Faye', 'Gus', 'Hana',
  'Ivy', 'Jake', 'Kim', 'Leo', 'Mia', 'Noel', 'Ora', 'Pete',
  'Quinn', 'Rae', 'Sam', 'Tess', 'Uma', 'Vince', 'Wren', 'Zoe',
];

function randomName() {
  return DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
}

export default function PassengerPage() {
  const { code } = useParams<{ code: string }>();
  const [phase, setPhase] = useState<Phase>('join');
  const [nameInput, setNameInput] = useState(() => randomName());
  const [passengerName, setPassengerName] = useState('');
  const [car, setCar] = useState<Car | null>(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  // Poll car state once joined
  useEffect(() => {
    if (phase !== 'ordering' && phase !== 'locked') return;

    const poll = async () => {
      const res = await fetch(`/api/car/${code}`);
      if (!res.ok) return;
      const data: Car = await res.json();
      setCar(data);
      if (data.status !== 'building') setPhase('locked');
    };

    poll();
    const id = setInterval(poll, 1500);
    return () => clearInterval(id);
  }, [code, phase]);

  const handleJoin = async () => {
    if (!nameInput.trim()) return;
    setJoining(true);
    setError('');
    const res = await fetch(`/api/car/${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join', passengerName: nameInput.trim() }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? 'Could not join. Check the code and try again.');
      setJoining(false);
      return;
    }
    const data: Car = await res.json();
    // Find the actual name assigned (may have been de-duped)
    const me = data.passengers[data.passengers.length - 1];
    setPassengerName(me.name);
    setCar(data);
    setPhase('ordering');
    setJoining(false);
  };

  const handleAddItem = async (item: MenuItem) => {
    if (phase !== 'ordering') return;
    const res = await fetch(`/api/car/${code}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'addItem',
        passengerName,
        menuItemId: item.id,
      }),
    });
    if (res.ok) {
      const data: Car = await res.json();
      setCar(data);
    }
  };

  const myItems =
    car?.passengers.find((p) => p.name === passengerName)?.items ?? [];

  // JOIN SCREEN
  if (phase === 'join') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 max-w-sm mx-auto">
        <h1 className="text-3xl font-black text-white mb-1">PILE-IN</h1>
        <p className="text-yellow-400 text-sm mb-8">Jimmy's Chicken Shack · Car {code}</p>
        <input
          type="text"
          placeholder="Your name"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-lg mb-4 outline-none focus:ring-2 focus:ring-yellow-400"
          autoFocus
        />
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <button
          onClick={handleJoin}
          disabled={joining || !nameInput.trim()}
          className="w-full bg-yellow-400 text-black font-black text-lg rounded-lg py-3 disabled:opacity-40"
        >
          {joining ? 'Joining…' : 'Join Order'}
        </button>
      </div>
    );
  }

  // LOCKED SCREEN
  if (phase === 'locked') {
    const isReady = car?.status === 'ready';
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 max-w-sm mx-auto text-center">
        {isReady ? (
          <>
            <div className="text-5xl mb-4">🍗</div>
            <h2 className="text-2xl font-black text-white mb-2">Proceed to Window 2</h2>
            <p className="text-blue-400 mb-6">Your order is ready for pickup!</p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-2xl font-black text-white mb-2">Order Locked</h2>
            <p className="text-gray-400 mb-6">The driver has paid. Your order is being prepared.</p>
          </>
        )}
        <div className="w-full bg-gray-800 rounded-lg p-4 text-left">
          <p className="text-yellow-400 font-bold text-sm uppercase mb-2">{passengerName}'s items</p>
          {myItems.length === 0 ? (
            <p className="text-gray-500 text-sm">No items added.</p>
          ) : (
            myItems.map((item, i) => (
              <div key={i} className="flex justify-between text-white text-sm py-1">
                <span>{item.name}</span>
                <span className="text-gray-400">${item.price.toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ORDERING SCREEN
  return (
    <div className="min-h-screen bg-gray-950 max-w-sm mx-auto pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-gray-950 border-b border-gray-800 px-4 py-3 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-black text-lg">PILE-IN</h1>
            <p className="text-gray-500 text-xs">Car {code} · {passengerName}</p>
          </div>
          <div className="text-right">
            <p className="text-yellow-400 font-bold text-sm">{myItems.length} item{myItems.length !== 1 ? 's' : ''}</p>
            <p className="text-gray-500 text-xs">
              ${myItems.reduce((s, i) => s + i.price, 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-4 pt-4">
        {CATEGORIES.map((category) => {
          const items = MENU.filter((m) => m.category === category);
          return (
            <div key={category} className="mb-6">
              <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-2">
                {category}
              </h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleAddItem(item)}
                    className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700 active:bg-yellow-400 active:text-black rounded-lg px-4 py-3 text-left transition-colors"
                  >
                    <span className="text-white font-medium">{item.name}</span>
                    <span className="text-yellow-400 font-bold ml-4 shrink-0">
                      ${item.price.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* My cart — fixed bottom summary */}
      {myItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 px-4 py-3 max-w-sm mx-auto flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-widest">Your order</p>
            <p className="text-white font-bold text-sm">
              {myItems.length} item{myItems.length !== 1 ? 's' : ''}
            </p>
          </div>
          <p className="text-yellow-400 font-black text-xl">
            ${myItems.reduce((s, i) => s + i.price, 0).toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}
