import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function AIOutput({ content }) {
  if (!content) return null;

  return (
    <div className="ai-output">
      <div className="ai-output-content">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: '20px 0 10px', borderBottom: '1px solid #334155', paddingBottom: 8 }}>{children}</h1>,
            h2: ({ children }) => <h2 style={{ fontSize: 18, fontWeight: 600, color: '#e2e8f0', margin: '18px 0 8px' }}>{children}</h2>,
            h3: ({ children }) => <h3 style={{ fontSize: 16, fontWeight: 600, color: '#c084fc', margin: '14px 0 6px' }}>{children}</h3>,
            p: ({ children }) => <p style={{ margin: '8px 0', lineHeight: 1.8 }}>{children}</p>,
            li: ({ children }) => <li style={{ margin: '4px 0', lineHeight: 1.7 }}>{children}</li>,
            strong: ({ children }) => <strong style={{ color: '#c084fc', fontWeight: 600 }}>{children}</strong>,
            em: ({ children }) => <em style={{ color: '#818cf8' }}>{children}</em>,
            code: ({ inline, children }) => inline
              ? <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 4, color: '#818cf8', fontSize: 13 }}>{children}</code>
              : <pre style={{ background: 'rgba(0,0,0,0.3)', padding: 16, borderRadius: 8, overflowX: 'auto', margin: '12px 0' }}><code style={{ color: '#e2e8f0', fontSize: 13 }}>{children}</code></pre>,
            blockquote: ({ children }) => (
              <blockquote style={{ borderLeft: '3px solid #c084fc', paddingLeft: 16, margin: '12px 0', color: '#94a3b8' }}>
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div style={{ overflowX: 'auto', margin: '12px 0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>
              </div>
            ),
            th: ({ children }) => <th style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid #334155', textAlign: 'left', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', color: '#64748b' }}>{children}</th>,
            td: ({ children }) => <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(51,65,85,0.5)', fontSize: 13 }}>{children}</td>,
            hr: () => <hr style={{ border: 'none', borderTop: '1px solid #334155', margin: '16px 0' }} />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
