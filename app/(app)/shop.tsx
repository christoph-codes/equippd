import { ComingSoonPanel } from '@/src/components/ui/ComingSoonPanel';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SectionHeader } from '@/src/components/ui/SectionHeader';

export default function ShopScreen() {
  return (
    <ScreenContainer>
      <SectionHeader title="Shop" subtitle="A polished placeholder for upcoming Equippd apparel and gear." />
      <ComingSoonPanel
        title="Equippd Shop"
        description="The commerce experience is intentionally deferred. This section is ready for future products, categories, and checkout flow integration."
      />
    </ScreenContainer>
  );
}
