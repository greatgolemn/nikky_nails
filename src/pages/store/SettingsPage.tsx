import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Users, Calendar, Save, Edit, Plus, X, MapPin, Phone, Trash2, Map as MapIcon } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { db, doc, setDoc, addDoc, deleteDoc, updateDoc, collection, serverTimestamp, handleFirestoreError, OperationType } from '../../firebase';
import { BusinessHoursManager } from '../../components/BusinessHoursManager';
import { MapPicker } from '../../components/MapPicker';
import { Branch } from '../../types';

export const SettingsPage: React.FC = () => {
  const { tenantId, shopConfig, branches } = useTenant();
  const [isEditingShopInfo, setIsEditingShopInfo] = useState(false);
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [tempBusinessHours, setTempBusinessHours] = useState<any[]>([]);

  const handleUpdateShopConfig = async (config: any) => {
    try {
      await setDoc(doc(db, 'shopConfig', tenantId), { ...shopConfig, ...config }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'shopConfig');
    }
  };

  const handleAddBranch = async (branch: Omit<Branch, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'branches'), { ...branch, tenantId, createdAt: serverTimestamp() });
      setShowAddBranch(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'branches');
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm('ยืนยันการลบสาขานี้?')) return;
    try {
      await deleteDoc(doc(db, 'branches', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'branches');
    }
  };

  const handleUpdateBranch = async (id: string, branch: Partial<Branch>) => {
    try {
      await updateDoc(doc(db, 'branches', id), branch);
      setEditingBranch(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'branches');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-8 py-8">
      <div className="flex items-center gap-4 mb-8 px-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Settings size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">ตั้งค่าระบบ</h2>
          <p className="text-sm text-text-muted">จัดการข้อมูลพื้นฐาน พิกัดตำแหน่ง และเวลาทำการ</p>
        </div>
      </div>

      {/* Shop Info & Business Hours */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-border bg-accent-soft/30">
          <h3 className="font-bold text-sm uppercase tracking-wider text-primary">ข้อมูลร้านค้าและการตั้งค่า</h3>
        </div>
        <div className="p-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleUpdateShopConfig({
                shopName: formData.get('shopName') as string,
                shopPhone: formData.get('shopPhone') as string,
                businessHours: tempBusinessHours.length > 0 ? tempBusinessHours : shopConfig.businessHours,
              });
              setIsEditingShopInfo(false);
              setIsEditingHours(false);
            }}
            className="space-y-12"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <Users size={14} className="text-primary" /> ข้อมูลพื้นฐาน
                  </h4>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-muted mb-2 block ml-1">ชื่อร้านค้า</label>
                    <input
                      name="shopName"
                      defaultValue={shopConfig.shopName}
                      readOnly={!isEditingShopInfo}
                      className={`input-field w-full ${!isEditingShopInfo ? 'bg-bg/50 border-transparent' : 'bg-white'}`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-muted mb-2 block ml-1">เบอร์โทรศัพท์</label>
                    <input
                      name="shopPhone"
                      readOnly={!isEditingShopInfo}
                      defaultValue={shopConfig.shopPhone}
                      className={`input-field w-full ${!isEditingShopInfo ? 'bg-bg/50 border-transparent' : 'bg-white'}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingShopInfo(!isEditingShopInfo)}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${isEditingShopInfo ? 'bg-red-50 text-red-600' : 'btn-secondary'}`}
                  >
                    {isEditingShopInfo ? 'ยกเลิกการแก้ไข' : 'แก้ไขข้อมูลพื้นฐาน'}
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                    <Calendar size={14} className="text-primary" /> เวลาทำการ
                  </h4>
                </div>
                <BusinessHoursManager
                  businessHours={tempBusinessHours.length > 0 ? tempBusinessHours : (shopConfig.businessHours || [])}
                  isEditing={isEditingHours}
                  onUpdate={setTempBusinessHours}
                />
                <button
                  type="button"
                  onClick={() => setIsEditingHours(!isEditingHours)}
                  className={`w-full mt-4 py-2.5 rounded-xl text-xs font-bold transition-all ${isEditingHours ? 'bg-red-50 text-red-600' : 'btn-secondary'}`}
                >
                  {isEditingHours ? 'ยกเลิกการแก้ไขเวลาทำการ' : 'แก้ไขเวลาทำการ'}
                </button>
              </div>
            </div>

            {(isEditingShopInfo || isEditingHours) && (
              <div className="flex justify-end pt-8 border-t border-border/50">
                <button type="submit" className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm">
                  <Save size={16} /> บันทึกข้อมูลที่แก้ไข
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Branches */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-border bg-accent-soft/30 flex justify-between items-center">
          <h3 className="font-bold text-sm uppercase tracking-wider text-primary">จัดการสาขา</h3>
          <button
            onClick={() => setShowAddBranch(true)}
            className="btn-primary py-2 px-4 text-xs flex items-center gap-2 shadow-sm"
          >
            <Plus size={14} /> เพิ่มสาขาใหม่
          </button>
        </div>
        <div className="p-8 space-y-6">
          {(showAddBranch || editingBranch) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-accent-soft/10 p-6 rounded-3xl border border-primary/10 space-y-4 mb-4"
            >
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm">{editingBranch ? 'แก้ไขข้อมูลสาขา' : 'ข้อมูลสาขาใหม่'}</h4>
                <button onClick={() => { setShowAddBranch(false); setEditingBranch(null); }} className="text-text-muted hover:text-text-main group">
                  <X size={16} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const lat = Number(formData.get('lat'));
                const lng = Number(formData.get('lng'));
                if (!lat || !lng) { alert('กรุณาปักหมุดตำแหน่งร้านบนแผนที่'); return; }

                if (editingBranch) {
                  handleUpdateBranch(editingBranch.id, {
                    name: formData.get('name') as string,
                    phone: formData.get('phone') as string,
                    lat, lng,
                    address: formData.get('address') as string,
                  });
                } else {
                  handleAddBranch({
                    tenantId,
                    name: formData.get('name') as string,
                    phone: formData.get('phone') as string,
                    lat, lng,
                    address: formData.get('address') as string,
                  });
                }
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block ml-1">ชื่อสาขา</label>
                    <input name="name" required defaultValue={editingBranch?.name} placeholder="เช่น สาขาสยาม" className="input-field w-full" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block ml-1">เบอร์โทรสาขา</label>
                    <input name="phone" defaultValue={editingBranch?.phone} placeholder="08x-xxx-xxxx" className="input-field w-full" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block ml-1">ที่อยู่สาขา</label>
                  <input name="address" defaultValue={editingBranch?.address} placeholder="เลขที่, อาคาร, ถนน..." className="input-field w-full" />
                </div>
                <div className="pt-2">
                  <label className="text-[10px] uppercase font-bold text-text-muted mb-2 block ml-1">ปักหมุดตำแหน่ง</label>
                  <MapPicker
                    initialPos={editingBranch ? { lat: editingBranch.lat, lng: editingBranch.lng } : undefined}
                    onSelect={(pos) => {
                      const latInput = document.getElementById('branch-lat') as HTMLInputElement;
                      const lngInput = document.getElementById('branch-lng') as HTMLInputElement;
                      if (latInput && lngInput) { latInput.value = pos.lat.toString(); lngInput.value = pos.lng.toString(); }
                    }}
                  />
                  <input type="hidden" name="lat" id="branch-lat" defaultValue={editingBranch?.lat} />
                  <input type="hidden" name="lng" id="branch-lng" defaultValue={editingBranch?.lng} />
                </div>
                <button type="submit" className="w-full btn-primary py-3.5 shadow-lg shadow-primary/20">
                  {editingBranch ? 'บันทึกการแก้ไข' : 'บันทึกสาขา'}
                </button>
              </form>
            </motion.div>
          )}

          <div className="space-y-3">
            {branches.length === 0 ? (
              <div className="text-center py-12 bg-bg/50 rounded-3xl border border-dashed border-border flex flex-col items-center">
                <MapIcon size={32} className="text-neutral-100 mb-2" />
                <p className="text-sm text-text-muted italic">ยังไม่มีข้อมูลสาขา</p>
                <button onClick={() => setShowAddBranch(true)} className="mt-4 text-xs text-primary font-bold hover:underline">เพิ่มสาขาแรกของคุณ</button>
              </div>
            ) : (
              branches.map(branch => (
                <div key={branch.id} className="bg-white p-5 rounded-2xl border border-border flex items-center justify-between gap-4 group hover:shadow-sm transition-all border-l-4 border-l-primary/30 min-w-0">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm tracking-tight truncate">{branch.name}</div>
                      <div className="text-[10px] text-text-muted flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                        {branch.phone && <span className="flex items-center gap-1"><Phone size={10} />{branch.phone}</span>}
                        {branch.address && <span className="truncate">• {branch.address}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${branch.lat},${branch.lng}`}
                      target="_blank" rel="noreferrer"
                      className="p-2 text-primary hover:bg-accent-soft rounded-lg transition-colors"
                    >
                      <MapIcon size={18} />
                    </a>
                    <button onClick={() => { setEditingBranch(branch); setShowAddBranch(false); }} className="p-2 text-text-muted hover:bg-neutral-100 rounded-lg transition-colors">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDeleteBranch(branch.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
