/* =====================================================
   SAMSON POLYTECHNIC COLLEGE
   ONLINE ENROLLMENT SYSTEM (Firebase version)
   Student enrollment page. Admin records are in admin.html
===================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";

import {
    getFirestore,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

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

const ENROLLMENTS = "enrollments";


/* =====================================================
   HELPERS
===================================================== */

// Prevents text typed by students from running as code
// when the admin views the records.
function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

}


let currentStep = 1;

// Protects against double submission
let isSubmitting = false;     // true while the data is being sent
let alreadySubmitted = false; // true after a successful submission


/* =====================================================
   NEXT STEP
===================================================== */

function nextStep(step) {

    if (!validateStep(step)) {
        return;
    }

    if (step === 3) {
        loadReview();
    }

    document
        .getElementById("step" + step)
        .classList.remove("active");

    document
        .getElementById("step" + (step + 1))
        .classList.add("active");

    currentStep = step + 1;

    updateProgress();

}


/* =====================================================
   PREVIOUS STEP
===================================================== */

function previousStep(step) {

    document
        .getElementById("step" + step)
        .classList.remove("active");

    document
        .getElementById("step" + (step - 1))
        .classList.add("active");

    currentStep = step - 1;

    updateProgress();

}


/* =====================================================
   UPDATE PROGRESS
===================================================== */

function updateProgress() {

    const progressSteps =
        document.querySelectorAll(".progress-step");

    progressSteps.forEach((step, index) => {

        if (index + 1 <= currentStep) {
            step.classList.add("active");
        } else {
            step.classList.remove("active");
        }

    });

}


/* =====================================================
   VALIDATE STEPS
===================================================== */

function validateStep(step) {

    const current =
        document.getElementById("step" + step);

    const inputs =
        current.querySelectorAll(
            "input[required], select[required], textarea[required]"
        );

    for (let input of inputs) {

        if (!input.value.trim()) {

            alert("Please complete all required fields.");

            input.focus();

            return false;
        }

    }

    return true;

}


/* =====================================================
   LOAD REVIEW
===================================================== */

function loadReview() {

    const firstName =
        document.getElementById("firstName").value;

    const middleName =
        document.getElementById("middleName").value;

    const lastName =
        document.getElementById("lastName").value;

    const suffix =
        document.getElementById("suffix").value;

    let fullName = firstName;

    if (middleName) {
        fullName += " " + middleName;
    }

    fullName += " " + lastName;

    if (suffix) {
        fullName += " " + suffix;
    }

    document.getElementById("reviewName")
        .textContent = fullName;

    document.getElementById("reviewBirthdate")
        .textContent =
        document.getElementById("birthdate").value;

    document.getElementById("reviewSex")
        .textContent =
        document.getElementById("sex").value;

    document.getElementById("reviewContact")
        .textContent =
        document.getElementById("studentContact").value;

    document.getElementById("reviewEmail")
        .textContent =
        document.getElementById("email").value;

    document.getElementById("reviewAddress")
        .textContent =
        document.getElementById("address").value;

    document.getElementById("reviewProgram")
        .textContent =
        document.getElementById("program").value;

    document.getElementById("reviewStudentType")
        .textContent =
        document.getElementById("studentType").value;

    document.getElementById("reviewPreviousSchool")
        .textContent =
        document.getElementById("previousSchool").value ||
        "N/A";

    document.getElementById("reviewGuardian")
        .textContent =
        document.getElementById("guardianName").value;

    document.getElementById("reviewRelationship")
        .textContent =
        document.getElementById("relationship").value;

    document.getElementById("reviewGuardianContact")
        .textContent =
        document.getElementById("guardianContact").value;

}


/* =====================================================
   SUBMIT FORM
===================================================== */

document
    .getElementById("enrollmentForm")
    .addEventListener("submit", function (event) {

        event.preventDefault();

        const agreement =
            document.getElementById("agreement");

        if (!agreement.checked) {

            alert(
                "Please confirm that the information you provided is correct."
            );

            return;
        }

        if (alreadySubmitted) {

            alert(
                "This enrollment has already been submitted. " +
                "Please close the confirmation to start a new enrollment."
            );

            return;
        }

        if (isSubmitting) {
            return;
        }

        saveEnrollment();

    });


/* =====================================================
   SAVE ENROLLMENT (to Firestore)
===================================================== */

async function saveEnrollment() {

    const submitButton =
        document.querySelector(".submit-button");

    isSubmitting = true;

    submitButton.disabled = true;
    submitButton.textContent = "SUBMITTING...";


    const enrollment = {

        firstName:
            document.getElementById("firstName").value.trim(),

        middleName:
            document.getElementById("middleName").value.trim(),

        lastName:
            document.getElementById("lastName").value.trim(),

        suffix:
            document.getElementById("suffix").value,

        birthdate:
            document.getElementById("birthdate").value,

        sex:
            document.getElementById("sex").value,

        civilStatus:
            document.getElementById("civilStatus").value,

        studentContact:
            document.getElementById("studentContact").value.trim(),

        email:
            document.getElementById("email").value.trim(),

        address:
            document.getElementById("address").value.trim(),

        program:
            document.getElementById("program").value,

        studentType:
            document.getElementById("studentType").value,

        previousSchool:
            document.getElementById("previousSchool").value.trim(),

        gradeLevel:
            document.getElementById("gradeLevel").value,

        guardianName:
            document.getElementById("guardianName").value.trim(),

        relationship:
            document.getElementById("relationship").value,

        guardianContact:
            document.getElementById("guardianContact").value.trim(),

        guardianEmail:
            document.getElementById("guardianEmail").value.trim(),

        guardianAddress:
            document.getElementById("guardianAddress").value.trim(),

        requirements: {

            birthCertificate:
                document.getElementById("birthCertificate").checked,

            reportCard:
                document.getElementById("reportCard").checked,

            idPicture:
                document.getElementById("idPicture").checked,

            goodMoral:
                document.getElementById("goodMoral").checked

        },

        dateSubmitted:
            new Date().toLocaleString(),

        createdAt:
            serverTimestamp()

    };


    try {

        let savedReference = null;

        // The reference number is also the document ID.
        // If it already exists, Firestore refuses the write,
        // so we simply try again with a new number.
        for (let attempt = 0; attempt < 5; attempt++) {

            const reference = generateReference();

            try {

                await setDoc(
                    doc(db, ENROLLMENTS, reference),
                    { ...enrollment, reference: reference }
                );

                savedReference = reference;

                break;

            } catch (error) {

                if (error.code !== "permission-denied") {
                    throw error;
                }

            }

        }

        if (!savedReference) {
            throw new Error("Could not save the enrollment.");
        }

        alreadySubmitted = true;

        submitButton.textContent = "SUBMITTED ✓";

        document.getElementById("referenceNumber")
            .textContent = savedReference;

        document.getElementById("successModal")
            .classList.add("show");

    } catch (error) {

        console.error("Enrollment error:", error);

        alert(
            "Sorry, your enrollment could not be submitted. " +
            "Please check your internet connection and try again."
        );

    } finally {

        isSubmitting = false;

        // Keep the button locked after a successful submission
        if (!alreadySubmitted) {
            submitButton.disabled = false;
            submitButton.textContent = "SUBMIT ENROLLMENT";
        }

    }

}


/* =====================================================
   GENERATE REFERENCE NUMBER
===================================================== */

function generateReference() {

    const number =
        Math.floor(
            10000000 +
            Math.random() * 90000000
        );

    return "SPCD-" + number;

}


/* =====================================================
   CLOSE MODAL
===================================================== */

function closeModal() {

    document
        .getElementById("successModal")
        .classList.remove("show");

    // After a successful enrollment, start again with a clean form
    if (alreadySubmitted) {
        resetEnrollmentForm();
    }

}


/* =====================================================
   RESET FORM (ready for a new enrollment)
===================================================== */

function resetEnrollmentForm() {

    document.getElementById("enrollmentForm").reset();

    document.querySelectorAll(".form-step").forEach((step) => {
        step.classList.remove("active");
    });

    document.getElementById("step1").classList.add("active");

    currentStep = 1;

    updateProgress();

    const submitButton =
        document.querySelector(".submit-button");

    submitButton.disabled = false;
    submitButton.textContent = "SUBMIT ENROLLMENT";

    alreadySubmitted = false;

    document.getElementById("enrollment").scrollIntoView();

}


/* =====================================================
   PRINT ENROLLMENT
===================================================== */

function printEnrollment() {

    const firstName =
        escapeHtml(document.getElementById("firstName").value);

    const lastName =
        escapeHtml(document.getElementById("lastName").value);

    const program =
        escapeHtml(document.getElementById("program").value);

    const reference =
        escapeHtml(
            document.getElementById("referenceNumber").textContent
        );

    const birthdate =
        escapeHtml(document.getElementById("birthdate").value);

    const contact =
        escapeHtml(document.getElementById("studentContact").value);

    const email =
        escapeHtml(document.getElementById("email").value);

    const guardian =
        escapeHtml(document.getElementById("guardianName").value);


    const printWindow =
        window.open("", "_blank");


    printWindow.document.write(`

        <html>

        <head>

            <title>
                Samson Enrollment Confirmation
            </title>

            <style>

                body {
                    font-family: Arial;
                    padding: 50px;
                    color: #222;
                }

                .header {
                    text-align: center;
                    border-bottom: 4px solid #123fa8;
                    padding-bottom: 20px;
                }

                .header h1 {
                    color: #123fa8;
                    margin-bottom: 5px;
                }

                .header p {
                    color: #555;
                }

                .reference {
                    text-align: center;
                    background: #eef4ff;
                    padding: 20px;
                    margin: 30px 0;
                }

                .reference strong {
                    font-size: 28px;
                    color: #123fa8;
                }

                .details {
                    margin-top: 30px;
                }

                .details p {
                    margin: 12px 0;
                }

                .footer {
                    margin-top: 50px;
                    border-top: 1px solid #ddd;
                    padding-top: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #777;
                }

            </style>

        </head>


        <body>

            <div class="header">

                <h1>SAMSON</h1>

                <p>POLYTECHNIC COLLEGE OF DAVAO</p>

                <h2>ONLINE ENROLLMENT CONFIRMATION</h2>

            </div>


            <div class="reference">

                <p>Enrollment Reference</p>

                <strong>${reference}</strong>

            </div>


            <div class="details">

                <h3>Student Information</h3>

                <p><strong>Name:</strong> ${firstName} ${lastName}</p>

                <p><strong>Date of Birth:</strong> ${birthdate}</p>

                <p><strong>Contact:</strong> ${contact}</p>

                <p><strong>Email:</strong> ${email}</p>


                <h3>Program</h3>

                <p>${program}</p>


                <h3>Parent / Guardian</h3>

                <p>${guardian}</p>

            </div>


            <div class="footer">

                <p>Please keep this confirmation for your records.</p>

                <p>Samson Polytechnic College of Davao</p>

            </div>

        </body>

        </html>

    `);

    printWindow.document.close();

    printWindow.print();

}


/* =====================================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
===================================================== */

document
    .getElementById("successModal")
    .addEventListener("click", function (event) {

        if (event.target === this) {

            closeModal();

        }

    });


/* =====================================================
   MAKE FUNCTIONS AVAILABLE TO onclick="..." IN index.html
   (needed because this file is now a JavaScript module)
===================================================== */

window.nextStep = nextStep;
window.previousStep = previousStep;
window.closeModal = closeModal;
window.printEnrollment = printEnrollment;