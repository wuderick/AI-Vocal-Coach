import { PropsWithChildren } from 'react';
import { uiSectionStyles, uiSectionHeaderStyles, uiSectionTitleStyles, uiSectionSubtitleStyles } from './uiStyles';

interface SectionProps {
  title?: string;
  subtitle?: string;
}

export function Section({ title, subtitle, children }: PropsWithChildren<SectionProps>) {
  return (
    <section style={uiSectionStyles}>
      {(title || subtitle) && (
        <header style={uiSectionHeaderStyles}>
          {title ? <h2 style={uiSectionTitleStyles}>{title}</h2> : null}
          {subtitle ? <p style={uiSectionSubtitleStyles}>{subtitle}</p> : null}
        </header>
      )}
      {children}
    </section>
  );
}
