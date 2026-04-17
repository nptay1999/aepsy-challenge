import { VoiceRecordingStep } from './voice-recording-step'

interface Step1VoiceRecordingProps {
  onComplete?: () => void
}

function Step1VoiceRecording({ onComplete }: Step1VoiceRecordingProps) {
  return (
    <div className="flex flex-col items-center gap-10">
      <div className="font-serif text-2xl leading-tight text-primary lg:text-3xl text-center">
        Record a short voice note describing how you feel
      </div>
      <VoiceRecordingStep onComplete={onComplete} />
    </div>
  )
}

export default Step1VoiceRecording
