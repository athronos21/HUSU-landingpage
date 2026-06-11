/**
 * createAffairUser
 * Calls the Cloudflare Worker /create-user endpoint to create a
 * Firebase Auth account without affecting the current admin session.
 */

const WORKER_URL    = import.meta.env.VITE_WORKER_URL    || ''
const WORKER_SECRET = import.meta.env.VITE_WORKER_SECRET || ''

export async function createAffairUser({ email, name, role, affairId, affairName }) {
  if (!WORKER_URL) throw new Error('VITE_WORKER_URL not set in .env')

  const res = await fetch(`${WORKER_URL}/create-user`, {
    method: 'POST',
    headers: {
      'Content-Type':    'application/json',
      'X-Worker-Secret': WORKER_SECRET,
    },
    body: JSON.stringify({ email, name, role, affairId, affairName }),
  })

  const data = await res.json()

  // EMAIL_EXISTS — account exists in Auth but no Firestore profile
  if (res.status === 409 && data.error === 'EMAIL_EXISTS') {
    return { success: false, emailExists: true, message: data.message }
  }

  if (!res.ok) throw new Error(data.error || 'Failed to create user')
  return { success: true, password: data.password, uid: data.uid, isExisting: data.isExisting }
}
