/**
 * Batas input analisis. Dipakai oleh form (frontend) dan validasi (backend)
 * supaya aturannya selalu sama di kedua sisi.
 */
export const LIMITS = {
  titleMin: 3,
  titleMax: 200,
  sourceMax: 300,
  contextMax: 4000,
  speakersMax: 20,
  speakerNameMax: 60,
  dialogueMin: 10,
  dialogueMax: 20000,
  maxUtterances: 120,
}
