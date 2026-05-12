import * as Linking from 'expo-linking';

import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { ScreenContainer } from '@/src/components/ui/ScreenContainer';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { loadMusicItems } from '@/src/services/content/mdx';

export default function MusicScreen() {
  const items = loadMusicItems();

  return (
    <ScreenContainer>
      <SectionHeader title="Music Discovery" subtitle="Curated recommendations from Equippd." />
      {items.map((item) => (
        <Card key={item.title}>
          <SectionHeader subtitle={item.artist} title={item.title} />
          <Button label="Open link" onPress={() => Linking.openURL(item.link)} variant="ghost" />
        </Card>
      ))}
    </ScreenContainer>
  );
}
