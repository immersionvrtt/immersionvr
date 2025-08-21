const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');

admin.initializeApp();
const db = admin.firestore();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) sgMail.setApiKey(SENDGRID_API_KEY);

const ADMIN_NOTIFY = process.env.ADMIN_NOTIFY || 'immersionnotification@gmail.com';
const TZ = 'America/Port_of_Spain';
const SITE_BASE_URL = process.env.SITE_BASE_URL || 'https://your-site.web.app';

async function sendEmail(to, subject, text, html) {
  if (!SENDGRID_API_KEY) { console.log('No SENDGRID_API_KEY set'); return; }
  await sgMail.send({ to, from: ADMIN_NOTIFY, subject, text, html });
}

// Publish scheduled posts
exports.publishScheduledPosts = functions.pubsub.schedule('every 5 minutes').timeZone(TZ).onRun(async () => {
  const now = admin.firestore.Timestamp.now();
  const snap = await db.collection('blogPosts')
    .where('status', '==', 'scheduled').where('publishAt', '<=', now).get();
  const batch = db.batch();
  snap.forEach(doc => batch.update(doc.ref, { status: 'published', publishedAt: now }));
  await batch.commit();
});

// Expire posts
exports.expirePosts = functions.pubsub.schedule('every 10 minutes').timeZone(TZ).onRun(async () => {
  const now = admin.firestore.Timestamp.now();
  const snap = await db.collection('blogPosts')
    .where('status', 'in', ['published','scheduled']).where('expireAt', '<=', now).get();
  const batch = db.batch();
  snap.forEach(doc => batch.update(doc.ref, { status: 'expired', expiredAt: now }));
  await batch.commit();
});

// Notify customer when admin changes booking
exports.notifyBookingChange = functions.firestore.document('bookings/{id}').onUpdate(async (change, ctx) => {
  const before = change.before.data(); const after = change.after.data();
  if (!before || !after) return;
  if (after.adminUpdated && after.customerEmail) {
    const reason = after.adminMessage || 'Your appointment was updated by admin.';
    const reschedLink = `${SITE_BASE_URL}/book?bookingId=${ctx.params.id}`;
    await sendEmail(after.customerEmail, 'Booking updated', reason,
      `<p>Hi ${after.customerName||''},</p><p>${reason}</p><p>New time: ${after.startTime.toDate()}</p><p><a href="${reschedLink}">Reschedule</a></p>`);
  }
});

// Admin action alerts (logged)
exports.alertOnAdminAction = functions.firestore.document('auditLogs/{id}').onCreate(async (snap) => {
  const log = snap.data() || {};
  await sendEmail(ADMIN_NOTIFY, `[IMMERSION Admin Action] ${log.action||'Action'}`,
    `User: ${log.user||'unknown'}\nAction: ${log.action}\nTarget: ${log.target||''}`,
    `<h3>IMMERSION Admin Action</h3><p><b>User:</b> ${log.user||'unknown'}</p><p><b>Action:</b> ${log.action}</p><p><b>Target:</b> ${log.target||''}</p>`);
});

// Weekly customer creation report (Sunday 18:00 local) — can be adjusted in settings later
exports.weeklyCustomerReport = functions.pubsub.schedule('0 18 * * 0').timeZone(TZ).onRun(async () => {
  // Gather last 7 days of user creations (+ role attribution from audit logs)
  const since = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 7*24*3600*1000));
  const usersSnap = await db.collection('users').where('createdAt','>=', since).get();
  let publicCount=0, managerCount=0, employeeCount=0;
  let perStaff = {};
  // Optional: check auditLogs for creator attribution; here we use createdBy fields if present
  usersSnap.forEach(doc => {
    const u = doc.data();
    if (u.role === 'customer') {
      const createdByRole = u.createdByRole || 'public';
      if (createdByRole === 'public') publicCount++;
      else if (createdByRole === 'manager') { managerCount++; perStaff[u.createdByEmail] = (perStaff[u.createdByEmail]||0)+1; }
      else if (createdByRole === 'employee') { employeeCount++; perStaff[u.createdByEmail] = (perStaff[u.createdByEmail]||0)+1; }
    }
  });
  const totals = usersSnap.size;
  let list = Object.entries(perStaff).map(([email, n]) => `• ${email}: ${n}`).join('<br>');
  const html = `<h3>Weekly Customer Creation</h3>
  <p>Total new customers: ${publicCount+managerCount+employeeCount}</p>
  <ul>
    <li>Public sign-ups: ${publicCount}</li>
    <li>By Managers: ${managerCount}</li>
    <li>By Employees: ${employeeCount}</li>
  </ul>
  <p><b>Staff breakdown:</b><br>${list||'—'}</p>`;
  await sendEmail(ADMIN_NOTIFY, 'Weekly Customer Creation Report', 'See HTML body', html);
});