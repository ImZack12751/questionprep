import { memo, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { renderRich } from '../lib/richtext';

interface RichProps {
  text: string;
  inline?: boolean;
  className?: string;
  /** For fill_blank: render an input for blank n (1-based) in place of {{n}}. */
  renderBlank?: (n: number) => ReactNode;
}

/** Markdown + KaTeX text. Blanks are mounted into the rendered HTML with portals. */
export function Rich({ text, inline, className, renderBlank }: RichProps) {
  const html = useMemo(() => renderRich(text, { inline, blanks: !!renderBlank }), [text, inline, renderBlank !== undefined]);
  const ref = useRef<HTMLElement>(null);
  const [slots, setSlots] = useState<HTMLElement[]>([]);

  useLayoutEffect(() => {
    if (!renderBlank || !ref.current) return setSlots([]);
    setSlots([...ref.current.querySelectorAll<HTMLElement>('[data-blank]')]);
  }, [html]);

  const Tag = inline ? 'span' : 'div';
  return (
    <>
      <StaticHtml as={Tag} html={html} className={`rich ${className ?? ''}`} innerRef={ref} />
      {renderBlank && slots.map((el) => createPortal(renderBlank(Number(el.dataset.blank)), el, el.dataset.blank))}
    </>
  );
}

/** Memoised so re-renders never reset the innerHTML that portals are mounted into. */
const StaticHtml = memo(function StaticHtml({
  as: Tag,
  html,
  className,
  innerRef,
}: {
  as: 'span' | 'div';
  html: string;
  className: string;
  innerRef: React.Ref<HTMLElement>;
}) {
  return <Tag ref={innerRef as never} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
});
