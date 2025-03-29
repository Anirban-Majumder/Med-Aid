"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { MapPin, SlidersHorizontal, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Medicine, MedSearchSuggestion } from "@/lib/types"
import { SearchSkeleton } from "@/components/search-skeleton"
import { Layout } from "@/components/layout"
import { motion, AnimatePresence } from "framer-motion"
import { useSearchParams } from "next/navigation"

export default function MedicineSearch() {

  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<MedSearchSuggestion[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 5000])
  const [inStock, setInStock] = useState(true)
  const [pin, setPin] = useState("700001") // Default pin code
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const skipFetchSuggestions = useRef(false)
  const searchParams = useSearchParams()

  const fetchPinFromCoords = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      if (data.address.postcode) {
        setPin(data.address.postcode);
      }
    } catch (error) {
      console.error("Error fetching location data:", error);
    }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchPinFromCoords(latitude, longitude);
      },
      () => {
        console.warn("User denied location access. Using default PIN.");
      }
    );
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchSuggestions = useCallback(async (search: string) => {
    if (!search) {
      setSuggestions([])
      return
    }

    try {
      setLoadingSuggestions(true)
      const response = await fetch(`/api/medPriceSearch?name=${encodeURIComponent(search)}`)
      const data = await response.json()
      setSuggestions(data)
      setShowSuggestions(true)
    } catch (error) {
      console.error("Failed to fetch suggestions:", error)
      setSuggestions([])
    } finally {
      setLoadingSuggestions(false)
    }
  }, [])

  useEffect(() => {
    if (skipFetchSuggestions.current) {
      skipFetchSuggestions.current = false
      return
    }

    const debounceTimer = setTimeout(() => {
      fetchSuggestions(query)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query, fetchSuggestions])

  const fetchMedicineDetails = useCallback(
    async (name: string, pack: string) => {
      setLoading(true)
      setMedicines([])
      setError(null)

      try {
        const apiUrl = `/api/medPriceDetails?name=${encodeURIComponent(name)}&pack=${encodeURIComponent(pack)}&pin=${pin}`
        const response = await fetch(apiUrl)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }

        if (!response.body) {
          throw new Error("Failed to get response stream")
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ""
        let lastDataTime = Date.now()
        const TIMEOUT = 60000 // 1 minute timeout

        while (true) {
          // Check for timeout
          if (Date.now() - lastDataTime > TIMEOUT) {
            throw new Error("Response timeout - no data received for too long")
          }

          try {
            const { done, value } = await reader.read()
            if (done) break

            lastDataTime = Date.now()
            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
              if (line.startsWith("data:")) {
                try {
                  const data = JSON.parse(line.slice(5))
                  setMedicines((prev) => {
                    // Deduplicate medicines by comparing their links
                    const exists = prev.some(m => m.link === data.link)
                    if (!exists) {
                      return [...prev, data]
                    }
                    return prev
                  })
                } catch (e) {
                  console.warn("Failed to parse streamed data:", e)
                }
              }
            }
          } catch (streamError: unknown) {
            if (streamError instanceof Error && streamError.name === 'AbortError') {
              throw new Error("Request was aborted due to timeout")
            }
            console.error("Stream reading error:", streamError)
            await reader.cancel()
            throw streamError
          }
        }
      } catch (error) {
        console.error("Error fetching medicine details:", error)
        setError(error instanceof Error ? error.message : 'Failed to fetch medicine details')
        setMedicines([])
      } finally {
        setLoading(false)
      }
    },
    [pin]
  )

  useEffect(() => {
    const nameParam = searchParams.get('name')
    const packParam = searchParams.get('pack')

    if (nameParam && packParam) {
      setQuery(nameParam)
      skipFetchSuggestions.current = true
      fetchMedicineDetails(nameParam, packParam)
    }
  }, [searchParams, fetchMedicineDetails])

  const filteredMedicines = medicines.filter(
    (med) =>
      parseFloat(med.finalCharge) >= priceRange[0] &&
      parseFloat(med.finalCharge) <= priceRange[1]
  )

  // Get sorted medicines for the featured cards
  const getCheapestMedicine = () => {
    if (medicines.length === 0) return null;
    return [...medicines].sort((a, b) =>
      parseFloat(a.finalCharge) - parseFloat(b.finalCharge)
    )[0];
  };

  const getFastestMedicine = () => {
    if (medicines.length === 0) return null;
    // Sort by delivery time - assuming format like "2-3 days" or "1 day"
    return [...medicines].sort((a, b) => {
      const getTimeValue = (time: string) => {
        const match = time.match(/(\d+)(?:-(\d+))?\s+(\w+)/);
        if (!match) return 999; // Default high value for unknown format
        const lowerValue = parseInt(match[1]);
        return lowerValue;
      };
      return getTimeValue(a.deliveryTime) - getTimeValue(b.deliveryTime);
    })[0];
  };

  const getBestMedicine = () => {
    if (medicines.length === 0) return null;
    // Best medicine is a balance of price and delivery time
    return [...medicines].sort((a, b) => {
      const priceA = parseFloat(a.finalCharge);
      const priceB = parseFloat(b.finalCharge);

      const getTimeValue = (time: string) => {
        const match = time.match(/(\d+)(?:-(\d+))?\s+(\w+)/);
        if (!match) return 999;
        const lowerValue = parseInt(match[1]);
        return lowerValue;
      };

      const timeA = getTimeValue(a.deliveryTime);
      const timeB = getTimeValue(b.deliveryTime);

      // Create a score that balances price and time (lower is better)
      const scoreA = (priceA / 500) + (timeA * 2); // Weight time more
      const scoreB = (priceB / 500) + (timeB * 2);

      return scoreA - scoreB;
    })[0];
  };

  const cheapestMedicine = getCheapestMedicine();
  const fastestMedicine = getFastestMedicine();
  const bestMedicine = getBestMedicine();

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  }

  return (
    <Layout>
      <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-50 flex-none p-4 md:p-6 space-y-4 border-b bg-white dark:bg-gray-900"
        >
          <h1 className="text-2xl md:text-3xl font-bold">
            <span className="bg-gradient-to-r from-cyan-500 to-blue-700 bg-clip-text text-transparent">
              Medicine Search
            </span>
          </h1>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1" ref={searchRef}>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search medicines..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="h-12 pl-4 pr-10 w-full"
                />
                <div className="absolute right-3 top-3 text-muted-foreground">
                  {loadingSuggestions ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                    >
                      <path
                        d="M10 6.5C10 8.433 8.433 10 6.5 10C4.567 10 3 8.433 3 6.5C3 4.567 4.567 3 6.5 3C8.433 3 10 4.567 10 6.5ZM9.30884 10.0159C8.53901 10.6318 7.56251 11 6.5 11C4.01472 11 2 8.98528 2 6.5C2 4.01472 4.01472 2 6.5 2C8.98528 2 11 4.01472 11 6.5C11 7.56251 10.6318 8.53901 10.0159 9.30884L12.8536 12.1464C13.0488 12.3417 13.0488 12.6583 12.8536 12.8536C12.6583 13.0488 12.3417 13.0488 12.1464 12.8536L9.30884 10.0159Z"
                        fill="currentColor"
                        fillRule="evenodd"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
              {showSuggestions && (
                <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-gray-900 border rounded-md shadow-xl z-[99999] max-h-[60vh] overflow-y-auto">
                  <div className="p-1">
                    {loadingSuggestions ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Searching medicines...</span>
                      </div>
                    ) : suggestions.length > 0 ? (
                      suggestions.map((suggestion, index) => (
                        <div
                          key={`${suggestion.medicineName}-${suggestion.packSize}-${index}`}
                          className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm cursor-pointer"
                          onClick={() => {
                            skipFetchSuggestions.current = true;
                            setQuery(suggestion.medicineName);
                            setShowSuggestions(false);
                            fetchMedicineDetails(suggestion.medicineName, suggestion.packSize);
                          }}
                        >
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {suggestion.medicineName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {suggestion.packSize}
                          </div>
                        </div>
                      ))
                    ) : query.length > 0 ? (
                      <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No medicines found
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2 flex-1 md:flex-none">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-20 bg-transparent border-none p-0 focus-visible:ring-0"
                  placeholder="PIN"
                />
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <Label>Price Range</Label>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={5000}
                        step={100}
                        className="py-4"
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span>₹{priceRange[0]}</span>
                        <span>₹{priceRange[1]}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>In Stock Only</Label>
                      <Switch
                        checked={inStock}
                        onCheckedChange={setInStock}
                      />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </motion.div>

        {/* Results Section */}
        <div className="flex-1 p-4 md:p-6 relative z-0">
          <div className="relative z-0">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div key="skeleton" {...fadeInUp}>
                  <SearchSkeleton />
                </motion.div>
              ) : error ? (
                <motion.div
                  key="error"
                  {...fadeInUp}
                  className="text-center p-8"
                >
                  <div className="max-w-md mx-auto">
                    <div className="rounded-full w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 mx-auto flex items-center justify-center mb-6">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">
                      Error Loading Results
                    </h3>
                    <p className="text-red-500 dark:text-red-400">
                      {error}
                    </p>
                    <Button
                      className="mt-4"
                      variant="outline"
                      onClick={() => {
                        setError(null)
                        if (query) {
                          const suggestion = suggestions.find(s => s.medicineName === query)
                          if (suggestion) {
                            fetchMedicineDetails(suggestion.medicineName, suggestion.packSize)
                          }
                        }
                      }}
                    >
                      Try Again
                    </Button>
                  </div>
                </motion.div>
              ) : medicines.length > 0 ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 relative z-0"
                    variants={{
                      animate: {
                        transition: { staggerChildren: 0.1 }
                      }
                    }}
                  >
                    {[
                      { type: "Cheapest", medicine: cheapestMedicine, color: "from-green-500 to-green-700" },
                      { type: "Fastest", medicine: fastestMedicine, color: "from-blue-500 to-blue-700" },
                      { type: "Best", medicine: bestMedicine, color: "from-purple-500 to-purple-700" }
                    ].map(({ type, medicine, color }) => {
                      if (!medicine) return null;

                      return (
                        <motion.div
                          key={type}
                          variants={fadeInUp}
                        >
                          <Card
                            className={cn(
                              "relative overflow-hidden transition-all hover:scale-105 hover:shadow-lg",
                              "bg-white dark:bg-gray-900",
                              type === "Best" && "border-2 border-purple-500"
                            )}
                          >
                            <div className={cn(
                              "absolute top-0 right-0 px-3 py-1 text-xs rounded-bl-lg text-white",
                              "bg-gradient-to-r",
                              color
                            )}>
                              {type}
                            </div>
                            <CardHeader>
                              <CardTitle className="flex flex-col gap-2">
                                <span className="text-2xl font-bold">₹{medicine.finalCharge}</span>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-muted-foreground">{medicine.name}</span>
                                  <span className="text-sm font-medium">{medicine.deliveryTime}</span>
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="text-sm text-muted-foreground">
                                <div className="flex justify-between">
                                  <span>Medicine Price:</span>
                                  <span>₹{medicine.price}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Delivery:</span>
                                  <span>₹{medicine.deliveryCharge}</span>
                                </div>
                              </div>
                            </CardContent>
                            <CardFooter>
                              <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => window.open(medicine.link, '_blank')}
                              >
                                Buy Now
                              </Button>
                            </CardFooter>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </motion.div>

                  <motion.div
                    className="space-y-4 relative z-0"
                    variants={{
                      animate: {
                        transition: { staggerChildren: 0.1 }
                      }
                    }}
                  >
                    {filteredMedicines.map((medicine, index) => (
                      <motion.div
                        key={medicine.link}
                        variants={fadeInUp}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                      >
                        <Card className="hover:border-primary transition-all hover:shadow-lg bg-white dark:bg-gray-900">
                          <CardContent className="p-4 md:p-6">
                            <motion.div
                              className="flex flex-col md:flex-row gap-4 md:gap-6"
                              whileHover={{ scale: 1.01 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <div className="w-full md:w-32 h-32 bg-muted rounded-lg overflow-hidden shrink-0">
                                <img
                                  src={medicine.imgLink.includes("https") ? medicine.imgLink : "/placeholder.jpg"}
                                  alt={medicine.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 space-y-4">
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span>
                                      <h3 className="text-lg font-semibold">{medicine.item}</h3>
                                      <p className="text-sm text-muted-foreground">Pharmacy: {medicine.name}</p>
                                    </span>
                                    <span>{medicine.deliveryTime}</span>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span>Medicine Price</span>
                                    <span>₹{medicine.price}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Delivery Price</span>
                                    <span>₹{medicine.deliveryCharge}</span>
                                  </div>
                                  <div className="flex justify-between font-semibold">
                                    <span>Cart Total</span>
                                    <span>₹{medicine.finalCharge}</span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </CardContent>
                          <CardFooter className="bg-gray-100 dark:bg-gray-800 flex flex-col sm:flex-row gap-4 p-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span className="text-sm truncate">{medicine.lson}</span>
                            </div>
                            <Button
                              onClick={() => window.open(medicine.link, '_blank')}
                              className="w-full sm:w-auto ml-auto"
                            >
                              Buy Now
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  {...fadeInUp}
                  className="text-center p-8"
                >
                  <div className="max-w-md mx-auto">
                    <div className="rounded-full w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 mx-auto flex items-center justify-center mb-6">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">
                      Search for medicines
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Enter a medicine name to see prices from different pharmacies
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Layout>
  )
}