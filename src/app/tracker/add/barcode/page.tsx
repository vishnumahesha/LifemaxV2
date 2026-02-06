'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Barcode,
  Camera,
  Check,
  AlertCircle,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import type { Food, MealType } from '@/types/tracker';

export default function BarcodeScanPage() {
  const router = useRouter();
  const [barcode, setBarcode] = useState('');
  const [food, setFood] = useState<Food | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portionG, setPortionG] = useState(100);
  const [mealType, setMealType] = useState<MealType>('snack');

  // Detect current meal time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 10) setMealType('breakfast');
    else if (hour < 14) setMealType('lunch');
    else if (hour < 18) setMealType('snack');
    else setMealType('dinner');
  }, []);

  const handleLookup = async () => {
    if (!barcode || barcode.length < 8) {
      toast.error('Please enter a valid barcode');
      return;
    }

    setLoading(true);
    setError(null);
    setFood(null);

    try {
      const response = await fetch('/api/barcode/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error?.message || 'Product not found');
      }

      setFood(data.data.food);
      setPortionG(data.data.food.servingSizeG || 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = async () => {
    if (!food) return;

    const scale = portionG / 100;
    const calories = (food.caloriesPer100g || 0) * scale;
    const protein = (food.proteinPer100g || 0) * scale;
    const carbs = (food.carbsPer100g || 0) * scale;
    const fats = (food.fatsPer100g || 0) * scale;
    const fiber = (food.fiberPer100g || 0) * scale;

    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType,
          consumedAt: new Date().toISOString(),
          source: 'barcode',
          items: [{
            foodId: food.id,
            name: food.brand ? `${food.name} (${food.brand})` : food.name,
            portionG,
            caloriesEstMin: Math.round(calories),
            caloriesEstMax: Math.round(calories),
            proteinEstMin: Math.round(protein * 10) / 10,
            proteinEstMax: Math.round(protein * 10) / 10,
            carbsEstMin: Math.round(carbs * 10) / 10,
            carbsEstMax: Math.round(carbs * 10) / 10,
            fatsEstMin: Math.round(fats * 10) / 10,
            fatsEstMax: Math.round(fats * 10) / 10,
            fiberEstMin: Math.round(fiber * 10) / 10,
            fiberEstMax: Math.round(fiber * 10) / 10,
            confidence: 0.95,
            method: 'barcode',
          }],
        }),
      });

      const data = await response.json();
      if (!data.ok) throw new Error(data.error?.message);

      toast.success('Food added!');
      router.push('/tracker');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add food');
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700">
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Barcode Scanner</h1>
            <p className="text-sm text-zinc-400">Scan or enter product barcode</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Barcode Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Barcode Number</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter barcode..."
                  className="w-full pl-12 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:border-violet-500"
                />
              </div>
              <button
                onClick={handleLookup}
                disabled={loading || barcode.length < 8}
                className={`px-6 rounded-xl font-medium ${
                  barcode.length >= 8
                    ? 'bg-violet-500 text-white hover:bg-violet-600'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {loading ? 'Looking up...' : 'Lookup'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <div className="text-sm text-red-400">{error}</div>
                <p className="text-xs text-red-400/80 mt-1">
                  Try searching by name instead or add as custom food.
                </p>
              </div>
            </div>
          )}

          {/* Found Food */}
          {food && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-4"
            >
              <div>
                <h3 className="text-xl font-bold text-white">{food.name}</h3>
                {food.brand && <p className="text-zinc-500">{food.brand}</p>}
              </div>

              {/* Portion */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Portion (grams)</label>
                <input
                  type="number"
                  value={portionG}
                  onChange={(e) => setPortionG(parseInt(e.target.value) || 100)}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white"
                />
              </div>

              {/* Meal Type */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">Meal Type</label>
                <div className="flex gap-2">
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setMealType(type)}
                      className={`flex-1 py-2 rounded-lg text-sm capitalize ${
                        mealType === type ? 'bg-violet-500 text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated macros */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-zinc-800 rounded-xl text-center">
                  <div className="text-lg font-bold text-violet-400">
                    {Math.round((food.caloriesPer100g || 0) * portionG / 100)}
                  </div>
                  <div className="text-xs text-zinc-500">cal</div>
                </div>
                <div className="p-3 bg-zinc-800 rounded-xl text-center">
                  <div className="text-lg font-bold text-red-400">
                    {Math.round((food.proteinPer100g || 0) * portionG / 100 * 10) / 10}g
                  </div>
                  <div className="text-xs text-zinc-500">protein</div>
                </div>
                <div className="p-3 bg-zinc-800 rounded-xl text-center">
                  <div className="text-lg font-bold text-amber-400">
                    {Math.round((food.carbsPer100g || 0) * portionG / 100 * 10) / 10}g
                  </div>
                  <div className="text-xs text-zinc-500">carbs</div>
                </div>
                <div className="p-3 bg-zinc-800 rounded-xl text-center">
                  <div className="text-lg font-bold text-blue-400">
                    {Math.round((food.fatsPer100g || 0) * portionG / 100 * 10) / 10}g
                  </div>
                  <div className="text-xs text-zinc-500">fats</div>
                </div>
              </div>

              <button
                onClick={handleAddFood}
                className="w-full py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                Add to {mealType}
              </button>
            </motion.div>
          )}

          {/* Note about camera scanning */}
          <div className="p-4 bg-zinc-800/50 rounded-xl text-center text-sm text-zinc-500">
            <Camera className="w-6 h-6 mx-auto mb-2 text-zinc-600" />
            <p>Camera barcode scanning coming soon!</p>
            <p className="text-xs mt-1">For now, enter the barcode number manually.</p>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
