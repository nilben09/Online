/* =====================================================
   SAMSON POLYTECHNIC COLLEGE
   ADMIN PAGE: login, view records, clear records
===================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import {
    getFirestore,
    collection,
    doc,
    getDocs,
    deleteDoc,
    query,
    orderBy,
    writeBatch
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

import {
    getAuth,
    setPersistence,
    browserSessionPersistence,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js";


/* =====================================================
   FIREBASE SETUP
===================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyA0fSipq4t_h-jh1L36h2dSOkl_782fWDg",
    authDomain: "samson-enrollment.firebaseapp.com",
    projectId: "samson-enrollment",
    storageBucket: "samson-enrollment.firebasestorage.app",
    messagingSenderId: "417752798949",
    appId: "1:417752798949:web:31a38e9d9cb9070e50660c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// The admin stays logged in only while this browser tab is open.
// Closing the tab logs the admin out automatically.
const persistenceReady =
    setPersistence(auth, browserSessionPersistence);

const ENROLLMENTS = "enrollments";


/* =====================================================
   PAGE ELEMENTS
===================================================== */

const loginBox = document.getElementById("adminLoginBox");
const loginForm = document.getElementById("adminLoginForm");
const loginButton = document.getElementById("adminLoginButton");
const loginError = document.getElementById("adminLoginError");

const adminPanel = document.getElementById("adminPanel");
const recordsContainer = document.getElementById("recordsContainer");
const recordsCount = document.getElementById("recordsCount");

const viewButton = document.getElementById("viewRecordsButton");
const backupButton = document.getElementById("backupButton");
const clearButton = document.getElementById("clearRecordsButton");
const logoutButton = document.getElementById("logoutButton");


/* =====================================================
   HELPERS
===================================================== */

// Prevents text typed by students from running as code
function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

}


/* =====================================================
   LOGIN / LOGOUT
===================================================== */

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    loginError.style.display = "none";
    loginButton.disabled = true;
    loginButton.textContent = "LOGGING IN...";

    const email =
        document.getElementById("adminEmail").value.trim();

    const password =
        document.getElementById("adminPassword").value;

    try {

        await persistenceReady;

        await signInWithEmailAndPassword(auth, email, password);

        document.getElementById("adminPassword").value = "";

    } catch (error) {

        console.error("Login error:", error);

        loginError.textContent =
            (error.code === "auth/invalid-credential" ||
             error.code === "auth/wrong-password" ||
             error.code === "auth/user-not-found" ||
             error.code === "auth/invalid-email")
                ? "Incorrect email or password."
                : "Unable to log in. Please try again.";

        loginError.style.display = "block";

    } finally {

        loginButton.disabled = false;
        loginButton.textContent = "ADMIN LOGIN";

    }

});


logoutButton.addEventListener("click", function () {

    signOut(auth);

});


// Runs on page load and whenever the admin logs in or out
onAuthStateChanged(auth, function (user) {

    if (user) {

        loginBox.style.display = "none";
        adminPanel.style.display = "";

        loadRecords();

    } else {

        loginBox.style.display = "";
        adminPanel.style.display = "none";

        recordsContainer.innerHTML = "";
        recordsCount.textContent = "";

    }

});


/* =====================================================
   LOAD RECORDS
===================================================== */

async function loadRecords() {

    if (!auth.currentUser) {
        return;
    }

    recordsContainer.innerHTML = `
        <div class="no-records">Loading records...</div>
    `;

    recordsCount.textContent = "";

    try {

        const recordsQuery =
            query(
                collection(db, ENROLLMENTS),
                orderBy("createdAt", "desc")
            );

        const snapshot = await getDocs(recordsQuery);

        if (snapshot.empty) {

            recordsContainer.innerHTML = `
                <div class="no-records">
                    No enrollment records found.
                </div>
            `;

            return;

        }

        recordsCount.textContent =
            "Total records: " + snapshot.size;

        recordsContainer.innerHTML = "";

        snapshot.forEach((item) => {

            const record = item.data();

            const card = document.createElement("div");

            card.className = "record-card";

            card.innerHTML = `

                <h3>${escapeHtml(record.reference)}</h3>

                <p>
                    <strong>Student:</strong>
                    ${escapeHtml(record.firstName)}
                    ${escapeHtml(record.middleName)}
                    ${escapeHtml(record.lastName)}
                    ${escapeHtml(record.suffix)}
                </p>

                <p>
                    <strong>Program:</strong>
                    ${escapeHtml(record.program)}
                </p>

                <p>
                    <strong>Student Type:</strong>
                    ${escapeHtml(record.studentType)}
                </p>

                <p>
                    <strong>Contact:</strong>
                    ${escapeHtml(record.studentContact)}
                </p>

                <p>
                    <strong>Email:</strong>
                    ${escapeHtml(record.email)}
                </p>

                <p>
                    <strong>Guardian:</strong>
                    ${escapeHtml(record.guardianName)}
                    (${escapeHtml(record.relationship)})
                    - ${escapeHtml(record.guardianContact)}
                </p>

                <p>
                    <strong>Submitted:</strong>
                    ${escapeHtml(record.dateSubmitted)}
                </p>

                <button
                    type="button"
                    class="delete-button delete-record-button"
                    data-id="${escapeHtml(item.id)}"
                    style="margin-top: 10px;"
                >
                    DELETE THIS RECORD
                </button>

            `;

            recordsContainer.appendChild(card);

        });

    } catch (error) {

        console.error("Load records error:", error);

        recordsContainer.innerHTML = `
            <div class="no-records">
                Unable to load records. Make sure you are logged in
                with the admin account and the security rules are
                published.
            </div>
        `;

    }

}


/* =====================================================
   CLEAR RECORDS
===================================================== */

async function clearRecords() {

    if (!auth.currentUser) {

        alert("Please log in as admin first.");

        return;

    }

    const confirmation =
        confirm(
            "Are you sure you want to delete ALL enrollment records? " +
            "This cannot be undone. " +
            "Have you downloaded a backup first?"
        );

    if (!confirmation) {
        return;
    }

    try {

        const snapshot =
            await getDocs(collection(db, ENROLLMENTS));

        // Firestore allows up to 500 operations per batch
        const docs = snapshot.docs;

        for (let i = 0; i < docs.length; i += 400) {

            const batch = writeBatch(db);

            docs.slice(i, i + 400).forEach((item) => {
                batch.delete(item.ref);
            });

            await batch.commit();

        }

        await loadRecords();

        alert("All enrollment records have been deleted.");

    } catch (error) {

        console.error("Clear records error:", error);

        alert("Unable to delete records. Please try again.");

    }

}


/* =====================================================
   DOWNLOAD BACKUP (CSV, opens in Excel)
===================================================== */

const BACKUP_COLUMNS = [
    ["Reference", "reference"],
    ["First Name", "firstName"],
    ["Middle Name", "middleName"],
    ["Last Name", "lastName"],
    ["Suffix", "suffix"],
    ["Birthdate", "birthdate"],
    ["Sex", "sex"],
    ["Civil Status", "civilStatus"],
    ["Student Contact", "studentContact", "phone"],
    ["Email", "email"],
    ["Address", "address"],
    ["Program", "program"],
    ["Student Type", "studentType"],
    ["Previous School", "previousSchool"],
    ["Last Grade / Level", "gradeLevel"],
    ["Guardian Name", "guardianName"],
    ["Relationship", "relationship"],
    ["Guardian Contact", "guardianContact", "phone"],
    ["Guardian Email", "guardianEmail"],
    ["Guardian Address", "guardianAddress"],
    ["Birth Certificate", "requirements.birthCertificate", "yesno"],
    ["Report Card", "requirements.reportCard", "yesno"],
    ["2x2 ID Picture", "requirements.idPicture", "yesno"],
    ["Good Moral", "requirements.goodMoral", "yesno"],
    ["Date Submitted", "dateSubmitted"]
];


function getValue(record, path) {

    return path
        .split(".")
        .reduce((obj, key) => (obj ? obj[key] : undefined), record);

}


function csvCell(value, type) {

    let text = String(value ?? "");

    if (type === "yesno") {
        text = value ? "Yes" : "No";
    }

    // Keep leading zeros of phone numbers (09...) when opened in Excel
    if (type === "phone" && /^[+\d\s()-]+$/.test(text) && text !== "") {
        return '="' + text + '"';
    }

    // Stop text typed by students from running as an Excel formula
    if (/^[=+\-@\t\r]/.test(text)) {
        text = "'" + text;
    }

    return '"' + text.replace(/"/g, '""') + '"';

}


async function downloadBackup() {

    if (!auth.currentUser) {

        alert("Please log in as admin first.");

        return;

    }

    backupButton.disabled = true;
    backupButton.textContent = "PREPARING...";

    try {

        const recordsQuery =
            query(
                collection(db, ENROLLMENTS),
                orderBy("createdAt", "desc")
            );

        const snapshot = await getDocs(recordsQuery);

        if (snapshot.empty) {

            alert("There are no records to back up.");

            return;

        }

        const rows = [];

        rows.push(
            BACKUP_COLUMNS
                .map((column) => csvCell(column[0]))
                .join(",")
        );

        snapshot.forEach((item) => {

            const record = item.data();

            rows.push(
                BACKUP_COLUMNS
                    .map((column) =>
                        csvCell(getValue(record, column[1]), column[2])
                    )
                    .join(",")
            );

        });

        // \uFEFF makes Excel read special characters correctly
        const csv = "\uFEFF" + rows.join("\r\n");

        const blob =
            new Blob([csv], { type: "text/csv;charset=utf-8;" });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;

        link.download =
            "samson-enrollments-backup-" +
            new Date().toISOString().slice(0, 10) +
            ".csv";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

    } catch (error) {

        console.error("Backup error:", error);

        alert("Unable to create the backup. Please try again.");

    } finally {

        backupButton.disabled = false;
        backupButton.textContent = "DOWNLOAD BACKUP (CSV)";

    }

}


/* =====================================================
   DELETE ONE RECORD
===================================================== */

recordsContainer.addEventListener("click", async function (event) {

    const button =
        event.target.closest(".delete-record-button");

    if (!button) {
        return;
    }

    if (!auth.currentUser) {

        alert("Please log in as admin first.");

        return;

    }

    const id = button.dataset.id;

    const confirmation =
        confirm(
            "Delete the record " + id + "? " +
            "This cannot be undone. " +
            "(Tip: use DOWNLOAD BACKUP first if you may need it later.)"
        );

    if (!confirmation) {
        return;
    }

    button.disabled = true;
    button.textContent = "DELETING...";

    try {

        await deleteDoc(doc(db, ENROLLMENTS, id));

        await loadRecords();

    } catch (error) {

        console.error("Delete record error:", error);

        alert("Unable to delete this record. Please try again.");

        button.disabled = false;
        button.textContent = "DELETE THIS RECORD";

    }

});


viewButton.addEventListener("click", loadRecords);
backupButton.addEventListener("click", downloadBackup);
clearButton.addEventListener("click", clearRecords);