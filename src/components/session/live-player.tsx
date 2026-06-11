import { useEffect, useRef, useState } from 'react'

import { CaptureDock } from './capture-dock'

/**
 * The embedded YouTube live player + one-tap capture. Bookmarking reads the
 * player's current time via the IFrame API, so a moment records the exact
 * stream timecode (a real frame can't be grabbed from a cross-origin player —
 * we resume the stream at that second instead).
 */

// Minimal shape of the bits of the IFrame API we touch.
type YTPlayer = {
  getCurrentTime?: () => number
  getDuration?: () => number
  destroy?: () => void
}
type YTApi = { Player: new (el: Element, opts: unknown) => YTPlayer }
declare global {
  interface Window {
    YT?: YTApi
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<YTApi> | null = null
function loadYouTubeApi(): Promise<YTApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise
  apiPromise = new Promise<YTApi>((resolve) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      if (window.YT) resolve(window.YT)
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)
  })
  return apiPromise
}

export function LivePlayer({
  videoId,
  posterUrl,
  onBookmark,
  onProgress,
}: {
  videoId: string
  posterUrl: string
  onBookmark: (seconds: number) => void
  /** Reports stream position (0–1) as it plays, to drive the talk progress bar. */
  onProgress?: (fraction: number) => void
}) {
  const mountRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    setReady(false)
    void loadYouTubeApi().then((YT) => {
      if (cancelled || !mountRef.current) return
      playerRef.current = new YT.Player(mountRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { modestbranding: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: () => {
            if (!cancelled) setReady(true)
          },
        },
      })
    })
    return () => {
      cancelled = true
      playerRef.current?.destroy?.()
      playerRef.current = null
    }
  }, [videoId])

  // Walk the talk progress bar from the real stream position.
  useEffect(() => {
    if (!ready || !onProgress) return
    const id = setInterval(() => {
      const player = playerRef.current
      const current = player?.getCurrentTime?.() ?? 0
      const duration = player?.getDuration?.() ?? 0
      if (duration > 0) onProgress(Math.min(1, current / duration))
    }, 1000)
    return () => clearInterval(id)
  }, [ready, onProgress])

  function handleBookmark() {
    const seconds = playerRef.current?.getCurrentTime?.() ?? 0
    onBookmark(Math.max(0, Math.floor(seconds)))
  }

  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-[18px] bg-ink [box-shadow:inset_0_0_0_1px_rgba(120,130,180,.12)] [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full">
        <div ref={mountRef} className="absolute inset-0" />
        {!ready ? (
          <img
            src={posterUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute right-3.5 top-3.5 z-[2] flex items-center gap-1.5 rounded-[7px] bg-white/90 px-2.5 py-[5px] font-mono text-[11px] text-slate">
          <span className="animate-live-pulse h-1.5 w-1.5 rounded-full bg-lime" />
          live now
        </div>
      </div>

      <CaptureDock
        time="LIVE"
        label="Keep this moment on your timeline"
        buttonLabel="Bookmark this moment"
        onCapture={handleBookmark}
      />
    </div>
  )
}
