import { useState } from 'react'
import { useNavbarVariant } from '@/components/layout/navbar-context'
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@/components/reui/stepper'
import { CheckIcon, ChevronLeft, LoaderCircleIcon } from 'lucide-react'
import Step1VoiceRecording from './step-1-voice-recording'
import Step2SelectRelevantTopics from './step-2-select-relevant-topics'
import Step3Psychologists from './step-3-psychologists'
import { Button } from '@/components/ui/button'

const stepTitles = ['Record Your Feeling', 'Select Relevant Topics', 'Choose Psychologists']

export default function Onboarding() {
  useNavbarVariant('primary')
  const [activeStep, setActiveStep] = useState(1)

  return (
    <div className="bg-primary-foreground min-h-[calc(100dvh-15rem)] pt-16 px-6 flex">
      <main className="bg-primary-foreground px-0 lg:px-4 flex-1 flex">
        <Stepper
          value={activeStep}
          indicators={{
            completed: <CheckIcon className="size-3.5" />,
            loading: <LoaderCircleIcon className="size-3.5 animate-spin" />,
          }}
          className="w-full pt-8 flex flex-col flex-1 relative"
        >
          {activeStep !== 1 && (
            <Button
              size="icon-lg"
              className="absolute top-6 left-0 lg:top-20 lg:left-16 rounded-full"
              variant="ghost"
              onClick={() => setActiveStep((step) => step - 1)}
            >
              <ChevronLeft className="size-8 text-primary" />
            </Button>
          )}
          <StepperPanel className="lg:hidden block pb-4">
            {stepTitles.map((title, index) => (
              <StepperContent
                key={index}
                value={index + 1}
                className="text-center font-medium font-serif"
              >
                {title}
              </StepperContent>
            ))}
          </StepperPanel>

          <StepperNav className="lg:px-8">
            {stepTitles.map((title, index) => (
              <StepperItem key={index} step={index + 1} className="relative">
                <StepperTrigger className="flex justify-start gap-1.5">
                  <StepperIndicator className="data-[state=completed]:bg-success">
                    {index + 1}
                  </StepperIndicator>
                  <StepperTitle className="hidden lg:block">{title}</StepperTitle>
                </StepperTrigger>
                {stepTitles.length > index + 1 && (
                  <StepperSeparator className="group-data-[state=completed]/step:bg-success md:mx-2.5" />
                )}
              </StepperItem>
            ))}
          </StepperNav>

          <StepperPanel className="text-sm flex-1">
            <StepperContent
              value={1}
              className="flex lg:items-start items-center justify-center min-h-full lg:py-20"
            >
              <Step1VoiceRecording onComplete={() => setActiveStep(2)} />
            </StepperContent>
            <StepperContent
              value={2}
              className="flex lg:items-start items-center justify-center min-h-full lg:py-20"
            >
              <Step2SelectRelevantTopics onNext={() => setActiveStep(3)} />
            </StepperContent>
            <StepperContent
              value={3}
              className="flex lg:items-start items-center justify-center min-h-full lg:py-20"
            >
              <Step3Psychologists onBack={() => setActiveStep(2)} />
            </StepperContent>
          </StepperPanel>
        </Stepper>
      </main>
    </div>
  )
}
