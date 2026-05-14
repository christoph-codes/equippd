import { ComingSoonPanel } from '@/src/components/ui/ComingSoonPanel';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { ScreenIntro } from '@/src/components/ui/ScreenIntro';

export default function MessagesScreen() {
  return (
    <ScreenContainer>
      <ScreenIntro>Group conversation tools are on the way.</ScreenIntro>
      <ComingSoonPanel
        title="Messages"
        description="Messaging will give groups a shared place for check-ins, updates, and encouragement."
      />
    </ScreenContainer>
  );
}
