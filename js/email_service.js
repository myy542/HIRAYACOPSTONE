// ============================================
// PLSNHS EMAIL NOTIFICATION SERVICE
// ============================================

export const EmailNotificationService = {
    /**
     * Constructs the official Welcome & Login Credentials email text
     */
    buildCredentialsEmail({ studentName, firstName, lastName, email, gradeLevel, strand, schoolYear }) {
        const cleanFirst = firstName || (studentName ? studentName.split(' ')[0] : 'Student');
        const cleanLast = lastName || '';
        const cleanGrade = gradeLevel || 'Junior/Senior High School';
        const cleanStrand = strand ? ` (${strand})` : '';
        const cleanSY = schoolYear || '2026-2027';
        
        const loginUrl = `${window.location.origin}/auth/login.html`;
        const subject = `🎉 Welcome to PLSNHS! Your Student Portal Login Credentials`;

        const body = `Dear ${studentName || cleanFirst},

Congratulations! Your enrollment application for ${cleanGrade}${cleanStrand} for School Year ${cleanSY} at Placido L. Señor National High School has been officially APPROVED.

Your Student Portal account is now active. Please find your login credentials below:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 STUDENT PORTAL LOGIN:
Login Page: ${loginUrl}

📧 Username (Registered Email):
${email}

🔑 Password (Your Last Name):
${cleanLast}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HOW TO ACCESS YOUR ACCOUNT:
1. Visit the PLSNHS Student Portal login page: ${loginUrl}
2. Enter your registered email as the Username: ${email}
3. Enter your Last Name as the Password: ${cleanLast} (Case-insensitive)
4. Click LOGIN to access your Student Dashboard.

Once logged in, you can view your Class Schedule, Grades, Attendance records, and School Announcements. You may also update your password anytime under the "My Profile" tab.

If you have any questions or require assistance, please visit the Registrar's Office or reply directly to this email.

Welcome to the PLSNHS family!

Sincerely,
Office of the Registrar
Placido L. Señor National High School
Dumanjug, Cebu, Philippines
`;

        return {
            subject,
            body,
            to: email,
            loginUrl
        };
    },

    /**
     * Opens Gmail Web Compose in a new tab with pre-filled To, Subject, and Body
     */
    sendViaGmailWeb(emailData) {
        if (!emailData || !emailData.to) {
            console.error('❌ Missing recipient email for Gmail dispatch');
            return false;
        }

        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailData.to)}&su=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
        
        const win = window.open(gmailUrl, '_blank', 'noopener,noreferrer');
        if (!win) {
            // Fallback to location or alert
            window.location.href = `mailto:${encodeURIComponent(emailData.to)}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
        }
        return true;
    },

    /**
     * Opens default mail client (mailto:)
     */
    sendViaMailto(emailData) {
        if (!emailData || !emailData.to) return false;
        const mailtoUrl = `mailto:${encodeURIComponent(emailData.to)}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
        window.location.href = mailtoUrl;
        return true;
    },

    /**
     * Copies full formatted email text to clipboard
     */
    async copyEmailText(emailData) {
        const fullText = `Subject: ${emailData.subject}\nTo: ${emailData.to}\n\n${emailData.body}`;
        try {
            await navigator.clipboard.writeText(fullText);
            return true;
        } catch(e) {
            console.warn('Clipboard write failed, fallback:', e);
            try {
                const ta = document.createElement('textarea');
                ta.value = fullText;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                return true;
            } catch(err2) {
                return false;
            }
        }
    }
};

// Also attach to window for non-module scripts
if (typeof window !== 'undefined') {
    window.EmailNotificationService = EmailNotificationService;
}
