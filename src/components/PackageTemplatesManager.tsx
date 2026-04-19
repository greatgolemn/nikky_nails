import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PackageTemplate } from '../types';
import { Plus, Trash2, CreditCard, X, Save } from 'lucide-react';

interface PackageTemplatesManagerProps {
  templates: PackageTemplate[];
  onAdd: (template: Omit<PackageTemplate, 'id' | 'tenantId'>) => void;
  onDelete: (id: string) => void;
}

export const PackageTemplatesManager: React.FC<PackageTemplatesManagerProps> = ({ 
  templates, 
  onAdd, 
  onDelete 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onAdd({
      title: formData.get('title') as string,
      price: Number(formData.get('price')),
      sessions: Number(formData.get('sessions'))
    });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-4">
        <div className="hidden md:block"></div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm shadow-md"
        >
          <Plus size={16} /> สร้างแพ็กเกจใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(tpl => (
          <motion.div 
            layout
            key={tpl.id}
            className="glass-card p-6 flex flex-col justify-between group hover:border-primary/50 transition-all"
          >
            <div>
              <div className="w-10 h-10 bg-accent-soft text-primary rounded-xl flex items-center justify-center mb-4">
                <CreditCard size={20} />
              </div>
              <h3 className="font-bold text-lg mb-1">{tpl.title}</h3>
              <div className="flex gap-4 mb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-text-muted">ราคา</span>
                  <span className="font-bold text-primary">{tpl.price}฿</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-text-muted">จำนวนครั้ง</span>
                  <span className="font-bold text-text-main">{tpl.sessions} ครั้ง</span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-border/50 flex justify-end">
              <button 
                onClick={() => onDelete(tpl.id)}
                className="text-text-muted hover:text-red-500 transition-colors p-2"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}

        {templates.length === 0 && !showAddForm && (
          <div className="col-span-full py-12 text-center glass-card border-dashed">
            <p className="text-text-muted italic">ยังไม่มีรายการแพ็กเกจที่คุณสร้างไว้</p>
          </div>
        )}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-sm p-8 space-y-6 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-2">
               <h3 className="text-lg font-bold">สร้างแพ็กเกจใหม่</h3>
               <button onClick={() => setShowAddForm(false)} className="text-text-muted hover:text-text-main">
                 <X size={20} />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-text-muted block mb-1.5 ml-1">ชื่อแพ็กเกจ</label>
                <input name="title" required placeholder="เช่น ทาสีเจล 10 ครั้ง" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-muted block mb-1.5 ml-1">ราคา (บาท)</label>
                  <input name="price" type="number" required placeholder="2500" className="input-field" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-muted block mb-1.5 ml-1">จำนวนครั้ง</label>
                  <input name="sessions" type="number" required placeholder="10" className="input-field" />
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full btn-primary py-3 flex items-center justify-center gap-2 font-bold">
                  <Save size={18} /> บันทึกข้อมูล
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
