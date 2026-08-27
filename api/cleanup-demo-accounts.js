import admin from 'firebase-admin'

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
    })
}

const db = admin.firestore()

export default async function handler(req, res) {
    const authHeader = req.headers['authorization']
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' })
    }

    try {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

        const snapshot = await db.collection('watchlists')
            .where('isDemoAccount', '==', true)
            .where('demoCreatedAt', '<', cutoff)
            .get()

        let deletedCount = 0
        for (const docSnap of snapshot.docs) {
            const uid = docSnap.id
            try {
                await admin.auth().deleteUser(uid)
            } catch (e) {
                console.error(`Failed to delete auth user ${uid}:`, e.message)
            }
            await docSnap.ref.delete()
            deletedCount++
        }

        res.status(200).json({ deleted: deletedCount })
    } catch (error) {
        console.error('Cleanup failed:', error)
        res.status(500).json({ error: error.message })
    }
}