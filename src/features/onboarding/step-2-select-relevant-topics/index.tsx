import { TopicSelectionStep } from './topic-selection-step'

interface DisorderOption {
  value: string
  label: string
}

interface Step2SelectRelevantTopicsProps {
  onNext?: (topics: DisorderOption[]) => void
}

function Step2SelectRelevantTopics({ onNext }: Step2SelectRelevantTopicsProps) {
  return (
    <div className="py-8 flex flex-col gap-8">
      <h2 className="font-serif text-2xl leading-tight text-primary lg:text-3xl text-center">
        Which topics are relevant to you?
      </h2>
      <TopicSelectionStep onNext={onNext ?? (() => {})} />
    </div>
  )
}

export default Step2SelectRelevantTopics
