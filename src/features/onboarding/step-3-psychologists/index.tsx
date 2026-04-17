import { PsychologistList } from './psychologist-list'

interface Step3PsychologistsProps {
  onBack: () => void
}

function Step3Psychologists({ onBack }: Step3PsychologistsProps) {
  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl py-8">
      <h2 className="font-serif text-2xl leading-tight text-primary lg:text-3xl text-center">
        Choose Your Psychologist
      </h2>
      <PsychologistList onBack={onBack} />
    </div>
  )
}

export default Step3Psychologists
