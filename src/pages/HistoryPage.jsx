import { CalendarDays, Database, Eye, FilePlus2, History, MessagesSquare, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { DominantCategories } from '../components/CategoryBadge.jsx'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { Alert, EmptyState, PageLoading, Spinner } from '../components/Feedback.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { useDebouncedValue } from '../hooks/useDebouncedValue.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { deleteAnalysis, listAnalyses } from '../services/analysisService.js'
import { toFriendlyMessage } from '../utils/errors.js'
import { formatDateTime, formatNumber } from '../utils/format.js'

const PAGE_SIZE = 10

/**
 * Pencarian dari topbar membuka /riwayat?q=kata. Halaman dibuat ulang setiap kali
 * kata kunci di alamat berubah, sehingga kotak cari dan nomor halaman ikut menyesuaikan.
 */
export default function HistoryRoute() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''
  return <HistoryPage key={q} initialSearch={q} />
}

function HistoryPage({ initialSearch }) {
  useDocumentTitle('Riwayat analisis')
  const location = useLocation()
  const [search, setSearch] = useState(initialSearch)
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ key: null, items: [], total: 0, error: '' })
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState(location.state?.deletedTitle ? `“${location.state.deletedTitle}” telah dihapus.` : '')
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const debouncedSearch = useDebouncedValue(search)

  const requestKey = `${debouncedSearch}|${sort}|${page}|${reloadKey}`
  const loading = result.key !== requestKey

  useEffect(() => {
    let active = true
    listAnalyses({ search: debouncedSearch, sort, page, pageSize: PAGE_SIZE })
      .then((data) => active && setResult({ key: requestKey, ...data, error: '' }))
      .catch(
        (error) =>
          active &&
          setResult((prev) => ({ ...prev, key: requestKey, error: toFriendlyMessage(error, 'Gagal memuat riwayat analisis.') })),
      )
    return () => {
      active = false
    }
  }, [debouncedSearch, sort, page, requestKey])

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteAnalysis(toDelete.id)
      setNotice(`“${toDelete.title}” telah dihapus.`)
      setToDelete(null)
      if (result.items.length === 1 && page > 1) setPage((p) => p - 1)
      else setReloadKey((k) => k + 1)
    } catch (error) {
      setActionError(toFriendlyMessage(error, 'Gagal menghapus analisis.'))
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE))
  const firstItem = result.total ? (page - 1) * PAGE_SIZE + 1 : 0
  const lastItem = Math.min(page * PAGE_SIZE, result.total)
  const isFirstLoad = result.key === null
  const error = actionError || result.error

  return (
    <>
      <PageHeader
        title="Riwayat analisis"
        description="Semua analisis milik Anda. Cari berdasarkan judul, urutkan, buka kembali, atau hapus."
        actions={
          <Link to="/analisis/baru" className="btn btn-primary">
            <FilePlus2 size={18} aria-hidden="true" />
            Analisis baru
          </Link>
        }
      />

      <div className="stack">
        {notice && <Alert type="success">{notice}</Alert>}
        {error && <Alert type="error">{error}</Alert>}

        <section className="panel">
          <div className="toolbar">
            <div className="search-box">
              <Search size={17} aria-hidden="true" />
              <label className="visually-hidden" htmlFor="history-search">
                Cari judul analisis
              </label>
              <input
                id="history-search"
                className="input"
                type="search"
                placeholder="Cari judul analisis"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                  setNotice('')
                }}
              />
            </div>
            <label className="visually-hidden" htmlFor="history-sort">
              Urutkan
            </label>
            <select id="history-sort" className="select" value={sort} onChange={(e) => {
                setSort(e.target.value)
                setPage(1)
              }}>
              <option value="newest">Tanggal terbaru</option>
              <option value="oldest">Tanggal terlama</option>
              <option value="title">Judul (A–Z)</option>
            </select>
            {loading && !isFirstLoad && <Spinner small label="Memuat" />}
          </div>

          {isFirstLoad ? (
            <PageLoading label="Memuat riwayat…" />
          ) : result.items.length === 0 ? (
            debouncedSearch ? (
              <EmptyState icon={Search} title="Tidak ada hasil">
                Tidak ada analisis dengan judul yang mengandung “{debouncedSearch}”.
              </EmptyState>
            ) : (
              <EmptyState
                icon={History}
                title="Riwayat masih kosong"
                action={
                  <Link to="/analisis/baru" className="btn btn-primary">
                    Mulai analisis pertama
                  </Link>
                }
              >
                Analisis yang Anda jalankan akan tersimpan di sini.
              </EmptyState>
            )
          ) : (
            <>
              <div className="list">
                {result.items.map((item) => (
                  <div key={item.id} className="list-item">
                    <div>
                      <Link to={`/analisis/${item.id}`} className="list-item-title">
                        {item.title}
                      </Link>
                      <div className="list-item-meta">
                        <span>
                          <CalendarDays size={14} aria-hidden="true" />
                          {formatDateTime(item.created_at)}
                        </span>
                        <span>
                          <MessagesSquare size={14} aria-hidden="true" />
                          {formatNumber(item.total_utterances)} tuturan
                        </span>
                        {item.data_source && (
                          <span>
                            <Database size={14} aria-hidden="true" />
                            {item.data_source}
                          </span>
                        )}
                      </div>
                      <div className="mt-8">
                        <DominantCategories categories={item.dominant_categories} />
                      </div>
                    </div>
                    <div className="list-item-actions">
                      <Link to={`/analisis/${item.id}`} className="btn btn-secondary btn-sm">
                        <Eye size={15} aria-hidden="true" />
                        Lihat
                      </Link>
                      <button type="button" className="btn btn-danger-quiet btn-sm" onClick={() => setToDelete(item)}>
                        <Trash2 size={15} aria-hidden="true" />
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pagination">
                <span>
                  Menampilkan {firstItem}–{lastItem} dari {formatNumber(result.total)} analisis
                </span>
                <div className="pagination-buttons">
                  <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Hapus analisis ini?"
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
        confirmLabel="Hapus analisis"
      >
        “{toDelete?.title}” beserta seluruh tuturan dan umpan baliknya akan dihapus permanen.
      </ConfirmDialog>
    </>
  )
}
