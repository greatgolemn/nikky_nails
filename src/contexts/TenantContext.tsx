import React, { createContext, useContext, useEffect, useState } from 'react';
import { db, doc, onSnapshot, collection, query, where } from '../firebase';
import { useAuth } from './AuthContext';
import { Tenant, ShopConfig, Branch } from '../types';

interface TenantContextValue {
  tenantId: string;
  tenant: Tenant | null;
  shopConfig: ShopConfig;
  branches: Branch[];
  loading: boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tenantId } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [shopConfig, setShopConfig] = useState<ShopConfig>({ shopName: 'NailSaaS' });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Listen to tenant document
  useEffect(() => {
    if (!tenantId) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, 'tenants', tenantId), (snapshot) => {
      if (snapshot.exists()) {
        setTenant({ id: snapshot.id, ...snapshot.data() } as Tenant);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [tenantId]);

  // Listen to shop config
  useEffect(() => {
    if (!tenantId) return;

    const unsub = onSnapshot(doc(db, 'shopConfig', tenantId), (snapshot) => {
      if (snapshot.exists()) {
        setShopConfig(snapshot.data() as ShopConfig);
      }
    });

    return () => unsub();
  }, [tenantId]);

  // Listen to branches
  useEffect(() => {
    if (!tenantId) return;

    const q = query(
      collection(db, 'branches'),
      where('tenantId', '==', tenantId)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setBranches(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Branch)));
    });

    return () => unsub();
  }, [tenantId]);

  if (!tenantId) {
    return <>{children}</>;
  }

  return (
    <TenantContext.Provider value={{ tenantId, tenant, shopConfig, branches, loading }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextValue => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within a TenantProvider (user must have a tenantId)');
  return ctx;
};
