// Node script to migrate fields to {sport, category, market, odds_american}
import admin from "firebase-admin";

const SA = process.env.GCP_SA_JSON && JSON.parse(process.env.GCP_SA_JSON);
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(SA) });
const db = admin.firestore();

async function run() {
  const col = db.collectionGroup("bets"); // adjust if your collection path differs
  const snap = await col.get();
  const batchSize = 400;
  let ops = 0, batch = db.batch();

  for (const doc of snap.docs) {
    const d = doc.data();
    const updates: any = {};
    if (!d.sport && d.league) { updates.sport = d.league; updates.league = admin.firestore.FieldValue.delete(); }
    if (!d.category && (d.type || d.tabLabel)) {
      updates.category = d.type || d.tabLabel;
      if (d.type) updates.type = admin.firestore.FieldValue.delete();
      if (d.tabLabel) updates.tabLabel = admin.firestore.FieldValue.delete();
    }
    if (!d.market && d.subtype) { updates.market = d.subtype; updates.subtype = admin.firestore.FieldValue.delete(); }
    if (!d.odds_american && d.odds) { updates.odds_american = d.odds; updates.odds = admin.firestore.FieldValue.delete(); }
    if (Object.keys(updates).length) {
      batch.update(doc.ref, updates); ops++;
      if (ops % batchSize === 0) { await batch.commit(); batch = db.batch(); }
    }
  }
  if (ops % batchSize !== 0) await batch.commit();
  console.log(`Migrated ${ops} docs`);
}

run().catch(e => { console.error(e); process.exit(1); });
