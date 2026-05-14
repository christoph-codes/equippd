import { ComingSoonPanel } from '@/src/components/ui/ComingSoonPanel';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SectionHeader } from '@/src/components/ui/SectionHeader';

export default function NotesScreen() {
  return (
    <ScreenContainer>
      <SectionHeader title="Notes" subtitle="Your study notes will live here." />
      <ComingSoonPanel
        title="Notes"
        description="A full notes workspace is coming soon. For now, notes are created from group studies."
      />
    </ScreenContainer>
  );
}
