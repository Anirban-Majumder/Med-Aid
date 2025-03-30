"use client";
import { useContext, useState, useEffect } from 'react';
import { createClient } from "@/lib/supabase/client";
import { SessionContext } from "@/lib/supabase/usercontext";
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Search, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface MedDetails {
  id: number;
  name: string;
  price: number;
  is_discontinued: boolean;
  manufacturer_name: string;
  type: string;
  pack_size_label: string;
  short_composition1: string;
  short_composition2: string;
  salt_composition: string;
  medicine_desc: string;
  side_effects: string;
  drug_interactions: string;
  verified: boolean;
  verified_by: string;
}

const UnverifiedMedicinesPage = () => {
  const { sessionData } = useContext(SessionContext);
  const [medicines, setMedicines] = useState<MedDetails[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<MedDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const supabase = createClient();

  // Fetch unverified medicine records
  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('med_details')
        .select('*')
        .eq('verified', false)
        .ilike('name', `%${searchTerm}%`)
        .limit(20);

      if (error) throw error;
      setMedicines(data || []);
    } catch (error) {
      console.error("Error fetching medicines:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [searchTerm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!selectedMedicine) return;
    setSelectedMedicine({
      ...selectedMedicine,
      [e.target.name]: e.target.type === 'number' ? Number(e.target.value) : e.target.value,
    });
  };

  const handleApprove = async () => {
    if (!selectedMedicine || !sessionData?.session?.user?.id) return;
    setUpdating(true);

    try {
      const { error } = await supabase
        .from('med_details')
        .update({
          name: selectedMedicine.name,
          price: selectedMedicine.price,
          is_discontinued: selectedMedicine.is_discontinued,
          manufacturer_name: selectedMedicine.manufacturer_name,
          type: selectedMedicine.type,
          pack_size_label: selectedMedicine.pack_size_label,
          short_composition1: selectedMedicine.short_composition1,
          short_composition2: selectedMedicine.short_composition2,
          salt_composition: selectedMedicine.salt_composition,
          medicine_desc: selectedMedicine.medicine_desc,
          side_effects: selectedMedicine.side_effects,
          drug_interactions: selectedMedicine.drug_interactions,
          verified: true,
          verified_by: sessionData.session.user.id
        })
        .eq('id', selectedMedicine.id);

      if (error) throw error;

      setMedicines(medicines.filter(med => med.id !== selectedMedicine.id));
      setSelectedMedicine(null);
    } catch (error) {
      console.error("Error updating record:", error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-100 via-blue-50 to-zinc-200 dark:from-zinc-900 dark:via-blue-900/10 dark:to-zinc-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center mb-4 md:mb-0">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent">
              Medicine Verification
            </h1>
            <Button variant="outline" asChild className="ml-4">
              <Link href="/doctor/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <div className="relative w-full md:w-96">
            <Input
              type="text"
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medicines.map((med) => (
              <Card
                key={med.id}
                className="bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                onClick={() => setSelectedMedicine(med)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{med.name}</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{med.manufacturer_name}</p>
                    </div>
                    <span className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-200 rounded-full">
                      Pending
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400">Type</span>
                      <span>{med.type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400">Pack Size</span>
                      <span>{med.pack_size_label}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400">Price</span>
                      <span>₹{med.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {selectedMedicine && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl bg-white dark:bg-zinc-800 overflow-y-auto max-h-[90vh]">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Verify Medicine Details</h2>
                  <Button variant="outline" onClick={() => setSelectedMedicine(null)}>
                    Close
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <Input
                        name="name"
                        value={selectedMedicine.name}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Manufacturer</label>
                      <Input
                        name="manufacturer_name"
                        value={selectedMedicine.manufacturer_name}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <Input
                        name="type"
                        value={selectedMedicine.type}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Pack Size</label>
                      <Input
                        name="pack_size_label"
                        value={selectedMedicine.pack_size_label}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Price</label>
                      <Input
                        type="number"
                        name="price"
                        value={selectedMedicine.price}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Composition</label>
                      <textarea
                        name="salt_composition"
                        value={selectedMedicine.salt_composition}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        name="medicine_desc"
                        value={selectedMedicine.medicine_desc}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Side Effects</label>
                      <textarea
                        name="side_effects"
                        value={selectedMedicine.side_effects}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Drug Interactions</label>
                      <textarea
                        name="drug_interactions"
                        value={selectedMedicine.drug_interactions}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setSelectedMedicine(null)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={updating}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verify Medicine
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {medicines.length === 0 && !loading && (
          <Card className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Pending Medicines</h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              All medicines have been verified. Check back later for new entries.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UnverifiedMedicinesPage;
