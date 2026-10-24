import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Store, Package, Check, Sparkles, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/UI/dialog';
import { Button } from '@/components/UI/button';
import { cn } from '@/lib/utils';
import api from '@/api/axios';
import { setWorkspaceMode } from '@/redux/authSlice';

export default function WorkspaceModeModal({ open, onClose }) {
  const dispatch = useDispatch();
  const [selected, setSelected] = useState('storefront');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await api.put('/users/profile', { workspaceMode: selected });
      dispatch(setWorkspaceMode(selected));
      onClose();
    } catch (err) {
      console.error('Failed to save workspace mode:', err);
      // Fallback: update Redux so the user experience isn't blocked
      dispatch(setWorkspaceMode(selected));
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-6 overflow-hidden">
        <DialogHeader className="space-y-1.5 pb-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <Sparkles className="h-3.5 w-3.5" />
            Personalize Your Experience
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
            Welcome to QRVibe! What are you building?
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Choose your primary use case. We’ll tailor your navigation, templates, and dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2 pt-2">
          {/* Option 1: In-Store Storefront */}
          <div
            onClick={() => setSelected('storefront')}
            className={cn(
              "relative flex flex-col justify-between rounded-xl border-2 p-4 cursor-pointer transition-all",
              selected === 'storefront'
                ? "border-indigo-600 bg-indigo-50/40 shadow-sm"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
            )}
          >
            {selected === 'storefront' && (
              <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
            )}
            <div className="space-y-2.5">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                selected === 'storefront' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
              )}>
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">In-Store Storefront</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  For cafes, salons, clinics, retail shops, and walk-in businesses.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-1">
              <span className="inline-block text-[11px] font-medium text-slate-600">
                ✓ Visual Digital Menus & Rate Cards
              </span>
              <span className="inline-block text-[11px] font-medium text-slate-600">
                ✓ AI Google Review Booster & Shield
              </span>
              <span className="inline-block text-[11px] font-medium text-slate-600">
                ✓ 2-Sided Table Standee Templates
              </span>
            </div>
          </div>

          {/* Option 2: Marketing & D2C */}
          <div
            onClick={() => setSelected('marketing')}
            className={cn(
              "relative flex flex-col justify-between rounded-xl border-2 p-4 cursor-pointer transition-all",
              selected === 'marketing'
                ? "border-indigo-600 bg-indigo-50/40 shadow-sm"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
            )}
          >
            {selected === 'marketing' && (
              <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
            )}
            <div className="space-y-2.5">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                selected === 'marketing' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
              )}>
                <Package className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Marketing & D2C</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  For product packaging, omnichannel marketing, agencies, and brands.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-1">
              <span className="inline-block text-[11px] font-medium text-slate-600">
                ✓ Full CRM & Folder Organization
              </span>
              <span className="inline-block text-[11px] font-medium text-slate-600">
                ✓ UTM Tag & Campaign Attribution
              </span>
              <span className="inline-block text-[11px] font-medium text-slate-600">
                ✓ OS, Browser & Geo Scan Breakdowns
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 mt-1 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Switch anytime in <span className="font-medium text-slate-600">Settings → Profile</span>
          </p>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
            {loading ? 'Setting up...' : (
              <>
                Continue to Dashboard
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
