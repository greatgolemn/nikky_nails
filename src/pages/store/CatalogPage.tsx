import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useTenant } from '../../contexts/TenantContext';
import { db, collection, onSnapshot, query, where, orderBy, addDoc, deleteDoc, doc, handleFirestoreError, OperationType } from '../../firebase';
import { PackageTemplatesManager } from '../../components/PackageTemplatesManager';
import { ServiceTemplatesManager } from '../../components/ServiceTemplatesManager';
import { PackageTemplate, ServiceTemplate } from '../../types';

export const CatalogPage: React.FC = () => {
  const { tenantId } = useTenant();
  const [activeTab, setActiveTab] = useState<'packages' | 'services'>('packages');
  const [packageTemplates, setPackageTemplates] = useState<PackageTemplate[]>([]);
  const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplate[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'packageTemplates'), where('tenantId', '==', tenantId));
    const unsub = onSnapshot(q, (snap) => {
      setPackageTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() } as PackageTemplate)));
    });
    return () => unsub();
  }, [tenantId]);

  useEffect(() => {
    const q = query(collection(db, 'serviceTemplates'), where('tenantId', '==', tenantId));
    const unsub = onSnapshot(q, (snap) => {
      setServiceTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceTemplate)));
    });
    return () => unsub();
  }, [tenantId]);

  const handleAddTemplate = async (template: Omit<PackageTemplate, 'id'>) => {
    try {
      await addDoc(collection(db, 'packageTemplates'), { ...template, tenantId });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'packageTemplates');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'packageTemplates', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'packageTemplates');
    }
  };

  const handleAddService = async (service: Omit<ServiceTemplate, 'id'>) => {
    try {
      await addDoc(collection(db, 'serviceTemplates'), { ...service, tenantId });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'serviceTemplates');
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'serviceTemplates', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'serviceTemplates');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-6 pt-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 bg-white p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">แคตตาล็อกร้านค้า</h2>
          <p className="text-sm text-text-muted mt-1">ตั้งค่าชื่อบริการและแพ็กเกจ</p>
        </div>
        <div className="flex bg-accent-soft/30 p-1.5 rounded-xl border border-border/50">
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'packages' ? 'bg-primary text-white shadow-md ring-1 ring-primary' : 'text-text-muted hover:text-text-main'}`}
          >
            แพ็กเกจเหมาจ่าย
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'services' ? 'bg-primary text-white shadow-md ring-1 ring-primary' : 'text-text-muted hover:text-text-main'}`}
          >
            บริการ (รายครั้ง)
          </button>
        </div>
      </div>

      {activeTab === 'packages' ? (
        <PackageTemplatesManager
          templates={packageTemplates}
          onAdd={handleAddTemplate}
          onDelete={handleDeleteTemplate}
        />
      ) : (
        <ServiceTemplatesManager
          services={serviceTemplates}
          onAdd={handleAddService}
          onDelete={handleDeleteService}
        />
      )}
    </motion.div>
  );
};
