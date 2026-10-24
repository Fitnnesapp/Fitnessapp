import { ChallengeArt, artVariantFor } from '@/components/illustrations/challenge-art';
import { Photo } from '@/components/ui/photo';
import { Radius } from '@/constants/theme';
import { challengePhotoSlot, PHOTOS } from '@/data/photos';

type ChallengeCoverProps = {
  challengeId: string;
  height: number;
};

/** Titelbild einer Challenge: Foto, sobald vorhanden, sonst die räumliche Vektorgrafik. */
export function ChallengeCover({ challengeId, height }: ChallengeCoverProps) {
  return (
    <Photo
      source={PHOTOS[challengePhotoSlot(challengeId)]}
      style={{ height, borderRadius: Radius.large }}
      fallback={<ChallengeArt variant={artVariantFor(challengeId)} height={height} />}
    />
  );
}
