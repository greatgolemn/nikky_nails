import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useTenant } from '../../contexts/TenantContext';
import { db, collection, onSnapshot, query, where, orderBy, doc, updateDoc, deleteDoc, handleFirestoreError, OperationType } from '../../firebase';
import { BookingManager } from '../../components/BookingManager';
import { Booking } from '../../types';

export const BookingsPage: React.FC = () => {
  const { tenantId } = useTenant();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'bookings'),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'bookings'));
    return () => unsub();
  }, [tenantId]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'bookings', id), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'bookings');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'bookings', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'bookings');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <BookingManager
        bookings={bookings}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDelete}
      />
    </motion.div>
  );
};
