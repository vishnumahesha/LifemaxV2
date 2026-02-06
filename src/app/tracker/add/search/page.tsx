'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Search,
  ArrowLeft,
  Plus,
  Check,
  Clock,
  Star,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import type { Food, MealType } from '@/types/tracker';

export default function FoodSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [recentFoods, setRecentFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
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

  const searchFoods = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/foods/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
      const data = await response.json();
      
      if (data.ok) {
        setResults(data.data.foods);
        if (data.data.recentFoods) {
          setRecentFoods(data.data.recentFoods);
        }
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchFoods(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchFoods]);

  const handleSelectFood = (food: Food) => {
    setSelectedFood(food);
    setPortionG(food.servingSizeG || 100);
  };

  const handleAddFood = async () => {
    if (!selectedFood) return;

    const scale = portionG / 100;
    const calories = (selectedFood.caloriesPer100g || 0) * scale;
    const protein = (selectedFood.proteinPer100g || 0) * scale;
    const carbs = (selectedFood.carbsPer100g || 0) * scale;
    const fats = (selectedFood.fatsPer100g || 0) * scale;
    const fiber = (selectedFood.fiberPer100g || 0) * scale;

    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType,
          consumedAt: new Date().toISOString(),
          source: 'search',
          items: [{
            foodId: selectedFood.id,
            name: selectedFood.brand ? `${selectedFood.name} (${selectedFood.brand})` : selectedFood.name,
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
            method: 'db',
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

  const FoodItem = ({ food, onSelect }: { food: Food; onSelect: () => void }) => (
    <motion.button
      whileHover={{ scale: 1.01 }}
      onClick={onSelect}
      className="w-full p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-violet-500/30 text-left transition-colors"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-white">{food.name}</div>
          {food.brand && <div className="text-xs text-zinc-500">{food.brand}</div>}
        </div>
        <div className="text-right">
          <div className="text-violet-400 font-semibold">
            {food.caloriesPer100g ? Math.round(food.caloriesPer100g) : '?'} cal
          </div>
          <div className="text-xs text-zinc-500">per 100g</div>
        </div>
      </div>
      <div className="flex gap-3 mt-2 text-xs text-zinc-500">
        <span>P: {food.proteinPer100g?.toFixed(1) || '?'}g</span>
        <span>C: {food.carbsPer100g?.toFixed(1) || '?'}g</span>
        <span>F: {food.fatsPer100g?.toFixed(1) || '?'}g</span>
      </div>
    </motion.button>
  );

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700">
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Search Foods</h1>
            <p className="text-sm text-zinc-400">Find and log foods from database</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search foods..."
            autoFocus
            className="w-full pl-12 pr-4 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <AnimatePresence mode="wait">
          {/* Selected Food Modal */}
          {selectedFood && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
              onClick={() => setSelectedFood(null)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl bg-zinc-900 rounded-t-2xl p-6"
              >
                <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6" />
                
                <h3 className="text-xl font-bold text-white mb-1">{selectedFood.name}</h3>
                {selectedFood.brand && <p className="text-zinc-500 mb-4">{selectedFood.brand}</p>}

                {/* Portion */}
                <div className="mb-4">
                  <label className="text-sm text-zinc-400 mb-2 block">Portion (grams)</label>
                  <input
                    type="number"
                    value={portionG}
                    onChange={(e) => setPortionG(parseInt(e.target.value) || 100)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white"
                  />
                </div>

                {/* Meal Type */}
                <div className="mb-6">
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
                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="p-3 bg-zinc-800 rounded-xl text-center">
                    <div className="text-lg font-bold text-violet-400">
                      {Math.round((selectedFood.caloriesPer100g || 0) * portionG / 100)}
                    </div>
                    <div className="text-xs text-zinc-500">cal</div>
                  </div>
                  <div className="p-3 bg-zinc-800 rounded-xl text-center">
                    <div className="text-lg font-bold text-red-400">
                      {Math.round((selectedFood.proteinPer100g || 0) * portionG / 100 * 10) / 10}g
                    </div>
                    <div className="text-xs text-zinc-500">protein</div>
                  </div>
                  <div className="p-3 bg-zinc-800 rounded-xl text-center">
                    <div className="text-lg font-bold text-amber-400">
                      {Math.round((selectedFood.carbsPer100g || 0) * portionG / 100 * 10) / 10}g
                    </div>
                    <div className="text-xs text-zinc-500">carbs</div>
                  </div>
                  <div className="p-3 bg-zinc-800 rounded-xl text-center">
                    <div className="text-lg font-bold text-blue-400">
                      {Math.round((selectedFood.fatsPer100g || 0) * portionG / 100 * 10) / 10}g
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <div className="space-y-3">
          {loading && (
            <div className="py-8 text-center text-zinc-500">Searching...</div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="py-8 text-center text-zinc-500">
              No foods found. Try a different search or create a custom food.
            </div>
          )}

          {!loading && results.map((food) => (
            <FoodItem key={food.id} food={food} onSelect={() => handleSelectFood(food)} />
          ))}

          {/* Recent Foods */}
          {!loading && query.length < 2 && recentFoods.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
                <Clock className="w-4 h-4" />
                Recent Foods
              </div>
              {recentFoods.map((food) => (
                <FoodItem key={food.id} food={food} onSelect={() => handleSelectFood(food)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
