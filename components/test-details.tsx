"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { TestTubeIcon as Test } from 'lucide-react'
import { DiagnosticData} from "@/lib/types"


export function TestDetails({ data }: { data?: DiagnosticData }) {
  if (!data) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-2">
              <Test className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl">{data.tests[0].itemName}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Type: {data.tests[0].type}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Labs Conducting Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.labs?.map((lab, index) => (
              <div
                key={index}
                className="flex items-center justify-between space-x-4 rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {lab.labDescription.logo && (
                      <img
                        src={lab.labDescription.logo || "/placeholder.svg"}
                        alt={lab.labDescription.labName}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    )}
                    <h4 className="font-medium">{lab.labDescription.labName}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {lab.labDescription.report}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground line-through">
                    ₹{lab.priceDescription.offered_price}
                  </div>
                  <div className="font-medium">₹{lab.priceDescription.final_price}</div>
                  <div className="text-xs text-green-600">
                    {lab.priceDescription.discount_percent}% OFF
                  </div>
                  <Button size="sm" className="mt-2">
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-4 space-y-1">
                {data.tests[0].testRequirements?.requirements.map((req, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {req}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{data.tests[0].description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How it Works</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {data.tests[0].howItWorks?.text}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">FAQ</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {data.tests[0].commonQuestions?.text.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-sm">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
