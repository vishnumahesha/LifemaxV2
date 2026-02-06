'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Check,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import type { MealType } from '@/types/tracker';

export default function QuickAddPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [mealType, setMealType] = useState<MealType>('snack');
  const [saving, setSaving] = useState(false);

  // Detect current meal time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 10) setMealType('breakfast');
    else if (hour < 14) setMealType('lunch');
    else if (hour < 18) setMealType('snack');
    else setMealType('dinner');
  }, []);

  const handleSubmit = async () => {
    if (!name || !calories) {
      toast.error('Please enter at least a name and calories');
      return;
    }

    setSaving(true);
    try {
      const calNum = parseFloat(calories) || 0;
      const proteinNum = parseFloat(protein) || 0;
      const carbsNum = parseFloat(carbs) || 0;
      const fatsNum = parseFloat(fats) || 0;

      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType,
          consumedAt: new Date().toISOString(),
          source: 'quick_add',
          items: [{
            name,
            caloriesEstMin: calNum,
            caloriesEstMax: calNum,
            proteinEstMin: proteinNum,
            proteinEstMax: proteinNum,
            carbsEstMin: carbsNum,
            carbsEstMax: carbsNum,
            fatsEstMin: fatsNum,
            fatsEstMax: fatsNum,
            fiberEstMin: 0,
            fiberEstMax: 0,
            confidence: 1.0,
            method: 'manual',
          }],
        }),
      });

      const data = await response.json();
      if (!data.ok) throw new Error(data.error?.message);

      toast.success('Quick add logged!');
      router.push('/tracker');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
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
            <h1 className="text-xl font-bold text-white">Quick Add</h1>
            <p className="text-sm text-zinc-400">Manually enter calories and macros</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Food Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Homemade smoothie"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:border-violet-500"
            />
          </div>

          {/* Meal Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Meal Type</label>
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

          {/* Calories */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Calories *</label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="e.g., 350"
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:border-violet-500"
            />
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Protein (g)</label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Carbs (g)</label>
              <input
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Fats (g)</label>
              <input
                type="number"
                value={fats}
                onChange={(e) => setFats(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:border-violet-500"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={saving || !name || !calories}
            className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 ${
              name && calories
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-5 h-5" />
            {saving ? 'Saving...' : 'Log Food'}
          </button>
        </motion.div>
      </div>
    </AppShell>
  );
}
