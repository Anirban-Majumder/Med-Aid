"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
import { MapPin, SlidersHorizontal, TestTube2 } from "lucide-react"
import { DiagnosticData } from "@/lib/types"
import type { LabResult } from "@/lib/types"
import { SearchSkeleton } from "@/components/search-skeleton"
import { Layout } from "@/components/layout"
import { TestDetails } from "@/components/test-details"
import { motion, AnimatePresence } from "framer-motion"

export default function Labsearch() {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<LabResult[]>([])
  const [testData, setTestData] = useState<DiagnosticData>()
  const [loading, setLoading] = useState(false)
  const [priceRange, setPriceRange] = useState([0, 5000])
  const [inStock, setInStock] = useState(true)
  const [pin, setPin] = useState("700001") // Default pin code
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const skipFetchSuggestions = useRef(false)

  const fetchPinFromCoords = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      )
      const data = await response.json()
      if (data.address.postcode) {
        setPin(data.address.postcode)
      }
    } catch (error) {
      console.error("Error fetching location data:", error)
    }
  }

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        fetchPinFromCoords(latitude, longitude)
      },
      () => {
        console.warn("User denied location access. Using default PIN.")
      }
    )
  }

  useEffect(() => {
    getUserLocation()
  }, [])

  // Close suggestions when clicking outside
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
      const response = await fetch(`/api/labSearch?name=${encodeURIComponent(search)}`)
      const data = await response.json()
      //have to check for none
      setSuggestions(data.results[0].hits)
      setShowSuggestions(true)
    } catch (error) {
      console.error("Failed to fetch suggestions:", error)
      setSuggestions([])
    }
  }, [])

  const displayLabTests = useCallback(
    async (search: string) => {
      setLoading(true)
      try {
        const response = await fetch(`/api/labDetails?name=${encodeURIComponent(search)}&pin=${pin}`)
        const data = await response.json()
        setTestData(data)
      } catch (error) {
        console.error("Failed to fetch lab tests:", error)
        setTestData(undefined)
      }
      setLoading(false)
    },
    [pin]
  )

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  }

  return (
    <Layout>
      <motion.div
        className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto p-4 space-y-6"
        >
          <div className="flex items-center gap-4 mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="p-3 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600"
            >
              <TestTube2 className="w-6 h-6 text-white" />
            </motion.div>
            <motion.h1
              variants={itemVariants}
              className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent"
            >
              Search for Labs
            </motion.h1>
          </div>

          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <div className="relative flex-1" ref={searchRef}>
              <motion.div
                className="relative"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Input
                  type="text"
                  placeholder="Search Labs..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="h-12 pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all duration-200"
                />
              </motion.div>

              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg"
                  >
                    <div className="p-1">
                      {suggestions.length === 0 ? (
                        <div className="px-2 py-1 text-sm text-muted-foreground">No results found</div>
                      ) : (
                        suggestions.map((suggestion) => (
                          <div
                            key={suggestion.itemName}
                            className="px-2 py-1.5 hover:bg-muted rounded-sm cursor-pointer"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              skipFetchSuggestions.current = true
                              setQuery(suggestion.itemName)
                              setShowSuggestions(false)
                              displayLabTests(suggestion.url)
                            }}
                          >
                            <div className="text-sm font-medium">{suggestion.itemName}</div>
                            <div className="text-xs text-muted-foreground">
                              Contains {suggestion.testCount ? suggestion.testCount : 1} tests
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div
              variants={itemVariants}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <MapPin className="h-4 w-4 text-blue-500" />
              <Input
                type="text"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-20 bg-transparent border-none p-0 focus-visible:ring-0"
                placeholder="PIN code"
              />
            </motion.div>

            <Sheet>
              <SheetTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <SlidersHorizontal className="h-4 w-4 text-blue-500" />
                </motion.button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label>Price Range</Label>
                    <Slider value={priceRange} onValueChange={setPriceRange} max={5000} step={100} className="py-4" />
                    <div className="flex items-center justify-between text-sm">
                      <span>₹{priceRange[0]}</span>
                      <span>₹{priceRange[1]}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>In Stock Only</Label>
                    <Switch checked={inStock} onCheckedChange={setInStock} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </motion.div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SearchSkeleton />
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <TestDetails data={testData} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </Layout>
  )
}