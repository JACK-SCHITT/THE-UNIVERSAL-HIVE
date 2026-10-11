# DOMAIN: CODE
# React Native / Expo / TypeScript / Supabase patterns
# Namespace: domains/code.md | ≤200 lines

## IMPORTS — NEVER MIX SOURCES
```typescript
// React hooks ONLY from react
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// RN components ONLY from react-native
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';

// Reanimated default import only
import Animated from 'react-native-reanimated';

// Expo Router navigation
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
```

## STREAMING SSE — CROSS-PLATFORM PATTERN
```typescript
const reader = response.body?.getReader();
if (reader) {
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n');
    buffer = parts.pop() || '';
    for (const part of parts) {
      if (!part.startsWith('data: ')) continue;
      const data = part.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const chunk = json.choices?.[0]?.delta?.content || '';
        // handle chunk
      } catch {}
    }
  }
} else {
  // fallback: full text parse with same logic
  const text = await response.text();
  // same parsing loop on text.split('\n')
}
```

## SUPABASE CLIENT
```typescript
import { getSupabaseClient } from '@/template';
const supabase = getSupabaseClient();
const { data, error } = await supabase.from('table').select('*');
```

## SAFE AREA — EVERY SCREEN
```typescript
const insets = useSafeAreaInsets();
<View style={[styles.root, { paddingTop: insets.top }]}>
```

## ALERT SYSTEM
```typescript
import { useAlert } from '@/template';
const { showAlert } = useAlert();
showAlert('Title', 'Message');
```

## CONDITIONAL JSX — CORRECT PATTERN
```typescript
{condition ? <Component /> : null}   // correct
{condition && <Component />}          // AVOID — renders 0/false
```

## STYLE CONVENTIONS
- All styles via StyleSheet.create at file bottom
- Colors from Colors.* constants only (constants/theme.ts)
- Spacing from Spacing.* constants
- Typography sizes from Typography.* constants
- Amber accent: Colors.primary (#F5A623)
- Success green: Colors.success (#69F0AE)
- ZORG red: #FF003C (only in zorg.tsx)

## ARCHITECTURE LAYERS
services/ → pure data/API, no React
hooks/    → state + business logic, no JSX
components/ → UI rendering only
app/      → Expo Router pages (thin UI entry points)
contexts/ → global state via Provider pattern
