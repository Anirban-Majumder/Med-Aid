"use client";
import { useContext, useState, useEffect } from 'react';
import { createClient } from "@/lib/supabase/client";
import { SessionContext } from "@/lib/supabase/usercontext";

interface MeDetails {
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
  const [medicines, setMedicines] = useState<MeDetails[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<MeDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);

  const supabase = createClient();

  // Fetch 10 unverified medicine records on mount
  const fetchMedicines = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('med_details')
      .select('*')
      .eq('verified', false)
      .limit(10);
    if (error) {
      console.error("Error fetching medicines:", error);
    } else {
      setMedicines(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // Handle form field changes inside the modal
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!selectedMedicine) return;
    setSelectedMedicine({
      ...selectedMedicine,
      [e.target.name]:
        e.target.type === 'number'
          ? Number(e.target.value)
          : e.target.value,
    });
  };

  // On Approve, update the record with verified info
  // ...existing code...
// On Approve, update the record with verified info
const handleApprove = async () => {
    if (!selectedMedicine || !sessionData?.session?.user?.id) return;
    setUpdating(true);
    
    const { error } = await supabase
      .from('med_details')
      .update({
        name: selectedMedicine.name,
        price: selectedMedicine.price,
        is_discontinued: selectedMedicine.is_discontinued,
        manufacturer_name: selectedMedicine.manufacturer_name, // Fixed field name
        type: selectedMedicine.type,
        pack_size_label: selectedMedicine.pack_size_label,
        short_composition1: selectedMedicine.short_composition1, // Fixed field name
        short_composition2: selectedMedicine.short_composition2, // Fixed field name
        salt_composition: selectedMedicine.salt_composition, // Fixed field name
        medicine_desc: selectedMedicine.medicine_desc,
        side_effects: selectedMedicine.side_effects,
        drug_interactions: selectedMedicine.drug_interactions,
        verified: true,
        verified_by: sessionData.session.user.id
      })
      .eq('id', selectedMedicine.id);
      
    if (error) {
      console.error("Error updating record:", error);
    } else {
      // Remove updated record from the list and close the modal
      setMedicines(medicines.filter(med => med.id !== selectedMedicine.id));
      setSelectedMedicine(null);
    }
    setUpdating(false);
  };

  return (
    <div className="min-h-screen p-4 bg-gray-100 dark:bg-gray-900">
      <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-4">
        Unverified Medicines
      </h1>
      {loading ? (
        <div className="text-center text-gray-800 dark:text-gray-100">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.map((med) => (
            <div
              key={med.id}
              className="p-4 bg-white dark:bg-gray-800 rounded shadow cursor-pointer hover:shadow-lg transition"
              onClick={() => setSelectedMedicine(med)}
            >
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                {med.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                ${med.price.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal for editing the medicine */}
      {selectedMedicine && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 rounded p-6 w-full max-w-lg mx-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
              Edit Medicine
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-700 dark:text-gray-200">Name</label>
                <input
                  type="text"
                  name="name"
                  value={selectedMedicine.name}
                  onChange={handleChange}
                  className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-200">Price</label>
                <input
                  type="number"
                  name="price"
                  value={selectedMedicine.price}
                  onChange={handleChange}
                  className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-200">Manufacturer</label>
                <input
                  type="text"
                  name="manufacturer"
                  value={selectedMedicine.manufacturer_name}
                  onChange={handleChange}
                  className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-200">Type</label>
                <input
                  type="text"
                  name="type"
                  value={selectedMedicine.type}
                  onChange={handleChange}
                  className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-200">Pack Size</label>
                <input
                  type="text"
                  name="pack_size_label"
                  value={selectedMedicine.pack_size_label}
                  onChange={handleChange}
                  className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-200">Short Composition1</label>
                <textarea
                  name="short_composition"
                  value={selectedMedicine.short_composition1}
                  onChange={handleChange}
                  className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-200">Short Composition2</label>
                <textarea
                  name="long_composition"
                  value={selectedMedicine.short_composition2}
                  onChange={handleChange}
                  className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-200">Salt Composition</label>
                <textarea
                  name="composition_static"
                  value={selectedMedicine.salt_composition}
                  onChange={handleChange}
                  className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-200">Medicine Description</label>
                <textarea
                  name="medicine_desc"
                  value={selectedMedicine.medicine_desc}
                  onChange={handleChange}
                  className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-200">Side Effects</label>
                <textarea
                  name="side_effects"
                  value={selectedMedicine.side_effects}
                  onChange={handleChange}
                  className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-200">Drug Interactions</label>
                <textarea
                  name="drug_interactions"
                  value={selectedMedicine.drug_interactions}
                  onChange={handleChange}
                  className="w-full p-2 border rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setSelectedMedicine(null)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                {updating ? 'Updating...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnverifiedMedicinesPage;
