import { useState, type ReactNode } from 'react'

export function Fig({ caption, children }: { caption: ReactNode; children: ReactNode }) {
  return (
    <figure className="fig">
      <div className="scroll">{children}</div>
      <figcaption>{caption}</figcaption>
    </figure>
  )
}

export function Arrow({ id }: { id: string }) {
  return (
    <defs>
      <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10z" fill="currentColor" />
      </marker>
    </defs>
  )
}

/** 一个带标题和副标题的方框 */
export function Box({ x, y, w, h, k = '', t, s, dash }: { x: number; y: number; w: number; h: number; k?: string; t: string; s?: string; dash?: boolean }) {
  const cx = x + w / 2
  return (
    <g>
      <rect className={`bx ${k} ${dash ? 'dash' : ''}`} x={x} y={y} width={w} height={h} rx={3} />
      <text className="tt" x={cx} y={s ? y + h / 2 - 3 : y + h / 2 + 5} textAnchor="middle">{t}</text>
      {s && <text className="ts" x={cx} y={y + h / 2 + 15} textAnchor="middle">{s}</text>}
    </g>
  )
}

export function Derive({ gap, q, ans }: { gap: ReactNode; q: ReactNode; ans: ReactNode }) {
  return (
    <div className="derive">
      <div className="cell gap"><div className="k">缺口</div>{gap}</div>
      <div className="ar" aria-hidden="true">→</div>
      <div className="cell q"><div className="k">设计问题</div>{q}</div>
      <div className="ar" aria-hidden="true">→</div>
      <div className="cell ans"><div className="k">duoduo 的决定</div>{ans}</div>
    </div>
  )
}

export function Why({ rows }: { rows: [ReactNode, ReactNode, ReactNode, ReactNode][] }) {
  return (
    <div className="tablewrap">
      <table className="t">
        <thead><tr><th style={{ width: '19%' }}>要决定的事</th><th style={{ width: '21%' }}>直观的做法</th><th style={{ width: '26%' }}>duoduo 的做法</th><th>这样做的理由</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}><td>{r[0]}</td><td className="no">{r[1]}</td><td className="yes">{r[2]}</td><td>{r[3]}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Split({ code, model }: { code: ReactNode; model: ReactNode }) {
  return (
    <div className="split">
      <div className="c"><div className="k">代码负责</div>{code}</div>
      <div className="m"><div className="k">模型负责</div>{model}</div>
    </div>
  )
}

export function Cost({ children }: { children: ReactNode }) {
  return <div className="cost"><div className="k">这个决定的代价</div>{children}</div>
}

export function DeepGroup({ children }: { children: ReactNode }) {
  return <div className="deepwrap"><div className="k">细节 · 按需展开</div>{children}</div>
}

export function Deep({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <details className="deep">
      <summary><span>{title}{sub && <span className="s">{sub}</span>}</span></summary>
      <div className="deep-body">{children}</div>
    </details>
  )
}

export function Table({ head, rows, min }: { head: ReactNode[]; rows: ReactNode[][]; min?: number }) {
  return (
    <div className="tablewrap">
      <table className="t" style={min ? { minWidth: min } : undefined}>
        <thead><tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

export type Line = string | { t: string; k: 'new' | 'dim' }
export type Step = { label: string; title: string; text: string; files: [string, Line[]][]; hot?: string[] }

export function Stepper({ steps, pipe, note }: { steps: Step[]; pipe?: [string, string][]; note?: ReactNode }) {
  const [i, setI] = useState(0)
  const s = steps[i]
  return (
    <div className="stepper">
      <div className="st-bar">
        <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}>上一步</button>
        <button className="btn" disabled={i === steps.length - 1} onClick={() => setI(i + 1)}>下一步</button>
        <div className="dots">
          {steps.map((x, k) => (
            <button key={k} className="btn dot" aria-current={k === i ? 'step' : undefined} aria-label={`第 ${k + 1} 步：${x.title}`} onClick={() => setI(k)}>{x.label}</button>
          ))}
        </div>
      </div>
      <div className="st-body">
        {pipe && <div className="pipe">{pipe.map(([k, t]) => <span key={k} className={s.hot?.includes(k) ? 'hot' : ''}>{t}</span>)}</div>}
        <div className="st-title">{s.title}</div>
        <p className="st-text">{s.text}</p>
        <div className="files">
          {s.files.map(([name, lines]) => (
            <div className="file" key={name}>
              <div className="file-h">{name}</div>
              <pre>{lines.map((l, k) => typeof l === 'string' ? <span key={k}>{l}{'\n'}</span> : <span key={k}><span className={l.k}>{l.t}</span>{'\n'}</span>)}</pre>
            </div>
          ))}
        </div>
        {note && <div className="small muted">{note}</div>}
      </div>
    </div>
  )
}
