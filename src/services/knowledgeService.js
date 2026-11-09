import { supabase } from '../lib/supabase.js'

const LIST_COLUMNS = 'id, slug, title, topic, summary, sort_order, is_published, updated_at'

/** Materi yang terlihat oleh pengguna (RLS: yang terbit, atau semua bila admin). */
export async function listArticles({ includeDrafts = false } = {}) {
  let query = supabase.from('knowledge_base').select(LIST_COLUMNS).order('sort_order').order('title')
  if (!includeDrafts) query = query.eq('is_published', true)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getArticleBySlug(slug) {
  const { data, error } = await supabase.from('knowledge_base').select('*').eq('slug', slug).maybeSingle()
  if (error) throw error
  return data
}

export async function getArticleById(id) {
  const { data, error } = await supabase.from('knowledge_base').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

function toRow(article) {
  return {
    slug: article.slug.trim(),
    title: article.title.trim(),
    topic: article.topic.trim() || 'Umum',
    summary: article.summary.trim(),
    content: article.content,
    sort_order: Number.parseInt(article.sort_order, 10) || 100,
    is_published: Boolean(article.is_published),
  }
}

export async function createArticle(article) {
  const { data, error } = await supabase.from('knowledge_base').insert(toRow(article)).select('id').single()
  if (error) throw error
  return data
}

export async function updateArticle(id, article) {
  const { error } = await supabase.from('knowledge_base').update(toRow(article)).eq('id', id)
  if (error) throw error
}

export async function deleteArticle(id) {
  const { error } = await supabase.from('knowledge_base').delete().eq('id', id)
  if (error) throw error
}
