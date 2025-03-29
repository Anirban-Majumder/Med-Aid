import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SearchSkeleton() {
  return (
    <div className="space-y-8 p-6">
      {/* Top grid skeleton for "Cheapest" & "Fastest" cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="relative overflow-hidden border border-muted/20">
            {/* Badge placeholder */}
            <div className="absolute top-2 right-2 px-2 py-1">
              <div className="w-12 h-5 bg-muted/60 animate-pulse rounded-full" />
            </div>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <div className="w-20 h-7 bg-muted/60 animate-pulse rounded-md" />
                <div className="w-16 h-7 bg-muted/60 animate-pulse rounded-md" />
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* List skeleton for medicine cards */}
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border border-muted/20 transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex gap-8">
                {/* Image placeholder */}
                <div className="w-36 h-36 bg-muted/60 animate-pulse rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-5">
                  {/* Medicine name & pharmacy info */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="w-48 h-7 bg-muted/60 animate-pulse rounded-md" />
                        <div className="w-32 h-5 bg-muted/60 animate-pulse rounded-md" />
                      </div>
                      <div className="w-20 h-7 bg-muted/60 animate-pulse rounded-md" />
                    </div>
                  </div>
                  {/* Price details */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="w-32 h-5 bg-muted/60 animate-pulse rounded-md" />
                      <div className="w-24 h-5 bg-muted/60 animate-pulse rounded-md" />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="w-36 h-5 bg-muted/60 animate-pulse rounded-md" />
                      <div className="w-24 h-5 bg-muted/60 animate-pulse rounded-md" />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="w-40 h-5 bg-muted/60 animate-pulse rounded-md" />
                      <div className="w-24 h-5 bg-muted/60 animate-pulse rounded-md" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 p-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-muted/60 animate-pulse rounded-full" />
                  <div className="w-24 h-5 bg-muted/60 animate-pulse rounded-md" />
                </div>
                <div className="w-28 h-9 bg-muted/60 animate-pulse rounded-lg" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
