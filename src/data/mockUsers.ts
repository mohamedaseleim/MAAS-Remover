import { OjsUser } from '../types/ojs';

export const initialOjsUsers: OjsUser[] = [
  // Legitimate active users (must NEVER be touched by the purge)
  {
    id: 1,
    username: 'admin',
    email: 'admin@university-journal.org',
    fullName: 'Dr. Ahmad Al-Mansoor (Chief Admin)',
    dateRegistered: '2021-01-15 09:20:00',
    lastLogin: '2026-10-15 14:10:22',
    roles: ['Site Administrator', 'Journal Manager'],
    submissionCount: 14,
    reviewCount: 32,
    editorialAssignmentCount: 120,
    isSiteAdmin: true,
    status: 'active',
    riskScore: 0,
    notes: 'Journal Founder & Super Admin'
  },
  {
    id: 2,
    username: 's_khalil',
    email: 's.khalil@engineering-fac.edu',
    fullName: 'Prof. Samir Khalil',
    dateRegistered: '2022-03-10 11:00:00',
    lastLogin: '2026-10-12 18:30:11',
    roles: ['Section Editor', 'Reviewer'],
    submissionCount: 8,
    reviewCount: 45,
    editorialAssignmentCount: 84,
    isSiteAdmin: false,
    status: 'active',
    riskScore: 0,
    notes: 'Senior handling editor'
  },
  {
    id: 3,
    username: 'fatima_zahra',
    email: 'fatima.zahra@research-inst.ma',
    fullName: 'Dr. Fatima Zahra Bennani',
    dateRegistered: '2023-05-20 14:15:00',
    lastLogin: '2026-10-08 09:12:45',
    roles: ['Author', 'Reviewer'],
    submissionCount: 4,
    reviewCount: 12,
    editorialAssignmentCount: 0,
    isSiteAdmin: false,
    status: 'author',
    riskScore: 0,
    notes: 'Published author in Vol. 14'
  },
  {
    id: 4,
    username: 'm_nasser',
    email: 'm.nasser@science.univ.edu.eg',
    fullName: 'Dr. Mahmoud Nasser',
    dateRegistered: '2024-02-14 10:00:00',
    lastLogin: '2026-09-29 16:40:00',
    roles: ['Author'],
    submissionCount: 2,
    reviewCount: 0,
    editorialAssignmentCount: 0,
    isSiteAdmin: false,
    status: 'author',
    riskScore: 0,
    notes: 'Under review submission #1042'
  },
  {
    id: 5,
    username: 'layla_omer',
    email: 'layla.omer@biomed-lab.org',
    fullName: 'Dr. Layla Omer',
    dateRegistered: '2023-11-01 08:30:00',
    lastLogin: '2026-08-14 12:00:00',
    roles: ['Reviewer'],
    submissionCount: 0,
    reviewCount: 9,
    editorialAssignmentCount: 0,
    isSiteAdmin: false,
    status: 'reviewer',
    riskScore: 0,
    notes: 'Peer reviewer with active review records'
  },
  // Recently registered legitimate author (should be protected by registration age filter)
  {
    id: 6,
    username: 'hassan_newbie',
    email: 'hassan.t@gradschool.edu',
    fullName: 'Eng. Hassan Tariq',
    dateRegistered: '2026-10-10 10:22:00',
    lastLogin: '2026-10-10 10:25:00',
    roles: ['Author', 'Reader'],
    submissionCount: 0,
    reviewCount: 0,
    editorialAssignmentCount: 0,
    isSiteAdmin: false,
    status: 'active',
    riskScore: 10,
    notes: 'Registered 6 days ago, preparing paper submission'
  }
];

// Generate 115 realistic orphaned and spam accounts to allow testing batch up to 100
const spamDomains = [
  'fake-crypto-bonus.top',
  'casino-slots-vip.ru',
  'essay-writer-pro.biz',
  'best-seo-backlinks.cc',
  'temp-mail-disposable.xyz',
  'guest-poster-deal.info',
  'free-steam-keys.pw',
  'bot-network-indexer.site'
];

const spamUsernames = [
  'cryptobtc_bot', 'casinoking', 'essay_cheaper', 'seo_rank_master',
  'viagra_pills', 'backlink_lord', 'cheap_loans', 'free_gift_card',
  'poker_star_x', 'buy_followers_now', 'best_drugs_24', 'slot_machine88',
  'download_crack', 'forex_signals', 'dating_hookup', 'weight_loss_tea'
];

for (let i = 7; i <= 125; i++) {
  const domain = spamDomains[i % spamDomains.length];
  const prefix = spamUsernames[i % spamUsernames.length];
  const randNum = Math.floor(100 + Math.random() * 900);
  const username = `${prefix}_${randNum}`;
  const daysAgo = Math.floor(45 + (i * 5)); // Between 45 and 600 days ago
  const regDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const formattedDate = regDate.toISOString().replace('T', ' ').substring(0, 19);

  const neverLoggedIn = i % 3 !== 0;
  const lastLogin = neverLoggedIn ? null : new Date(regDate.getTime() + 180000).toISOString().replace('T', ' ').substring(0, 19);

  initialOjsUsers.push({
    id: i,
    username,
    email: `${username}@${domain}`,
    fullName: `SpamBot ${i} [Auto-registered]`,
    dateRegistered: formattedDate,
    lastLogin,
    roles: ['Reader'],
    submissionCount: 0,
    reviewCount: 0,
    editorialAssignmentCount: 0,
    isSiteAdmin: false,
    status: i % 4 === 0 ? 'orphan_inactive' : 'spam_bot',
    riskScore: 95 + (i % 5),
    notes: neverLoggedIn ? 'Never logged in after registration' : 'Logged in once upon automated registration'
  });
}
