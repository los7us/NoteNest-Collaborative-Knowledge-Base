// ============================================================================
// Section Component
// ============================================================================
// Reusable page section with consistent vertical spacing and container
// Wraps Container internally to enforce layout standards
// ============================================================================

import { ReactNode } from 'react';
import { LAYOUT } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { Container } from './Container';

interface SectionProps {
    children: ReactNode;
    /**
     * Vertical spacing size
     * Default: 'medium'
     */
    spacing?: keyof typeof LAYOUT.SECTION_SPACING;
    /**
     * Background color className
     * Default: transparent
     */
    background?: string;
    /**
     * Additional CSS classes for the section wrapper
     */
    className?: string;
    /**
     * Override container max-width
     */
    containerWidth?: string;
    /**
     * Pass className directly to Container (for internal layout)
     */
    containerClassName?: string;
    /**
     * Use full width without Container wrapper
     * Useful for full-bleed backgrounds with nested Container
     */
    fullWidth?: boolean;
}

/**
 * Section component for page layout structure
 * 
 * Usage:
 *   <Section spacing="large" background="bg-white">
 *     <h2>My Section</h2>
 *     <p>Content here</p>
 *   </Section>
 * 
 * Full-width background with contained content:
 *   <Section fullWidth spacing="medium" background="bg-gray-50">
 *     <Container>
 *       <h2>Contained content in full-width section</h2>
 *     </Container>
 *   </Section>
 */
export function Section({
    children,
    spacing = 'medium',
    background,
    className,
    containerWidth,
    containerClassName,
    fullWidth = false,
}: SectionProps) {
    const content = fullWidth ? (
        children
    ) : (
        <Container maxWidth={containerWidth} className={containerClassName}>
            {children}
        </Container>
    );

    return (
        <section
            className={cn(
                // Apply vertical spacing from design tokens
                LAYOUT.SECTION_SPACING[spacing],

                // Apply background if provided
                background,

                // Additional classes
                className
            )}
        >
            {content}
        </section>
    );
}
