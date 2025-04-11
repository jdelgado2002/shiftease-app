"use client"

import type { ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface OnboardingLayoutProps {
  children: ReactNode
  currentStep: number
  totalSteps: number
  onNext?: () => void
  onBack?: () => void
  nextDisabled?: boolean
  nextLabel?: string
  showSkip?: boolean
  onSkip?: () => void
}

export function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  nextDisabled = false,
  nextLabel = "Next",
  showSkip = false,
  onSkip,
}: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left sidebar with logo and progress */}
      <div className="bg-primary text-primary-foreground p-6 md:w-80 md:min-h-screen flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">ShiftEase</h1>
          <p className="text-primary-foreground/80 mt-1">Restaurant scheduling simplified</p>
        </div>

        <div className="space-y-6 flex-1">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Setup Progress</span>
              <span>
                {currentStep} of {totalSteps}
              </span>
            </div>
            <div className="w-full bg-primary-foreground/20 rounded-full h-2">
              <div
                className="bg-primary-foreground h-2 rounded-full"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="space-y-4 mt-8">
            <StepIndicator number={1} title="Create Account" active={currentStep >= 1} completed={currentStep > 1} />
            <StepIndicator
              number={2}
              title="Restaurant Details"
              active={currentStep >= 2}
              completed={currentStep > 2}
            />
            <StepIndicator number={3} title="Add Locations" active={currentStep >= 3} completed={currentStep > 3} />
            <StepIndicator number={4} title="Add Team Members" active={currentStep >= 4} completed={currentStep > 4} />
            <StepIndicator number={5} title="Security Setup" active={currentStep >= 5} completed={currentStep > 5} />
          </div>
        </div>

        <div className="mt-auto pt-6">
          <p className="text-sm text-primary-foreground/70">
            Need help?{" "}
            <a href="#" className="underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 md:p-10 max-w-3xl mx-auto w-full">{children}</main>

        {/* Navigation buttons */}
        <div className="p-6 border-t flex justify-between">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={onBack}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {showSkip && (
              <Button variant="ghost" onClick={onSkip}>
                Skip for now
              </Button>
            )}
            <Button onClick={onNext} disabled={nextDisabled}>
              {nextLabel}
              {nextLabel === "Next" && <ChevronRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StepIndicatorProps {
  number: number
  title: string
  active: boolean
  completed: boolean
}

function StepIndicator({ number, title, active, completed }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`
        flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
        ${
          completed
            ? "bg-primary-foreground text-primary"
            : active
              ? "bg-primary-foreground/20 text-primary-foreground border-2 border-primary-foreground"
              : "bg-primary-foreground/10 text-primary-foreground/50"
        }
      `}
      >
        {completed ? "✓" : number}
      </div>
      <span
        className={`
        ${completed ? "text-primary-foreground" : active ? "text-primary-foreground" : "text-primary-foreground/50"}
      `}
      >
        {title}
      </span>
    </div>
  )
}
