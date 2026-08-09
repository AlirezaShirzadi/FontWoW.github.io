import { MEDIA_SUPPORTERS } from './mediaSupporterData'
import * as I from './icons'

const SOCIALS = {
  github: { label: 'گیت‌هاب', Icon: I.IconGithub },
  telegram: { label: 'تلگرام', Icon: I.IconTelegram },
  instagram: { label: 'اینستاگرام', Icon: I.IconInstagram },
  twitter: { label: 'توییتر', Icon: I.IconTwitter },
  youtube: { label: 'یوتیوب', Icon: I.IconYoutube },
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
            {Object.entries(SOCIALS).map(([network, social]) => {
              const account = supporter.socials[network]
              const SocialIcon = social.Icon
              const content = (
                <>
                  <span className={`media-social-icon ${network}`} aria-hidden="true"><SocialIcon size={19} /></span>
                  <span className="media-social-account">
                    <b>{social.label}</b>
                    {account ? <small dir="ltr">@{account.handle}</small> : <small>ثبت نشده</small>}
                  </span>
                  {account?.audience && <span className="media-social-audience">{account.audience}</span>}
                </>
              )
              return account ? (
                <a href={account.url} target="_blank" rel="noreferrer" key={network} aria-label={`${social.label} ${supporter.name}`}>
                  {content}
                </a>
              ) : (
                <div className="media-social-unavailable" key={network} aria-label={`${social.label} ثبت نشده`}>
                  {content}
                </div>
              )
            })}
          </div>
        </article>
      ))}
    </div>
  )
}
