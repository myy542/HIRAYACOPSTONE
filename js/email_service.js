function getPortalLoginUrl() {
    try {
        if (typeof window === 'undefined') return 'http://localhost:5500/auth/login.html';
        const origin = window.location.origin && window.location.origin !== 'null' ? window.location.origin : 'http://localhost:5500';
        const pathname = window.location.pathname || '';
        const rootIdx = pathname.indexOf('/finalcopstone');
        if (rootIdx !== -1) {
            const basePath = pathname.substring(0, rootIdx + '/finalcopstone'.length);
            return `${origin}${basePath}/auth/login.html`;
        }
        return `${origin}/auth/login.html`;
    } catch (e) {
        return `${window.location.origin || 'http://localhost:5500'}/auth/login.html`;
    }
}

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

        const loginUrl = getPortalLoginUrl();
        const subject = `🎉 Welcome to H.E.S! Your Student Portal Login Credentials`;

        const body = `Dear ${studentName || cleanFirst},

Congratulations! Your enrollment application for ${cleanGrade}${cleanStrand} for School Year ${cleanSY} at Hiraya Enrollment System has been officially APPROVED.

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
1. Visit the H.E.S Student Portal login page: ${loginUrl}
2. Enter your registered email as the Username: ${email}
3. Enter your Last Name as the Password: ${cleanLast} (Case-insensitive)
4. Click LOGIN to access your Student Dashboard.

Once logged in, you can view your Class Schedule, Grades, Attendance records, and School Announcements. You may also update your password anytime under the "My Profile" tab.

If you have any questions or require assistance, please visit the Registrar's Office or reply directly to this email.

Welcome to the H.E.S family!

Sincerely,
Office of the Registrar
Hiraya Enrollment System
Langtad, City of Naga, Cebu
`;

        return {
            subject,
            body,
            to: email,
            loginUrl
        };
    },

    /**
     * Constructs the official Enrollment Application Confirmation & Tracking Receipt email text
     */
    buildEnrollmentConfirmationEmail({ studentName, firstName, lastName, email, gradeLevel, strand, studentType, schoolYear, trackingId }) {
        const cleanFirst = firstName || (studentName ? studentName.split(' ')[0] : 'Applicant');
        const cleanGrade = gradeLevel || 'Junior/Senior High School';
        const cleanStrand = strand ? ` (${strand})` : '';
        const cleanSY = schoolYear || '2026-2027';
        const cleanType = studentType || 'New Student';
        const refNumber = trackingId || `HES-ENR-${Date.now().toString().slice(-6)}`;
        const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const subject = `📑 Enrollment Application Confirmation - Ref: ${refNumber} (${cleanGrade})`;

        const body = `Dear ${studentName || cleanFirst},

Thank you for submitting your online enrollment application to Hiraya Enrollment System (H.E.S).

We have successfully received your enrollment submission. Below are your official confirmation and tracking details:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ENROLLMENT APPLICATION RECEIPT:
Reference / Tracking Number: ${refNumber}
Date Submitted: ${dateStr}
Student Name: ${studentName || cleanFirst + ' ' + (lastName || '')}
Applicant Email: ${email}
Student Classification: ${cleanType}
Grade Level & Strand: ${cleanGrade}${cleanStrand}
Academic School Year: ${cleanSY}
Status: PENDING REGISTRAR VERIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS:
1. Document Evaluation: The Registrar's Office will inspect your submitted credentials (PSA Birth Certificate, Report Card, Good Moral Certificate).
2. Approval Notification: Once verified, you will receive an official approval email containing your Student Portal Login Credentials.
3. Track Application: You can log into your Student Dashboard at any time to monitor your submission status and requirement verification progress.

NEED ASSISTANCE?
If you need to update any submitted details or have inquiries, please contact the Office of the Registrar at (032) 123-4567 or email registrar@hes.edu.ph.

Sincerely,
Office of the Registrar
Hiraya Enrollment System
Langtad, City of Naga, Cebu, Philippines
`;

        return {
            subject,
            body,
            to: email,
            refNumber
        };
    },

    /**
     * Constructs the official Password Reset & OTP Confirmation email text
     */
    buildPasswordResetEmail({ name, email, resetCode }) {
        const userName = name || 'H.E.S User';
        const code = resetCode || Math.floor(100000 + Math.random() * 900000);
        const loginUrl = `${window.location.origin}/auth/login.html`;

        const subject = `🔐 [${code}] H.E.S Account Password Reset Confirmation Code`;

        const body = `Dear ${userName},

We received a request to reset the password for your Hiraya Enrollment System (H.E.S) account associated with ${email}.

Your 6-digit confirmation security code is:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 YOUR CONFIRMATION CODE:
    ${code}
(Valid for 15 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HOW TO RESET YOUR PASSWORD:
1. Return to the Password Reset page on your browser.
2. Enter the 6-digit code above (${code}) when prompted.
3. Enter and confirm your new secure password.

⚠️ SECURITY NOTICE:
If you did not request a password reset, please disregard this email or contact the school administrator immediately to secure your account.

Sincerely,
Information & Technology Security Desk
Hiraya Enrollment System
Langtad, City of Naga, Cebu, Philippines
`;

        return {
            subject,
            body,
            to: email,
            resetCode: code
        };
    },

    /**
     * Constructs Missing Requirement Reminder email
     */
    buildMissingRequirementsEmail({ studentName, firstName, lastName, email, missingRequirement, gradeLevel }) {
        const cleanName = studentName || `${firstName || ''} ${lastName || ''}`.trim() || 'Student';
        const cleanLast = lastName || (studentName ? studentName.split(' ').pop() : 'Student');
        const reqDoc = missingRequirement || 'Mandatory Enrollment Document';
        const subject = `⚠️ Important: Missing Enrollment Requirement - ${reqDoc}`;
        const loginUrl = getPortalLoginUrl();

        const body = `Dear ${cleanName},

This is an official notice from the Hiraya Enrollment System (H.E.S) Registrar's Office regarding your enrollment for ${gradeLevel || 'Junior/Senior High'}.

We noticed that the following mandatory requirement is still pending submission:
• Required Document: ${reqDoc}

Please upload a clear scan or photo of this document to complete your enrollment:
👉 Access Student Portal: ${loginUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 STUDENT PORTAL LOGIN CREDENTIALS:
Login Page: ${loginUrl}
📧 Username (Registered Gmail): ${email}
🔑 Password (Your Last Name): ${cleanLast} (Case-insensitive)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HOW TO ACCESS YOUR DASHBOARD:
1. Visit the H.E.S Student Portal: ${loginUrl}
2. Enter your registered Gmail as Username: ${email}
3. Enter your Last Name as Password: ${cleanLast}
4. Click LOGIN to upload documents and view your records.

If you have already submitted this physical document to the Registrar's Office, please allow 24-48 hours for our team to update your digital profile.

If you have any questions or require assistance, please visit the Registrar's Office or reply directly to this email.

Sincerely,
Office of the Registrar
Hiraya Enrollment System
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
     * Constructs official Registrar Notice email
     */
    buildRegistrarNoticeEmail({ studentName, firstName, lastName, email, messageTitle, messageBody, gradeLevel, includeCredentials = true }) {
        const cleanName = studentName || `${firstName || ''} ${lastName || ''}`.trim() || 'Student';
        const cleanLast = lastName || (studentName ? studentName.split(' ').pop() : '');
        const cleanTitle = messageTitle || 'Official Notice from Office of the Registrar';
        const subject = `📢 H.E.S Registrar Notice: ${cleanTitle}`;
        const loginUrl = getPortalLoginUrl();

        let credentialsBlock = '';
        if (includeCredentials && (email || cleanLast)) {
            credentialsBlock = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 STUDENT PORTAL LOGIN CREDENTIALS:
Login Page: ${loginUrl}
📧 Username (Registered Gmail): ${email}
🔑 Password (Your Last Name): ${cleanLast} (Case-insensitive)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO ACCESS YOUR ACCOUNT:
1. Open the H.E.S Student Portal: ${loginUrl}
2. Enter your registered Gmail as your Username: ${email}
3. Enter your Last Name as your Password: ${cleanLast}
4. Click LOGIN to view your Schedule, Grades, Attendance, and Requirements.
`;
        }

        const body = `Dear ${cleanName},

This is an official communication from the Hiraya Enrollment System (H.E.S) Office of the Registrar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 NOTICE DETAILS:
Subject: ${cleanTitle}
Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Student: ${cleanName}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MESSAGE FROM THE REGISTRAR:
${messageBody}
${credentialsBlock}
If you have any questions or require clarification, please visit the Registrar's Office during official hours or reply directly to this email.

Sincerely,
Office of the Registrar
Hiraya Enrollment System
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
            // Fallback to mailto
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
        } catch (e) {
            console.warn('Clipboard write failed, fallback:', e);
            try {
                const ta = document.createElement('textarea');
                ta.value = fullText;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                return true;
            } catch (err2) {
                return false;
            }
        }
    }
};

// Also attach to window for non-module scripts
if (typeof window !== 'undefined') {
    window.EmailNotificationService = EmailNotificationService;
}
