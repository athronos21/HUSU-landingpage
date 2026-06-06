import { useState, useEffect } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp, query, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'

// Real-time listener for a collection
export function useCollection(collectionName, orderField = 'createdAt') {
  const [docs, setDocs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    const q = query(collection(db, collectionName), orderBy(orderField, 'desc'))
    const unsub = onSnapshot(q,
      snap => {
        setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      err => { setError(err.message); setLoading(false) }
    )
    return unsub
  }, [collectionName, orderField])

  return { docs, loading, error }
}

// CRUD helpers
export async function addDocument(collectionName, data) {
  return addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateDocument(collectionName, id, data) {
  return updateDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteDocument(collectionName, id) {
  return deleteDoc(doc(db, collectionName, id))
}
