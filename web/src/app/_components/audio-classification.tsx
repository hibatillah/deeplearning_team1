import React from "react"

import Chart from "@/components/custom/chart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

import { LoaderCircleIcon, PauseIcon, PlayIcon } from "lucide-react"

function LoadingCard() {
  return (
    <>
      <Skeleton className="size-28 flex-none rounded-full" />
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
    </>
  )
}

export type AudioPrediction = {
  classes: string
  accuracy: string
}

export type AudioFile = {
  name: string
  file: string
}

export default function AudioClassification() {
  const [isPending, startTransition] = React.useTransition()
  const [prediction, setPrediction] = React.useState<AudioPrediction>()
  const [audioSrc, setAudioSrc] = React.useState<AudioFile>()
  const [isPlay, setIsPlay] = React.useState<boolean>(false)
  const previousAudioSrc = React.useRef<string | null>(null)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  const predict = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const audio = formData.get("audio") as File

    startTransition(async () => {
      try {
        const response = await fetch("http://localhost:8000/predict/audio", {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
            "Cache-Control": "no-store",
          },
          body: formData,
        })

        const result = await response.json()

        addAudioToPlayer(audio)
        setPrediction({
          classes: result.prediction,
          accuracy: result.accuracy,
        })
      } catch (error) {
        console.error("Error:", error)
      }
    })
  }

  const addAudioToPlayer = (file: File) => {
    if (file && file.type === "audio/wav") {
      if (previousAudioSrc.current)
        URL.revokeObjectURL(previousAudioSrc.current)

      const audioURL = URL.createObjectURL(file)
      setAudioSrc({
        name: file.name,
        file: audioURL,
      })
      previousAudioSrc.current = audioURL
    }

    startTransition(() => {
      if (audioRef.current) {
        audioRef.current.load()
      }
    })
  }

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play()
        setIsPlay(true)
      } else {
        audioRef.current.pause()
        setIsPlay(false)
      }
    }
  }

  React.useEffect(() => {
    const audio = audioRef.current

    if (audio) {
      const handleAudioEnd = () => setIsPlay(false)
      audio.addEventListener("ended", handleAudioEnd)

      return () => {
        audio.removeEventListener("ended", handleAudioEnd)
      }
    }
  }, [audioRef.current])

  return (
    <>
      <form
        onSubmit={predict}
        className="flex w-full flex-col gap-3"
      >
        <div className="block space-y-1">
          <Label
            htmlFor="audio"
            className="text-muted-foreground"
          >
            <span>Select audio file</span>
            <span className="ms-1 rounded bg-secondary px-1 text-xs text-zinc-500">
              {".wav"}
            </span>
          </Label>
          <Input
            type="file"
            id="audio"
            name="audio"
            accept="audio/wav"
            className="p-1 file:me-3 file:h-full file:cursor-pointer file:rounded file:bg-secondary file:px-2"
            required
          />
        </div>
        <Button type="submit">
          {isPending ? (
            <div className="flex items-center gap-2">
              <LoaderCircleIcon className="animate-spin" />
              <span>Predicting...</span>
            </div>
          ) : (
            "Predict Audio"
          )}
        </Button>
      </form>
      {prediction && audioSrc && (
        <div className="space-y-8">
          <Separator />
          <div className="flex w-full items-center gap-4 overflow-hidden rounded-lg border border-border p-4">
            {isPending ? (
              <LoadingCard />
            ) : (
              <>
                <div className="flex flex-col leading-tight">
                  <div className="font-medium text-zinc-700">
                    {prediction.classes}
                  </div>
                  <p className="text-xs text-zinc-400">
                    Diprediksi sebagai suara {prediction.classes}
                  </p>
                </div>
                <audio
                  ref={audioRef}
                  src={audioSrc.file}
                ></audio>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={togglePlayPause}
                  className="ms-auto h-8 rounded-full text-xs text-zinc-600"
                >
                  {isPlay ? "Playing..." : "Play audio"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
