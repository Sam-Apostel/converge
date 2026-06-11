/**
 * The speaker's soft icon buttons (GitHub / X / website) read from
 * `profile.socials`. This is *not* a follow button — it's a quiet way to reach
 * the person behind the talk. Only renders the links that exist.
 */

const ICON_BUTTON =
  'flex h-[34px] w-[34px] place-items-center rounded-[10px] bg-pillow text-slate transition-colors hover:bg-ink hover:text-white'

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  }
}

export function SpeakerSocials({
  socials,
}: {
  socials: Record<string, string> | null
}) {
  if (!socials) return null
  const github = socials.github
  const x = socials.x ?? socials.twitter
  const website = socials.website ?? socials.url

  if (!github && !x && !website) return null

  return (
    <div className="ml-auto flex items-center gap-[7px]">
      {github ? (
        <a
          href={github}
          target="_blank"
          rel="noreferrer"
          title="GitHub"
          className={ICON_BUTTON}
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
      ) : null}
      {x ? (
        <a
          href={x}
          target="_blank"
          rel="noreferrer"
          title="X"
          className={ICON_BUTTON}
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
          </svg>
        </a>
      ) : null}
      {website ? (
        <a
          href={website}
          target="_blank"
          rel="noreferrer"
          title="Website"
          className="flex h-[34px] items-center gap-1.5 rounded-[10px] bg-pillow px-[13px] text-[12.5px] font-medium text-slate transition-colors hover:bg-[#e3e7f2]"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.4 2.6 2.4 15 0 18M12 3c-2.4 2.6-2.4 15 0 18" />
          </svg>
          {hostOf(website)}
        </a>
      ) : null}
    </div>
  )
}
