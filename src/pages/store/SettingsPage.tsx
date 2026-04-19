import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Users, Calendar, Save, Edit, Plus, X, MapPin, Phone, Trash2, Map as MapIcon, Image as ImageIcon, MessageCircle, Copy, CheckCircle2 } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { db, doc, setDoc, addDoc, deleteDoc, updateDoc, collection, serverTimestamp, handleFirestoreError, OperationType, storage, ref, uploadBytes, getDownloadURL } from '../../firebase';
import { BusinessHoursManager } from '../../components/BusinessHoursManager';
import { MapPicker } from '../../components/MapPicker';
import { Branch } from '../../types';

export const SettingsPage: React.FC = () => {
  const { tenantId, tenant, shopConfig, branches } = useTenant();
  const [isEditingShopInfo, setIsEditingShopInfo] = useState(false);
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [isEditingTheme, setIsEditingTheme] = useState(false);
  const [isEditingLine, setIsEditingLine] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [tempBusinessHours, setTempBusinessHours] = useState<any[]>([]);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Theme states
  const [primaryColor, setPrimaryColor] = useState(shopConfig.theme?.primaryColor || '#C89595');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleUpdateShopConfig = async (config: any) => {
    try {
      await setDoc(doc(db, 'shopConfig', tenantId), { ...shopConfig, ...config }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'shopConfig');
    }
  };

  const handleUpdateTenant = async (updates: any) => {
    try {
      await updateDoc(doc(db, 'tenants', tenantId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'tenants');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const storageRef = ref(storage, `tenants/${tenantId}/logo_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      await handleUpdateShopConfig({
        theme: { ...shopConfig.theme, primaryColor, logoUrl: url }
      });
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const copyWebhookUrl = () => {
    const url = `${window.location.origin}/api/line-webhook/${tenantId}`;
    navigator.clipboard.writeText(url);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
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
          <p className="text-sm text-text-muted">จัดการข้อมูลพื้นฐาน พิกัดตำแหน่ง ธีม และการเชื่อมต่อ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Basic Info & Branding */}
        <div className="lg:col-span-2 space-y-8">
          
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
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
        </div>

        {/* Right Column: Theme & Integrations */}
        <div className="space-y-8">
          
          {/* Branding & Theme */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-border bg-accent-soft/30 flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                <ImageIcon size={16} /> อัตลักษณ์และธีม
              </h3>
              <button 
                onClick={() => setIsEditingTheme(!isEditingTheme)}
                className="text-xs text-primary font-bold hover:underline"
              >
                {isEditingTheme ? 'ยกเลิก' : 'แก้ไขธีม'}
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex flex-col items-center justify-center space-y-4 pt-2">
                <div 
                  className="w-24 h-24 rounded-full border-2 border-dashed border-border flex flex-col items-center justify-center overflow-hidden relative group bg-bg"
                  style={{ borderColor: primaryColor }}
                >
                  {shopConfig.theme?.logoUrl ? (
                    <img src={shopConfig.theme.logoUrl} alt="Shop Logo" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={24} className="text-text-muted opacity-50" />
                  )}
                  {isEditingTheme && (
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex flex-col items-center justify-center text-white text-[10px] font-bold">
                      {uploadingLogo ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูป'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                      />
                    </label>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-text-muted">โลโก้ร้านค้า</p>
                </div>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                await handleUpdateShopConfig({ theme: { ...shopConfig.theme, primaryColor } });
                setIsEditingTheme(false);
              }} className="space-y-4 border-t border-border/50 pt-6">
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-muted mb-2 block ml-1">สีหลักของร้าน (Primary Color)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      name="primaryColor"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      disabled={!isEditingTheme}
                      className="w-12 h-12 rounded-xl cursor-pointer border-0 outline-none p-1 bg-white shadow-sm" 
                    />
                    <input 
                      type="text" 
                      value={primaryColor.toUpperCase()}
                      readOnly
                      className="input-field flex-1 font-mono text-sm tracking-widest text-text-muted bg-bg/50" 
                    />
                  </div>
                </div>

                {isEditingTheme && (
                  <button type="submit" className="w-full btn-primary py-2.5 mt-2 flex justify-center gap-2">
                    <Save size={16} /> บันทึกธีม
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* LINE OA Integration */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-border bg-[#06C755]/10 flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase tracking-wider text-[#06C755] flex items-center gap-2">
                <MessageCircle size={16} /> ตั้งค่า LINE OA
              </h3>
              <button 
                onClick={() => setIsEditingLine(!isEditingLine)}
                className="text-xs text-[#06C755] font-bold hover:underline"
              >
                {isEditingLine ? 'ยกเลิก' : 'แก้ไข'}
              </button>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-xs text-text-muted leading-relaxed">
                เชื่อมต่อ LINE Official Account เพื่อรับลูกค้าและแจ้งเตือนอัตโนมัติ
              </p>
              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                await handleUpdateTenant({
                  lineConfig: {
                    channelAccessToken: formData.get('channelAccessToken') as string,
                    channelSecret: formData.get('channelSecret') as string,
                  }
                });
                setIsEditingLine(false);
              }} className="space-y-4">
                
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-muted mb-2 block ml-1">Channel Access Token</label>
                  <input
                    name="channelAccessToken"
                    type="password"
                    defaultValue={tenant?.lineConfig?.channelAccessToken}
                    readOnly={!isEditingLine}
                    className={`input-field w-full text-xs font-mono ${!isEditingLine ? 'bg-bg/50' : 'bg-white'}`}
                    placeholder="eyJhbGciOiJIUzI1NiJ9..."
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-muted mb-2 block ml-1">Channel Secret</label>
                  <input
                    name="channelSecret"
                    type="password"
                    defaultValue={tenant?.lineConfig?.channelSecret}
                    readOnly={!isEditingLine}
                    className={`input-field w-full text-xs font-mono ${!isEditingLine ? 'bg-bg/50' : 'bg-white'}`}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>

                {isEditingLine && (
                  <button type="submit" className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white py-2.5 rounded-xl text-sm font-bold transition-all flex justify-center gap-2 shadow-lg shadow-[#06C755]/20 mt-4">
                    <Save size={16} /> บันทึกการเชื่อมต่อ
                  </button>
                )}
              </form>

              {!isEditingLine && (
                <div className="pt-6 border-t border-border/50">
                  <label className="text-[10px] uppercase font-bold text-text-muted mb-2 block ml-1">Webhook URL (นำไปใส่ใน LINE Developers)</label>
                  <div className="flex items-center gap-2 bg-text-main text-white p-1 pl-4 rounded-xl border border-border shadow-inner">
                    <span className="font-mono text-xs opacity-90 truncate flex-1 block overflow-hidden" title={`${window.location.origin}/api/line-webhook/${tenantId}`}>
                      {window.location.origin}/api/line-webhook/{tenantId}
                    </span>
                    <button 
                      onClick={copyWebhookUrl}
                      className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                    >
                      {copiedWebhook ? <CheckCircle2 size={16} className="text-[#06C755]" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-text-muted mt-2 leading-relaxed ml-1">
                     *หากเชื่อมต่อเรียบร้อยแล้ว ระบบจะสามารถรับแจ้งเตือนจากลูกค้าที่ทักเข้ามาได้
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-8 pt-0 space-y-6">
              <div className="pt-6 border-t border-border/50">
                <h4 className="font-bold text-sm text-text-main mb-2">ลิงก์สำหรับ Rich Menu (LIFF App)</h4>
                <p className="text-xs text-text-muted leading-relaxed mb-4">
                  คัดลอกลิงก์ด้านล่างนี้ไปใส่ในแชทบอท หรือ ริชเมนู (Rich Menu) ของ LINE OA ของคุณ เพื่อเปิดหน้า **ระบบจองคิว** บนมือถือของลูกค้า
                </p>
                <div className="flex items-center gap-2 bg-[#06C755]/10 text-[#06C755] p-1 pl-4 rounded-xl border border-[#06C755]/20 shadow-inner">
                  <span className="font-mono text-xs font-bold truncate flex-1 block overflow-hidden" title={`https://liff.line.me/${(import.meta as any).env.VITE_MASTER_LIFF_ID || '16xxxxxx-xxxxxx'}?tenantId=${tenantId}`}>
                    https://liff.line.me/{(import.meta as any).env.VITE_MASTER_LIFF_ID || '16xxxxxx-xxxxxx'}?tenantId={tenantId}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`https://liff.line.me/${(import.meta as any).env.VITE_MASTER_LIFF_ID || '16xxxxxx-xxxxxx'}?tenantId=${tenantId}`);
                      alert('คัดลอกลิงก์ LIFF สำหรับเข้าหน้าระบบจองคิวเรียบร้อยแล้ว');
                    }}
                    className="p-2.5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-lg transition-colors flex-shrink-0"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};
