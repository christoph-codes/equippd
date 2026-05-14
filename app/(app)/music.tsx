import { ComingSoonPanel } from '@/src/components/ui/ComingSoonPanel';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { ScreenIntro } from '@/src/components/ui/ScreenIntro';

export default function MusicScreen() {
  return (
    <ScreenContainer>
      <ScreenIntro>Curated worship and discovery are coming soon.</ScreenIntro>
      <ComingSoonPanel
        title="Music"
        description="Music recommendations will return here as a dedicated tab experience."
      />
    </ScreenContainer>
  );
}
