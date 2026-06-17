import { Star } from 'lucide-react';
import { AJO_MEMBERS } from '../../lib/mockData';

/**
 * Ajo Trust Score Badge system — surfaces a 5-star reliability rating next
 * to each thrift group member's avatar. Designed to drive organic peer
 * onboarding: high-trust members become the social proof that pulls their
 * circle onto Vepay.
 */
export function TrustScoreBadges() {
  return (
    <div className="rounded-2xl border border-express-border bg-express-surface px-5 py-4 shadow-sm">
      <p className="font-display text-sm font-semibold text-express-ink mb-3">
        Thrift Group · Trust Scores
      </p>

      <div className="flex flex-col gap-3">
        {AJO_MEMBERS.map((member) => (
          <div key={member.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: member.avatarColor }}
              >
                {member.initials}
              </div>
              <span className="text-sm font-medium text-express-ink">{member.name}</span>
            </div>

            <div className="flex items-center gap-0.5" aria-label={`${member.trustScoreStars} star trust score`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={[
                    'h-3.5 w-3.5',
                    i < member.trustScoreStars
                      ? 'fill-express-amber text-express-amber'
                      : 'fill-express-border text-express-border',
                  ].join(' ')}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
