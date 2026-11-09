import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CATEGORIES } from '../../shared/searle.js'
import { useMediaQuery } from '../hooks/useMediaQuery.js'
import { categoryStyle } from '../utils/categoryStyle.js'
import { formatMonthKey, formatNumber, formatPercent } from '../utils/format.js'

const AXIS_TEXT = { fill: '#59657e', fontSize: 13 }
const GRID = '#e6eaf2'

function CategoryTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="chart-tooltip">
      <strong>{row.label}</strong>
      {formatNumber(row.count)} tuturan ({formatPercent(row.percentage)})
    </div>
  )
}

/**
 * Grafik batang horizontal distribusi kategori ilokusi.
 * rows: [{ key, count, percentage }] dari computeDistribution().
 * Kategori "belum dapat dipastikan" hanya ditampilkan bila ada.
 */
export function CategoryDistributionChart({ rows, height }) {
  const compact = useMediaQuery('(max-width: 600px)')
  const data = rows
    .filter((row) => row.key !== 'undetermined' || row.count > 0)
    .map((row) => ({
      ...row,
      label: compact && row.key === 'undetermined' ? 'Belum pasti' : CATEGORIES[row.key].label,
      tip: row.count > 0 ? `${row.count} (${formatPercent(row.percentage)})` : '0',
    }))

  return (
    <div className="chart-box" style={{ height: height ?? 52 * data.length + 30 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: compact ? 78 : 96, bottom: 4, left: 0 }} barCategoryGap={14}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" allowDecimals={false} tick={AXIS_TEXT} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="label" width={compact ? 84 : 150} tick={AXIS_TEXT} axisLine={false} tickLine={false} />
          <Tooltip content={<CategoryTooltip />} cursor={{ fill: 'rgba(47, 91, 211, 0.06)' }} />
          <Bar dataKey="count" maxBarSize={24} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            {data.map((row) => (
              <Cell key={row.key} fill={CATEGORIES[row.key].color} />
            ))}
            <LabelList dataKey="tip" position="right" fill="#18213d" fontSize={13} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function MonthTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="chart-tooltip">
      <strong>{row.label}</strong>
      {formatNumber(row.count)} analisis
    </div>
  )
}

/** Grafik kolom jumlah analisis per bulan (6 bulan terakhir). */
export function MonthlyAnalysesChart({ data }) {
  const rows = data.map((item) => ({ ...item, label: formatMonthKey(item.month) }))
  return (
    <div className="chart-box" style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 20, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS_TEXT} axisLine={{ stroke: '#c3cddd' }} tickLine={false} />
          <YAxis allowDecimals={false} tick={AXIS_TEXT} axisLine={false} tickLine={false} />
          <Tooltip content={<MonthTooltip />} cursor={{ fill: 'rgba(47, 91, 211, 0.06)' }} />
          <Bar dataKey="count" fill="#2f5bd3" maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            <LabelList dataKey="count" position="top" fill="#18213d" fontSize={12} formatter={(v) => (v > 0 ? v : '')} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Tabel jumlah & persentase per kategori (juga berfungsi sebagai versi teks grafik). */
export function DistributionTable({ rows, total }) {
  const visible = rows.filter((row) => row.key !== 'undetermined' || row.count > 0)
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Kategori</th>
            <th>Istilah Searle</th>
            <th className="num">Jumlah</th>
            <th className="num">Persentase</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr key={row.key}>
              <td>
                <span className="row" style={{ gap: 8 }}>
                  <span className="cat-dot" style={categoryStyle(row.key)} aria-hidden="true" />
                  {CATEGORIES[row.key].label}
                </span>
              </td>
              <td className="muted">{CATEGORIES[row.key].english}</td>
              <td className="num">{formatNumber(row.count)}</td>
              <td className="num">{formatPercent(row.percentage)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2}>Total</td>
            <td className="num">{formatNumber(total)}</td>
            <td className="num">{formatPercent(total ? 100 : 0)}</td>
          </tr>
        </tfoot>
      </table>
      <p className="small faint" style={{ padding: '8px 14px', borderTop: '1px solid var(--line)' }}>
        Persentase dibulatkan ke satu desimal, sehingga jumlahnya dapat berselisih 0,1%.
      </p>
    </div>
  )
}
