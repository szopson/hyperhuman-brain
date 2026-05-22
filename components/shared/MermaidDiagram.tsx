'use client';

import { useEffect, useRef, useState } from 'react';

export function MermaidDiagram({
  chart,
  id,
}: {
  chart: string;
  id: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            background: '#09090b',
            primaryColor: '#18181b',
            primaryTextColor: '#fafafa',
            primaryBorderColor: '#3f3f46',
            lineColor: '#71717a',
            secondaryColor: '#27272a',
            tertiaryColor: '#1c1917',
            clusterBkg: '#0f0f10',
            clusterBorder: '#3f3f46',
            fontFamily: 'inherit',
          },
          flowchart: {
            curve: 'basis',
            padding: 16,
          },
        });
        const { svg } = await mermaid.render(`${id}-svg`, chart);
        if (cancelled || !containerRef.current) return;
        // Parse mermaid's generated SVG markup into a real DOM node
        // instead of innerHTML to keep CSP-friendly.
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, 'image/svg+xml');
        const svgEl = doc.documentElement;
        // Clear and append
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
        containerRef.current.appendChild(
          document.importNode(svgEl, true) as unknown as Node,
        );
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) {
    return (
      <div className="rounded-md border border-rose-900/50 bg-rose-950/20 p-4 text-sm text-rose-300">
        Diagram error: {error}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full overflow-x-auto [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
    />
  );
}
