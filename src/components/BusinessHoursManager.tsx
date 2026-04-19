import React from 'react';
import { BusinessDay } from '../types';
import { Clock, Moon, Sun } from 'lucide-react';

interface BusinessHoursManagerProps {
  businessHours: BusinessDay[];
  isEditing: boolean;
  onUpdate: (hours: BusinessDay[]) => void;
}

const DAYS = [
  'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์', 'วันอาทิตย์'
];

export const BusinessHoursManager: React.FC<BusinessHoursManagerProps> = ({ 
  businessHours, 
  isEditing, 
  onUpdate 
}) => {
  // Initialize default hours if empty
  const hours = businessHours.length === 7 ? businessHours : DAYS.map(day => ({
    day,
    open: '09:00',
    close: '20:00',
    isOpen: true
  }));

  const handleChange = (index: number, field: keyof BusinessDay, value: any) => {
    const newHours = [...hours];
    newHours[index] = { ...newHours[index], [field]: value };
    onUpdate(newHours);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={16} className="text-primary" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">เวลาเปิด-ปิดร้าน</h4>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {hours.map((bh, idx) => (
          <div key={bh.day} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-3xl border transition-all ${bh.isOpen ? 'bg-white border-border shadow-sm' : 'bg-bg/50 border-border/50 opacity-60'}`}>
            <div className="flex items-center gap-3 mb-4 sm:mb-0">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black ring-1 ring-inset flex-shrink-0 ${bh.isOpen ? 'bg-primary/5 text-primary ring-primary/20' : 'bg-neutral-50 text-text-muted ring-border'}`}>
                  {bh.day.substring(3, 4)}
               </div>
               <div className="flex flex-col">
                  <span className="text-sm font-bold min-w-[80px]">{bh.day}</span>
                  {isEditing && (
                    <label className="relative inline-flex items-center cursor-pointer mt-1">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={bh.isOpen}
                        onChange={(e) => handleChange(idx, 'isOpen', e.target.checked)}
                      />
                      <div className="w-8 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-primary"></div>
                      <span className="ml-2 text-[9px] font-black text-text-muted uppercase tracking-tighter">{bh.isOpen ? 'เปิด' : 'ปิด'}</span>
                    </label>
                  )}
                  {!isEditing && (
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase w-fit mt-1 ${bh.isOpen ? 'bg-green-100/50 text-green-700' : 'bg-red-100/50 text-red-700'}`}>
                       {bh.isOpen ? 'เปิด' : 'ปิดทำการ'}
                    </span>
                  )}
               </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
               <div className="flex-1 sm:flex-none flex items-center gap-2 bg-bg px-3 py-2.5 rounded-2xl border border-border/50 focus-within:border-primary transition-colors">
                  <Sun size={12} className="text-amber-500 flex-shrink-0" />
                  {isEditing ? (
                    <input 
                      type="time" 
                      value={bh.open}
                      disabled={!bh.isOpen}
                      onChange={(e) => handleChange(idx, 'open', e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="bg-transparent text-xs font-bold outline-none disabled:opacity-30 w-full min-w-[70px] cursor-pointer relative z-10"
                    />
                  ) : (
                    <span className="text-xs font-bold">{bh.isOpen ? bh.open : '--:--'}</span>
                  )}
               </div>
               <span className="text-text-muted text-[10px] font-bold uppercase opacity-40">to</span>
               <div className="flex-1 sm:flex-none flex items-center gap-2 bg-bg px-3 py-2.5 rounded-2xl border border-border/50 focus-within:border-primary transition-colors">
                  <Moon size={12} className="text-indigo-400 flex-shrink-0" />
                  {isEditing ? (
                    <input 
                      type="time" 
                      value={bh.close}
                      disabled={!bh.isOpen}
                      onChange={(e) => handleChange(idx, 'close', e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="bg-transparent text-xs font-bold outline-none disabled:opacity-30 w-full min-w-[70px] cursor-pointer relative z-10"
                    />
                  ) : (
                    <span className="text-xs font-bold">{bh.isOpen ? bh.close : '--:--'}</span>
                  )}
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
