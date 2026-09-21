'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/context/toast-context';
import { DietaryType, MealPlanFrequency, UserRole } from '@apnaghar/shared-types';
import {
  UtensilsCrossed,
  Clock,
  Sparkles,
  CheckCircle2,
  Plus,
  Minus,
  ShoppingBag,
  Leaf,
  ShieldCheck,
  PauseCircle,
  Calendar,
} from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  dietaryType: DietaryType;
  price: number;
  preparationTimeMinutes: number;
  imageUrl?: string;
}

interface MealPlan {
  id: string;
  title: string;
  description: string;
  frequency: MealPlanFrequency;
  dietaryType: DietaryType;
  price: number;
  includesBreakfast: boolean;
  includesLunch: boolean;
  includesDinner: boolean;
}

export default function FoodMarketplacePage() {
  const { isAuthenticated, demoLogin } = useAuth();
  const { success, error, info } = useToast();

  const [dietaryFilter, setDietaryFilter] = useState<string>('ALL');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState<string | null>(null);

  const sampleItems: MenuItem[] = [
    {
      id: 'dish-1',
      name: 'Special North Indian Thali',
      description: '4 Butter Rotis, Paneer Butter Masala, Dal Makhani, Jeera Rice, Salad, Gulab Jamun',
      dietaryType: DietaryType.VEG,
      price: 140,
      preparationTimeMinutes: 20,
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'dish-2',
      name: 'South Indian Combo Box',
      description: '2 Crispy Idlis, 1 Medu Vada, Plain Dosa, Hot Sambar, Fresh Coconut Chutney',
      dietaryType: DietaryType.VEG,
      price: 110,
      preparationTimeMinutes: 15,
      imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'dish-3',
      name: 'Pure Jain Dal Khichdi & Kadi',
      description: 'No onion, no garlic wholesome moong dal khichdi served with Gujarati sweet-spicy kadi and papad',
      dietaryType: DietaryType.JAIN,
      price: 120,
      preparationTimeMinutes: 15,
      imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'dish-4',
      name: 'Homestyle Chicken Curry Rice',
      description: 'Slow-cooked succulent tender chicken curry served with steamed basmati rice and fresh raita',
      dietaryType: DietaryType.NON_VEG,
      price: 190,
      preparationTimeMinutes: 25,
      imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80',
    },
  ];

  const sampleMealPlans: MealPlan[] = [
    {
      id: 'plan-1',
      title: 'Full Student Monthly Subscription',
      description: 'Never worry about meals. Complete daily coverage with vacation pause guarantee during exam breaks.',
      frequency: MealPlanFrequency.MONTHLY,
      dietaryType: DietaryType.VEG,
      price: 3499,
      includesBreakfast: true,
      includesLunch: true,
      includesDinner: true,
    },
    {
      id: 'plan-2',
      title: 'Lunch & Dinner Monthly Plan',
      description: 'Designed for college hostellers eating breakfast in campus canteens. Hot lunch and dinner delivered.',
      frequency: MealPlanFrequency.MONTHLY,
      dietaryType: DietaryType.VEG,
      price: 2699,
      includesBreakfast: false,
      includesLunch: true,
      includesDinner: true,
    },
    {
      id: 'plan-3',
      title: 'Weekly Trial Pack (7 Days)',
      description: 'Test the kitchen quality before committing to monthly plans. Free pause/swap allowed.',
      frequency: MealPlanFrequency.WEEKLY,
      dietaryType: DietaryType.VEG,
      price: 899,
      includesBreakfast: true,
      includesLunch: true,
      includesDinner: true,
    },
  ];

  const addToCart = (dishId: string) => {
    setCart((prev) => ({
      ...prev,
      [dishId]: (prev[dishId] || 0) + 1,
    }));
    success('Added to your meal cart', 'Cart Updated');
  };

  const removeFromCart = (dishId: string) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[dishId] > 1) {
        updated[dishId] -= 1;
      } else {
        delete updated[dishId];
      }
      return updated;
    });
  };

  const cartTotalItems = Object.values(cart).reduce((sum, count) => sum + count, 0);

  const cartTotalPrice = Object.entries(cart).reduce((total, [dishId, count]) => {
    const dish = sampleItems.find((d) => d.id === dishId);
    return total + (dish?.price || 0) * count;
  }, 0);

  const handleSubscribe = async (plan: MealPlan) => {
    if (!isAuthenticated) {
      await demoLogin(UserRole.STUDENT);
    }
    setIsSubscribing(plan.id);
    setTimeout(() => {
      setIsSubscribing(null);
      success(`Subscribed to ${plan.title}! Vacation pause is active.`, 'Subscription Active');
    }, 800);
  };

  const filteredItems = sampleItems.filter((item) => {
    if (dietaryFilter === 'ALL') return true;
    return item.dietaryType === dietaryFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <UtensilsCrossed className="w-3.5 h-3.5" />
            Verified Student Kitchens & Tiffin Mess
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Homely Student Food Marketplace
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Nutritious daily meals delivered to your room, with our signature vacation pause guarantee.
          </p>
        </div>

        {cartTotalItems > 0 && (
          <Button
            variant="emerald"
            size="md"
            onClick={() => setIsCartOpen(true)}
            className="text-xs font-bold"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            View Cart ({cartTotalItems}) • {formatINR(cartTotalPrice)}
          </Button>
        )}
      </div>

      {/* Vacation Meal Pause Banner */}
      <div className="my-6 p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <PauseCircle className="w-8 h-8 text-amber-400 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-white">Student Vacation Pause Guarantee</h3>
            <p className="text-xs text-slate-400">
              Going home for holidays or semester breaks? Pause your subscription anytime and roll over unused meal credits!
            </p>
          </div>
        </div>
        <Badge variant="warning" size="md">
          Zero Wasted Money
        </Badge>
      </div>

      {/* Section 1: Recurring Meal Subscriptions */}
      <div className="my-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Monthly & Weekly Meal Subscriptions
            </h2>
            <p className="text-xs text-slate-400">
              Set-and-forget daily hostel delivery at locked student rates
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sampleMealPlans.map((plan) => (
            <Card
              key={plan.id}
              className="border-slate-800 hover:border-brand-500/50 transition-all flex flex-col justify-between"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <Badge variant="emerald" size="sm">
                    {plan.frequency}
                  </Badge>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {formatINR(plan.price)}
                    <span className="text-xs text-slate-400 font-sans font-normal"> /cycle</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{plan.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{plan.description}</p>
                </div>

                {/* Meal Badges */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      plan.includesBreakfast
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-500 line-through'
                    }`}
                  >
                    Breakfast
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      plan.includesLunch
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-500 line-through'
                    }`}
                  >
                    Lunch
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      plan.includesDinner
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-500 line-through'
                    }`}
                  >
                    Dinner
                  </span>
                </div>

                <Button
                  variant="emerald"
                  size="sm"
                  onClick={() => handleSubscribe(plan)}
                  isLoading={isSubscribing === plan.id}
                  className="w-full text-xs font-semibold mt-2"
                >
                  Subscribe Plan →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Section 2: Daily Rotating Menu Items */}
      <div className="my-10 pt-6 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Today's Fresh Kitchen Menu
            </h2>
            <p className="text-xs text-slate-400">
              Cooked fresh right before delivery by verified local partner kitchens
            </p>
          </div>

          {/* Dietary Filter Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setDietaryFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition ${
                dietaryFilter === 'ALL' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDietaryFilter(DietaryType.VEG)}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                dietaryFilter === DietaryType.VEG ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              <Leaf className="w-3 h-3 text-emerald-400" />
              Veg
            </button>
            <button
              onClick={() => setDietaryFilter(DietaryType.JAIN)}
              className={`px-3 py-1 rounded-lg transition ${
                dietaryFilter === DietaryType.JAIN ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              Jain
            </button>
            <button
              onClick={() => setDietaryFilter(DietaryType.NON_VEG)}
              className={`px-3 py-1 rounded-lg transition ${
                dietaryFilter === DietaryType.NON_VEG ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'
              }`}
            >
              Non-Veg
            </button>
          </div>
        </div>

        {/* Dish Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredItems.map((dish) => {
            const countInCart = cart[dish.id] || 0;

            return (
              <Card key={dish.id} className="overflow-hidden hover:border-slate-700 transition flex flex-col justify-between">
                <div>
                  <div className="h-44 w-full bg-slate-950 overflow-hidden relative">
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          dish.dietaryType === DietaryType.VEG
                            ? 'bg-emerald-500/90 text-white'
                            : dish.dietaryType === DietaryType.JAIN
                            ? 'bg-amber-500/90 text-slate-950'
                            : 'bg-rose-500/90 text-white'
                        }`}
                      >
                        {dish.dietaryType}
                      </span>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-2">
                    <h4 className="text-sm font-bold text-white line-clamp-1">{dish.name}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {dish.description}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      <span>{dish.preparationTimeMinutes} mins prep</span>
                    </div>
                  </CardContent>
                </div>

                <div className="p-4 pt-0 border-t border-slate-800/80 flex items-center justify-between mt-2">
                  <div className="text-base font-black font-mono text-emerald-400">
                    {formatINR(dish.price)}
                  </div>

                  {countInCart > 0 ? (
                    <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg p-1">
                      <button
                        onClick={() => removeFromCart(dish.id)}
                        className="p-1 hover:text-rose-400 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-xs font-mono text-white px-1">
                        {countInCart}
                      </span>
                      <button
                        onClick={() => addToCart(dish.id)}
                        className="p-1 hover:text-emerald-400 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      variant="emerald"
                      size="sm"
                      onClick={() => addToCart(dish.id)}
                      className="text-xs py-1 px-3"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cart Modal */}
      <Modal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        maxWidth="md"
        title="Your Meal Order Cart"
        description="Daily fresh tiffin items scheduled for delivery to your accommodation."
      >
        <div className="space-y-4 pt-2">
          <div className="divide-y divide-slate-800 max-h-60 overflow-y-auto">
            {Object.entries(cart).map(([dishId, count]) => {
              const dish = sampleItems.find((d) => d.id === dishId);
              if (!dish) return null;

              return (
                <div key={dishId} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white">{dish.name}</span>
                    <div className="text-slate-400 font-mono">
                      {formatINR(dish.price)} × {count}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-400">
                      {formatINR(dish.price * count)}
                    </span>
                    <div className="flex items-center gap-1 bg-slate-800 rounded p-0.5">
                      <button
                        onClick={() => removeFromCart(dishId)}
                        className="p-1 hover:text-rose-400"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono px-1 font-bold">{count}</span>
                      <button
                        onClick={() => addToCart(dishId)}
                        className="p-1 hover:text-emerald-400"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-between font-bold text-sm text-white">
            <span>Subtotal</span>
            <span className="font-mono text-emerald-400">{formatINR(cartTotalPrice)}</span>
          </div>

          <Button
            variant="emerald"
            size="md"
            onClick={() => {
              setIsCartOpen(false);
              setCart({});
              success('Your meal order has been sent to the kitchen for preparation!', 'Order Placed');
            }}
            className="w-full text-xs font-bold"
          >
            Confirm & Place Order ({formatINR(cartTotalPrice)})
          </Button>
        </div>
      </Modal>
    </div>
  );
}
