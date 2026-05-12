// Admin email whitelist
export const ADMIN_EMAILS = [
    'shanupriya0311@gmail.com',
    'varunshiyam.analyst@gmail.com',
    'test@campuznavigation.com'
];

export function isAdmin(email) {
    return ADMIN_EMAILS.includes(email);
}
