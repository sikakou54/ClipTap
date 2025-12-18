import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SnippetFormScreen } from '../../components/snippet/SnippetFormScreen';

export default function EditSnippetScreen() {
  const params = useLocalSearchParams();

  return <SnippetFormScreen mode="edit" snippetId={params.id as string} />;
}
