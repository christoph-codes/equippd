import { ComingSoonPanel } from '@/src/components/ui/ComingSoonPanel';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { ScreenIntro } from '@/src/components/ui/ScreenIntro';

export default function NotesScreen() {
  return (
    <ScreenContainer>
      <ScreenIntro>Your study notes will live here.</ScreenIntro>
      <ComingSoonPanel
        title="Notes"
        description="A full notes workspace is coming soon. For now, notes are created from group studies."
      />
    </ScreenContainer>
  );
}
