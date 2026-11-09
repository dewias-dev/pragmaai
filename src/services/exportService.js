/**
 * Export hasil analisis ke PDF dan Excel, serta cetak.
 * Library jsPDF dan SheetJS dimuat hanya saat tombol export diklik
 * (dynamic import) agar halaman tetap ringan.
 */
import {
  CATEGORIES,
  CONFIDENCE_LEVELS,
  CONTEXT_SUFFICIENCY,
  DIRECTION_OF_FIT,
  FELICITY_KEYS,
  FELICITY_STATUS,
  SPEECH_ACT_TYPES,
  categoryLabel,
} from '../../shared/searle.js'
import { fileNameFrom, formatDateTime, formatPercent } from '../utils/format.js'

const NAVY = [19, 35, 74]
const BLUE = [47, 91, 211]
const MUTED = [89, 101, 126]
const LINE = [221, 227, 238]

const list = (value) => (Array.isArray(value) ? value : [])
const alternativeLabel = (key) => (key && key !== 'tidak_ada' ? categoryLabel(key) : '-')

/**
 * Font standar PDF hanya mendukung huruf Latin. Simbol notasi Searle diganti
 * padanan sederhana yang dijelaskan pada catatan di akhir dokumen.
 */
function pdfSafe(value) {
  return String(value ?? '')
    .replace(/⊢/g, '|-')
    .replace(/↕/g, 'v^')
    .replace(/↓/g, 'v')
    .replace(/↑/g, '^')
    .replace(/∅/g, 'Ø')
    .replace(/→/g, '->')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/•/g, '-')
    .replace(/[^\n\t -ÿ]/g, '')
}

export async function exportAnalysisPdf({ analysis, utterances, stats }) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 16
  const contentWidth = pageWidth - margin * 2
  let y = 0

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - 18) {
      doc.addPage()
      y = 20
    }
  }

  const heading = (text) => {
    ensureSpace(14)
    y += 4
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12.5)
    doc.setTextColor(...NAVY)
    doc.text(pdfSafe(text), margin, y)
    y += 2
    doc.setDrawColor(...BLUE)
    doc.setLineWidth(0.5)
    doc.line(margin, y, margin + 18, y)
    y += 6
  }

  const paragraph = (text, { size = 10, style = 'normal', color = [24, 33, 61], indent = 0 } = {}) => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lineHeight = size * 0.48
    for (const block of pdfSafe(text || '-').split(/\n+/)) {
      const lines = doc.splitTextToSize(block, contentWidth - indent)
      for (const line of lines) {
        ensureSpace(lineHeight)
        doc.text(line, margin + indent, y)
        y += lineHeight
      }
      y += 1.6
    }
  }

  const table = (options) => {
    autoTable(doc, {
      margin: { left: margin, right: margin, top: 20, bottom: 18 },
      styles: { font: 'helvetica', fontSize: 8.6, cellPadding: 2, lineColor: LINE, lineWidth: 0.2, textColor: [24, 33, 61], valign: 'top' },
      headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [247, 249, 252] },
      rowPageBreak: 'avoid',
      ...options,
      startY: y,
    })
    y = doc.lastAutoTable.finalY + 6
  }

  // ---------- Kop ----------
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, pageWidth, 24, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('PRAGMAAI', margin, 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.text('Intelligent Pragmatic Speech Act Analysis', margin, 17.5)
  doc.text('Laporan Analisis Tindak Tutur Ilokusi (Searle)', pageWidth - margin, 12, { align: 'right' })
  y = 36

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...NAVY)
  for (const line of doc.splitTextToSize(pdfSafe(analysis.title), contentWidth)) {
    doc.text(line, margin, y)
    y += 7
  }
  y += 1

  table({
    theme: 'plain',
    styles: { fontSize: 9.2, cellPadding: 1.2, textColor: [24, 33, 61] },
    columnStyles: { 0: { cellWidth: 42, textColor: MUTED } },
    body: [
      ['Sumber data', pdfSafe(analysis.data_source || '-')],
      ['Tanggal analisis', formatDateTime(analysis.created_at)],
      ['Jumlah tuturan', String(stats.total)],
      ['Pembicara', pdfSafe(analysis.speakers?.length ? analysis.speakers.join(', ') : '-')],
      ['Kecukupan konteks', CONTEXT_SUFFICIENCY[analysis.context_sufficiency]?.label ?? '-'],
      ['Model AI', pdfSafe(analysis.ai_model || '-')],
    ],
  })

  if (analysis.conversation_context) {
    heading('Konteks percakapan')
    paragraph(analysis.conversation_context)
  }
  if (analysis.context_note) {
    paragraph(`Catatan konteks: ${analysis.context_note}`, { size: 9, style: 'italic', color: MUTED })
  }

  // ---------- Distribusi ----------
  heading('Distribusi kategori ilokusi')
  table({
    head: [['Kategori', 'Istilah Searle', 'Jumlah', 'Persentase']],
    body: stats.rows
      .filter((row) => row.key !== 'undetermined' || row.count > 0)
      .map((row) => [CATEGORIES[row.key].label, CATEGORIES[row.key].english, String(row.count), formatPercent(row.percentage)]),
    foot: [['Total', '', String(stats.total), stats.total ? '100,0%' : '0,0%']],
    footStyles: { fillColor: [238, 243, 253], textColor: NAVY, fontStyle: 'bold' },
    columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' } },
  })
  paragraph(
    `Tindak tutur langsung: ${stats.speechActTypes.direct} (${formatPercent(stats.speechActTypePercentages.direct)}); ` +
      `tidak langsung: ${stats.speechActTypes.indirect} (${formatPercent(stats.speechActTypePercentages.indirect)}); ` +
      `belum dapat dipastikan: ${stats.speechActTypes.undetermined}.`,
    { size: 9.5 },
  )

  // ---------- Kesimpulan ----------
  heading('Kesimpulan akademik')
  paragraph(analysis.academic_conclusion)
  heading('Kesimpulan sederhana')
  paragraph(analysis.simple_conclusion)
  if (list(analysis.dominant_findings).length) {
    heading('Temuan dominan')
    for (const finding of list(analysis.dominant_findings)) paragraph(`- ${finding}`, { indent: 2 })
  }
  if (analysis.limitations) {
    heading('Keterbatasan analisis')
    paragraph(analysis.limitations)
  }

  // ---------- Tabel klasifikasi ----------
  heading('Tabel klasifikasi tuturan')
  table({
    head: [['No', 'Penutur', 'Mitra tutur', 'Tuturan', 'Kategori', 'Tindak ilokusi', 'Jenis']],
    body: utterances.map((u) => [
      String(u.utterance_number),
      pdfSafe(u.speaker),
      pdfSafe(u.addressee),
      pdfSafe(u.utterance_text),
      categoryLabel(u.category),
      pdfSafe(u.specific_act),
      SPEECH_ACT_TYPES[u.speech_act_type]?.label ?? '-',
    ]),
    columnStyles: { 0: { cellWidth: 9, halign: 'right' }, 1: { cellWidth: 20 }, 2: { cellWidth: 20 }, 3: { cellWidth: 52 }, 4: { cellWidth: 21 }, 6: { cellWidth: 19 } },
  })

  // ---------- Detail per tuturan ----------
  heading('Detail analisis per tuturan')
  for (const u of utterances) {
    ensureSpace(24)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(...NAVY)
    doc.text(pdfSafe(`(${u.utterance_number}) ${u.speaker} -> ${u.addressee}`), margin, y)
    y += 5
    paragraph(`"${u.utterance_text}"`, { size: 10.5, style: 'italic' })
    if (!u.quote_verified) {
      paragraph('Catatan: kutipan ini tidak ditemukan persis sama di teks asli; periksa kembali sebelum dikutip.', { size: 8.5, color: [153, 96, 17] })
    }

    const felicity = u.felicity_conditions || {}
    table({
      theme: 'grid',
      showHead: 'never',
      columnStyles: { 0: { cellWidth: 46, fontStyle: 'bold', textColor: NAVY, fillColor: [247, 249, 252] } },
      body: [
        ['Kategori ilokusi', `${categoryLabel(u.category)} (${CATEGORIES[u.category]?.english ?? '-'})`],
        ['Tindak ilokusi spesifik', pdfSafe(u.specific_act || '-')],
        ['Tingkat keyakinan', CONFIDENCE_LEVELS[u.confidence]?.label ?? '-'],
        ['Kategori alternatif', alternativeLabel(u.alternative_category)],
        ...(u.classification_note ? [['Catatan klasifikasi', pdfSafe(u.classification_note)]] : []),
        ['Illocutionary point', pdfSafe(u.illocutionary_point)],
        ['Propositional content', pdfSafe(u.propositional_content)],
        ['Formula F(p)', pdfSafe(u.fp_formula)],
        ['IFIDs', pdfSafe(list(u.ifids).join('; ') || '-')],
        ['Bukti linguistik', pdfSafe(list(u.linguistic_evidence).join('; ') || '-')],
        ['Direction of fit', pdfSafe(DIRECTION_OF_FIT[u.direction_of_fit]?.label ?? '-')],
        ['Psychological state', pdfSafe(u.psychological_state)],
        ...FELICITY_KEYS.map(({ key, label }) => [
          label,
          pdfSafe(`[${FELICITY_STATUS[felicity[key]?.status]?.label ?? '-'}] ${felicity[key]?.explanation ?? ''}`),
        ]),
        ['Langsung / tidak langsung', `${SPEECH_ACT_TYPES[u.speech_act_type]?.label ?? '-'}${u.literal_force ? ` - ${pdfSafe(u.literal_force)}` : ''}`],
        ['Penjelasan akademik', pdfSafe(u.academic_explanation)],
        ['Penjelasan sederhana', pdfSafe(u.simple_explanation)],
      ],
    })
  }

  paragraph(
    'Catatan notasi PDF: |- = penanda asertif; v = arah kata ke dunia (word-to-world); ^ = arah dunia ke kata (world-to-word); ' +
      'v^ = arah ganda; Ø = tanpa arah kesesuaian. Hasil analisis AI perlu diverifikasi peneliti.',
    { size: 8.5, color: MUTED },
  )

  // ---------- Nomor halaman ----------
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text('Dibuat dengan PragmaAI', margin, pageHeight - 9)
    doc.text(`Halaman ${i} dari ${pages}`, pageWidth - margin, pageHeight - 9, { align: 'right' })
  }

  doc.save(fileNameFrom(analysis.title, 'pdf'))
}

export async function exportAnalysisExcel({ analysis, utterances, stats }) {
  const XLSX = await import('xlsx')

  const summaryRows = [
    ['PragmaAI – Laporan Analisis Tindak Tutur Ilokusi'],
    [],
    ['Judul', analysis.title],
    ['Sumber data', analysis.data_source || '-'],
    ['Tanggal analisis', formatDateTime(analysis.created_at)],
    ['Pembicara', analysis.speakers?.join(', ') || '-'],
    ['Konteks percakapan', analysis.conversation_context || '-'],
    ['Kecukupan konteks', CONTEXT_SUFFICIENCY[analysis.context_sufficiency]?.label ?? '-'],
    ['Model AI', analysis.ai_model || '-'],
    [],
    ['Kategori', 'Istilah Searle', 'Jumlah', 'Persentase (%)'],
    ...stats.rows.map((row) => [CATEGORIES[row.key].label, CATEGORIES[row.key].english, row.count, row.percentage]),
    ['Total', '', stats.total, stats.total ? 100 : 0],
    [],
    ['Jenis tindak tutur', '', 'Jumlah', 'Persentase (%)'],
    ['Langsung', '', stats.speechActTypes.direct, stats.speechActTypePercentages.direct],
    ['Tidak langsung', '', stats.speechActTypes.indirect, stats.speechActTypePercentages.indirect],
    ['Belum dapat dipastikan', '', stats.speechActTypes.undetermined, stats.speechActTypePercentages.undetermined],
    [],
    ['Kesimpulan akademik', analysis.academic_conclusion],
    ['Kesimpulan sederhana', analysis.simple_conclusion],
    ['Temuan dominan', list(analysis.dominant_findings).map((f) => `• ${f}`).join('\n')],
    ['Keterbatasan', analysis.limitations || '-'],
  ]

  const utteranceRows = utterances.map((u) => {
    const felicity = u.felicity_conditions || {}
    const row = {
      No: u.utterance_number,
      Penutur: u.speaker,
      'Mitra tutur': u.addressee,
      Tuturan: u.utterance_text,
      'Kutipan sesuai teks asli': u.quote_verified ? 'Ya' : 'Perlu dicek',
      Kategori: categoryLabel(u.category),
      'Kategori (Searle)': CATEGORIES[u.category]?.english ?? '',
      'Tindak ilokusi': u.specific_act,
      Keyakinan: CONFIDENCE_LEVELS[u.confidence]?.label ?? '',
      'Kategori alternatif': alternativeLabel(u.alternative_category),
      'Catatan klasifikasi': u.classification_note,
      'Illocutionary point': u.illocutionary_point,
      'Propositional content': u.propositional_content,
      'F(p)': u.fp_formula,
      IFIDs: list(u.ifids).join('; '),
      'Bukti linguistik': list(u.linguistic_evidence).join('; '),
      'Direction of fit': DIRECTION_OF_FIT[u.direction_of_fit]?.label ?? '',
      'Psychological state': u.psychological_state,
    }
    for (const { key, short } of FELICITY_KEYS) {
      row[`Syarat ${short} – status`] = FELICITY_STATUS[felicity[key]?.status]?.label ?? ''
      row[`Syarat ${short} – penjelasan`] = felicity[key]?.explanation ?? ''
    }
    row['Langsung/Tidak langsung'] = SPEECH_ACT_TYPES[u.speech_act_type]?.label ?? ''
    row['Ilokusi literal'] = u.literal_force
    row['Penjelasan akademik'] = u.academic_explanation
    row['Penjelasan sederhana'] = u.simple_explanation
    return row
  })

  const workbook = XLSX.utils.book_new()

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)
  summarySheet['!cols'] = [{ wch: 26 }, { wch: 60 }, { wch: 10 }, { wch: 16 }]
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan')

  const utteranceSheet = XLSX.utils.json_to_sheet(utteranceRows)
  const widths = Object.keys(utteranceRows[0] ?? { No: 1 }).map((key) =>
    key === 'No' ? { wch: 5 } : /Tuturan|Penjelasan|penjelasan|point|content|Catatan/.test(key) ? { wch: 48 } : { wch: 20 },
  )
  utteranceSheet['!cols'] = widths
  if (utteranceRows.length) utteranceSheet['!autofilter'] = { ref: utteranceSheet['!ref'] }
  XLSX.utils.book_append_sheet(workbook, utteranceSheet, 'Klasifikasi Tuturan')

  const dialogueSheet = XLSX.utils.aoa_to_sheet([['Teks dialog asli'], ...analysis.dialogue_text.split('\n').map((line) => [line])])
  dialogueSheet['!cols'] = [{ wch: 110 }]
  XLSX.utils.book_append_sheet(workbook, dialogueSheet, 'Dialog Asli')

  XLSX.writeFile(workbook, fileNameFrom(analysis.title, 'xlsx'))
}

/** Membuka dialog cetak browser. Gaya cetak diatur di index.css (@media print). */
export function printAnalysis(title) {
  const previousTitle = document.title
  document.title = fileNameFrom(title, 'pdf').replace(/\.pdf$/, '')
  window.print()
  setTimeout(() => {
    document.title = previousTitle
  }, 500)
}
