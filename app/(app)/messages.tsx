import { ComingSoonPanel } from '@/src/components/ui/ComingSoonPanel';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SectionHeader } from '@/src/components/ui/SectionHeader';

export default function MessagesScreen() {
  return (
    <ScreenContainer>
      <SectionHeader title="Messages" subtitle="Group conversation tools are on the way." />
      <ComingSoonPanel
        title="Messages"
        description="Messaging will give groups a shared place for check-ins, updates, and encouragement."
      />
    </ScreenContainer>
  );
}
