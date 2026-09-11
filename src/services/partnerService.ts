import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, getDoc } from 'firebase/firestore';
import { DbPartner } from '../types/database';
import { Partner } from '../types';
import { formatDatabaseError } from './errorHandler';

export function mapDbPartnerToPartner(dbId: string, p: any): Partner {
  const initial = Number(p.initial_investment || 0);
  const addl = Number(p.additional_investment || 0);
  return {
    id: dbId,
    name: p.name,
    initialInvestment: initial,
    additionalInvestment: addl,
    totalInvestment: initial + addl,
    withdrawals: Number(p.total_withdrawals || 0),
    ownershipPercentage: Number(p.ownership_percentage || 50),
    createdAt: p.created_at,
    role: 'Managing Partner',
  };
}

export class PartnerService {
  async fetchPartners(): Promise<{ data: Partner[]; error?: string }> {
    try {
      const q = query(collection(db, 'partners'), orderBy('name'));
      const snapshot = await getDocs(q);

      const partners = snapshot.docs.map(docSnap => mapDbPartnerToPartner(docSnap.id, docSnap.data()));
      return { data: partners };
    } catch (err) {
      return { data: [], error: formatDatabaseError(err, 'fetch partner records') };
    }
  }

  async createPartner(params: {
    name: string;
    initialInvestment: number;
    ownershipPercentage?: number;
  }): Promise<{ data: Partner | null; error?: string }> {
    try {
      const payload = {
        name: params.name,
        initial_investment: params.initialInvestment,
        additional_investment: 0,
        total_withdrawals: 0,
        ownership_percentage: params.ownershipPercentage ?? 50,
        created_at: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'partners'), payload);
      return { data: mapDbPartnerToPartner(docRef.id, payload) };
    } catch (err) {
      return { data: null, error: formatDatabaseError(err, 'create partner') };
    }
  }

  async addAdditionalCapital(partnerId: string, amount: number): Promise<{ success: boolean; error?: string }> {
    try {
      const docRef = doc(db, 'partners', partnerId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return { success: false, error: 'Partner not found' };
      }

      const partner = docSnap.data();
      const updated = Number(partner.additional_investment || 0) + Number(amount);
      
      await updateDoc(docRef, { additional_investment: updated });
      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'add partner capital') };
    }
  }

  async recordWithdrawal(partnerName: string, amount: number): Promise<{ success: boolean; error?: string }> {
    try {
      const q = query(collection(db, 'partners'));
      const snapshot = await getDocs(q);
      
      const partnerDoc = snapshot.docs.find(d => d.data().name?.toLowerCase() === partnerName.toLowerCase());

      if (!partnerDoc) {
        return { success: false, error: 'Partner not found' };
      }

      const partner = partnerDoc.data();
      const updated = Number(partner.total_withdrawals || 0) + Number(amount);
      
      await updateDoc(doc(db, 'partners', partnerDoc.id), { total_withdrawals: updated });
      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'record partner withdrawal') };
    }
  }

  async updatePartner(id: string, updates: Partial<DbPartner>): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(db, 'partners', id), updates as any);
      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'update partner') };
    }
  }

  async deletePartner(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, 'partners', id));
      return { success: true };
    } catch (err) {
      return { success: false, error: formatDatabaseError(err, 'delete partner') };
    }
  }
}

export const partnerService = new PartnerService();
