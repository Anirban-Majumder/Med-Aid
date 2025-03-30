"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Package2, ShieldAlert, Clock, AlertTriangle, Thermometer, Info } from "lucide-react";
import { motion } from "framer-motion";

function MedicineDetailsContent() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [medicineVariant, setMedicineVariant] = useState<any | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = useMemo(() => searchParams.get("id"), [searchParams]);
  const name = useMemo(() => searchParams.get("name"), [searchParams]);

  useEffect(() => {
    if (id && !medicineVariant) {
      fetch(`/api/getMedDetailsbyId?id=${id}`)
        .then((res) => res.json())
        .then((data: any) => {
          setMedicineVariant(data.variant);
          setSelectedImage(data.variant.images[0] || null);
        })
        .catch((err) => console.error("Error fetching medicine details:", err));
    }
  }, [id, medicineVariant]);

  useEffect(() => {
    if (name && !medicineVariant) {
      fetch(`/api/getMedDetails?name=${name}`)
        .then((res) => res.json())
        .then((data: any) => {
          setMedicineVariant(data.variant);
          setSelectedImage(data.variant.images[0] || null);
        })
        .catch((err) => console.error("Error fetching medicine details:", err));
    }
  }, [name, medicineVariant]);

  if (!medicineVariant) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600"></div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950"
    >
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800">
        <div className="container flex items-center h-16 px-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mr-4 gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            {medicineVariant?.name}
          </h1>
        </div>
      </div>

      <main className="container px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Card className="w-full aspect-square overflow-hidden border border-gray-200 dark:border-gray-800">
              <CardContent className="p-0 h-full">
                <div className="relative h-full group">
                  <motion.img
                    key={selectedImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    src={selectedImage || "/placeholder.jpg"}
                    alt={medicineVariant?.name}
                    className="w-full h-full object-contain transition-transform group-hover:scale-105"
                  />
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
              {medicineVariant?.images.map((img: string, index: number) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedImage(img)}
                  className={`relative min-w-[100px] h-[100px] rounded-lg overflow-hidden transition-all 
                    ${selectedImage === img
                      ? "ring-2 ring-cyan-500 dark:ring-cyan-400 ring-offset-2 dark:ring-offset-gray-900"
                      : "hover:ring-2 hover:ring-cyan-500/50 dark:hover:ring-cyan-400/50 hover:ring-offset-2 dark:hover:ring-offset-gray-900"
                    }`}
                >
                  <img
                    src={img || "/placeholder.jpg"}
                    alt={`${medicineVariant?.name} view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{medicineVariant?.name}</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">by {medicineVariant?.manufacturer_name}</p>
                </div>
                <div className="rounded-full px-4 py-1.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/20 dark:to-blue-500/20 text-cyan-700 dark:text-cyan-300 font-medium text-sm flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  Prescription Required
                </div>
              </div>

              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">Quick Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400/20 to-blue-600/20 dark:from-cyan-400/10 dark:to-blue-600/10 flex items-center justify-center">
                        <Package2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Active Ingredients</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {medicineVariant?.properties?.active_ingredient1?.value || 'N/A'}
                          {medicineVariant?.properties?.active_ingredient2?.value &&
                            `, ${medicineVariant?.properties?.active_ingredient2?.value}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400/20 to-blue-600/20 dark:from-cyan-400/10 dark:to-blue-600/10 flex items-center justify-center">
                        <Thermometer className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Storage</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {medicineVariant?.properties?.storage_condition?.value || 'Store in a cool, dry place'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Product Description</h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {medicineVariant?.product_description || 'No description available'}
                  </p>
                </section>

                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Important Information</h3>
                  </div>
                  <Card className="border-gray-200 dark:border-gray-800">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                            <TableHead className="w-[200px] font-semibold">SPECIFICATION</TableHead>
                            <TableHead className="font-semibold">DETAILS</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                            <TableCell className="font-medium text-gray-900 dark:text-gray-100">Dosage</TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-300">{medicineVariant?.properties?.recommended_dosage?.value || 'As prescribed'}</TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                            <TableCell className="font-medium text-gray-900 dark:text-gray-100">Usage Directions</TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-300">{medicineVariant?.properties?.directions_usage?.value || 'As directed by physician'}</TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                            <TableCell className="font-medium text-gray-900 dark:text-gray-100">Side Effects</TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-300">{medicineVariant?.properties?.side_effects?.value || 'No known side effects'}</TableCell>
                          </TableRow>
                          <TableRow className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                            <TableCell className="font-medium text-gray-900 dark:text-gray-100">Warnings</TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-300">{medicineVariant?.properties?.warnings_and_precaution?.value || 'Consult physician before use'}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </section>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </motion.div>
  );
}

export default function MedicineDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600"></div>
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      }
    >
      <MedicineDetailsContent />
    </Suspense>
  );
}