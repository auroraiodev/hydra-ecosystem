'use client';

import React from 'react';
import {
  FluentProvider,
  Theme,
  SSRProvider,
  RendererProvider,
  createDOMRenderer,
} from '@fluentui/react-components';

const renderer = createDOMRenderer();

// A dynamic partial theme that maps Fluent 2 semantic tokens directly to our active CSS variables.
// This guarantees perfect visual synchronization, theme switching, and contrast control.
const customFluent2Theme: Partial<Theme> = {
  // Backgrounds
  colorNeutralBackground1: 'var(--background)',
  colorNeutralBackground1Hover: 'var(--secondary)',
  colorNeutralBackground1Pressed: 'var(--secondary)',
  colorNeutralBackground1Selected: 'var(--secondary)',
  
  colorNeutralBackground2: 'var(--card)',
  colorNeutralBackground2Hover: 'var(--secondary)',
  
  colorNeutralBackground3: 'var(--muted)',
  colorNeutralBackground3Hover: 'var(--secondary)',
  
  colorNeutralBackground4: 'var(--muted)',
  colorNeutralBackground5: 'var(--muted)',
  
  // Foregrounds (Text)
  colorNeutralForeground1: 'var(--foreground)',
  colorNeutralForeground1Hover: 'var(--foreground)',
  colorNeutralForeground1Pressed: 'var(--foreground)',
  colorNeutralForeground1Selected: 'var(--foreground)',
  
  colorNeutralForeground2: 'var(--muted-foreground)',
  colorNeutralForeground2Hover: 'var(--foreground)',
  colorNeutralForeground2Pressed: 'var(--foreground)',
  colorNeutralForeground2Selected: 'var(--foreground)',
  
  colorNeutralForeground3: 'var(--muted-foreground)',
  colorNeutralForeground3Hover: 'var(--foreground)',
  colorNeutralForeground3Pressed: 'var(--foreground)',
  
  colorNeutralForeground4: 'var(--muted-foreground)',
  colorNeutralForegroundInverted: 'var(--background)',
  colorNeutralForegroundInvertedHover: 'var(--background)',
  colorNeutralForegroundInvertedPressed: 'var(--background)',
  colorNeutralForegroundInvertedSelected: 'var(--background)',
  
  // Brand / Accents (Driven by primary high-contrast black/white)
  colorBrandBackground: 'var(--primary)',
  colorBrandBackgroundHover: 'var(--primary)',
  colorBrandBackgroundPressed: 'var(--primary)',
  colorBrandBackgroundSelected: 'var(--primary)',
  colorBrandForeground1: 'var(--primary)',
  colorBrandForeground2: 'var(--primary)',
  colorBrandForegroundLink: 'var(--primary)',
  colorBrandForegroundLinkHover: 'var(--primary)',
  colorBrandForegroundLinkPressed: 'var(--primary)',
  colorBrandForegroundLinkSelected: 'var(--primary)',
  
  // Strokes / Borders
  colorNeutralStroke1: 'var(--border)',
  colorNeutralStroke1Hover: 'var(--border)',
  colorNeutralStroke1Pressed: 'var(--border)',
  colorNeutralStroke1Selected: 'var(--border)',
  
  colorNeutralStroke2: 'var(--border)',
  colorNeutralStroke3: 'var(--border)',
  colorNeutralStrokeAccessible: 'var(--foreground)',
  colorNeutralStrokeAccessibleHover: 'var(--foreground)',
  colorNeutralStrokeAccessiblePressed: 'var(--foreground)',
  colorNeutralStrokeAccessibleSelected: 'var(--foreground)',
  
  // Border Radius (Driven by compact Fluent 2 settings)
  borderRadiusNone: '0px',
  borderRadiusSmall: 'calc(var(--radius) - 4px)',
  borderRadiusMedium: 'calc(var(--radius) - 2px)',
  borderRadiusLarge: 'var(--radius)',
  borderRadiusXLarge: 'calc(var(--radius) + 4px)',
  borderRadiusCircular: '9999px',
};

export function FluentUIProvider({ children }: { children: React.ReactNode }) {
  return (
    <RendererProvider renderer={renderer}>
      <SSRProvider>
        <FluentProvider theme={customFluent2Theme as Theme}>{children}</FluentProvider>
      </SSRProvider>
    </RendererProvider>
  );
}
