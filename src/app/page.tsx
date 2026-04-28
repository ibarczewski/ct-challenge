'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [kitchenCode, setKitchenCode] = useState('');

  const handleJoin = () => {
    const code = joinCode.trim();
    if (code) router.push(`/join/${code}`);
  };

  const handleKitchen = () => {
    const code = kitchenCode.trim();
    if (code) router.push(`/kitchen/${code}`);
  };

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-8">
      <div className="max-w-sm w-full text-center">
        <h1 className="text-5xl font-black text-white mb-2 tracking-tight">SHOTGUN</h1>
        <p className="text-yellow-400 text-sm uppercase tracking-widest mb-2">
          Jimmy's Chicken Shack
        </p>
        <p className="text-gray-500 text-sm mb-10">
          Group drive-thru ordering. Everyone orders in parallel.
          By the time you reach the window, it's ready.
        </p>

        <div className="space-y-4">
          <Link
            href="/driver"
            className="block w-full bg-yellow-400 text-black font-black text-lg rounded-xl py-4 hover:bg-yellow-300 transition-colors"
          >
            I'm the Driver
            <p className="text-sm font-normal text-yellow-800 mt-0.5">
              Generate a code · see all orders · pay
            </p>
          </Link>

          <div className="bg-gray-800 rounded-xl p-4 text-left">
            <p className="text-gray-400 text-sm font-bold mb-3">I'm a Passenger</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter car code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                className="flex-1 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-400 font-mono tracking-widest"
                maxLength={4}
              />
              <button
                onClick={handleJoin}
                disabled={!joinCode.trim()}
                className="bg-yellow-400 text-black font-black text-sm rounded-lg px-4 py-2 disabled:opacity-40"
              >
                Go
              </button>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 text-left">
            <p className="text-gray-400 text-sm font-bold mb-3">Kitchen Display</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter car code"
                value={kitchenCode}
                onChange={(e) => setKitchenCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleKitchen()}
                className="flex-1 bg-gray-900 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-400 font-mono tracking-widest"
                maxLength={4}
              />
              <button
                onClick={handleKitchen}
                disabled={!kitchenCode.trim()}
                className="bg-yellow-400 text-black font-black text-sm rounded-lg px-4 py-2 disabled:opacity-40"
              >
                Go
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
