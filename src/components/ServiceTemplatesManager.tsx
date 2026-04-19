import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ServiceTemplate } from '../types';
import { Plus, Trash2, Zap, X, Save } from 'lucide-react';

interface ServiceTemplatesManagerProps {
  services: ServiceTemplate[];
  onAdd: (service: Omit<ServiceTemplate, 'id' | 'tenantId'>) => void;
  onDelete: (id: string) => void;
}

export const ServiceTemplatesManager: React.FC<ServiceTemplatesManagerProps> = ({ 
  services, 
  onAdd, 
  onDelete 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onAdd({
      name: formData.get('name') as string,
      price: Number(formData.get('price'))
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
          <Plus size={16} /> สร้างชื่อบริการใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(svc => (
          <motion.div 
            layout
            key={svc.id}
            className="glass-card p-6 flex flex-col justify-between group hover:border-primary/50 transition-all border-l-4 border-l-primary/20"
          >
            <div>
              <div className="w-10 h-10 bg-accent-soft text-primary rounded-xl flex items-center justify-center mb-4">
                <Zap size={20} />
              </div>
              <h3 className="font-bold text-lg mb-1">{svc.name}</h3>
              <div className="flex gap-4 mb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-text-muted">ราคาปกติ</span>
                  <span className="font-bold text-primary">{svc.price}฿</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-text-muted">แต้มที่ได้รับ (10%)</span>
                  <span className="font-bold text-success">{Math.floor(svc.price / 10)} แต้ม</span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-border/50 flex justify-end">
              <button 
                onClick={() => onDelete(svc.id)}
                className="text-text-muted hover:text-red-500 transition-colors p-2"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}

        {services.length === 0 && !showAddForm && (
          <div className="col-span-full py-12 text-center glass-card border-dashed">
            <p className="text-text-muted italic">ยังไม่มีรายการบริการที่คุณสร้างไว้</p>
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
               <h3 className="text-lg font-bold">สร้างรายการบริการใหม่</h3>
               <button onClick={() => setShowAddForm(false)} className="text-text-muted hover:text-text-main">
                 <X size={20} />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-text-muted block mb-1.5 ml-1">ชื่อบริการ</label>
                <input name="name" required placeholder="เช่น ตัดผมชาย, สปาเล็บ" className="input-field" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-text-muted block mb-1.5 ml-1">ราคาปกติ (บาท)</label>
                <input name="price" type="number" required placeholder="500" className="input-field" />
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
