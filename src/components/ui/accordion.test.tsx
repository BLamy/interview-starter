import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';

describe('Accordion', () => {
  it('renders an accordion with content', () => {
    const { getByText } = render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Accordion Trigger</AccordionTrigger>
          <AccordionContent>Accordion Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    
    expect(getByText('Accordion Trigger')).toBeDefined();
  });
}); 