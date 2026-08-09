import { MEDIA_SUPPORTERS } from './mediaSupporterData'

const SOCIALS = {
  github: { label: 'گیت‌هاب', mark: '⌘' },
  telegram: { label: 'تلگرام', mark: '✈' },
  instagram: { label: 'اینستاگرام', mark: '◎' },
  twitter: { label: 'توییتر', mark: '𝕏' },
  youtube: { label: 'یوتیوب', mark: '▶' },
}

export default function MediaSupporters({ compact = false }) {
  return (
    <div className={`media-supporters-grid${compact ? ' compact' : ''}`}>
      {MEDIA_SUPPORTERS.map((supporter) => (
        <article className="media-supporter" key={supporter.id}>
          <div className="media-supporter-profile">
            <img src={supporter.avatar} alt={`تصویر پروفایل ${supporter.name}`} width="76" height="76" loading="lazy" />
            <div>
              <h3>{supporter.name}</h3>
              <span dir="ltr">@{supporter.handle}</span>
            </div>
          </div>
          <div className="media-supporter-socials">
            {Object.entries(supporter.socials).map(([network, account]) => {
              const social = SOCIALS[network]
              if (!social || !account) return null
              return (
                <a href={account.url} target="_blank" rel="noreferrer" key={network} aria-label={`${social.label} ${supporter.name}`}>
                  <span className={`media-social-icon ${network}`} aria-hidden="true">{social.mark}</span>
                  <span className="media-social-account">
                    <b>{social.label}</b>
                    <small dir="ltr">@{account.handle}</small>
                  </span>
                  {account.audience && <span className="media-social-audience">{account.audience}</span>}
                </a>
              )
            })}
          </div>
        </article>
      ))}
    </div>
  )
}
