
"use strict";

// 1. Get references to HTML elements
const studentForm = document.getElementById("studentForm");
const rollNumberInput = document.getElementById("rollNumber");
const studentNameInput = document.getElementById("studentName");
const departmentInput = document.getElementById("department");

const studentTableBody = document.getElementById("studentTableBody");
const recordCount = document.getElementById("recordCount");
const message = document.getElementById("message");

const formTitle = document.getElementById("formTitle");
const submitButton = document.getElementById("submitButton");
const cancelButton = document.getElementById("cancelButton");

// 2. Define the localStorage key
const STORAGE_KEY = "studentRecords";

// 3. Store student records in an array
let students = [];
let editingRollNumber = null;


// 4. Load existing records from localStorage
function loadStudents() {
    try {
        const savedRecords = localStorage.getItem(STORAGE_KEY);

        if (savedRecords === null) {
            students = [];
            return;
        }

        const parsedRecords = JSON.parse(savedRecords);

        if (
            !Array.isArray(parsedRecords) ||
            !parsedRecords.every(student =>
                student &&
                typeof student.rollNumber === "string" &&
                typeof student.name === "string" &&
                typeof student.department === "string"
            )
        ) {
            throw new Error("Invalid student data");
        }

        // Remove duplicate roll numbers from malformed stored data.
        const uniqueStudents = new Map();

        parsedRecords.forEach(student => {
            const roll = student.rollNumber.trim();

            if (roll !== "") {
                const key = roll.toLowerCase();

                if (!uniqueStudents.has(key)) {
                    uniqueStudents.set(key, {
                        rollNumber: roll,
                        name: student.name.trim(),
                        department: student.department.trim()
                    });
                }
            }
        });

        students = Array.from(uniqueStudents.values());

    } catch (error) {
        console.error("Unable to load student records:", error);
        students = [];

        showMessage(
            "Saved data could not be read. Please check browser storage.",
            "error"
        );
    }
}


// 5. Save records to localStorage
function saveStudents() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
        return true;
    } catch (error) {
        console.error("Unable to save student records:", error);

        showMessage(
            "Unable to save records. Check browser storage space or permissions.",
            "error"
        );

        return false;
    }
}


// 6. Display success or error messages
function showMessage(text, type) {
    message.textContent = text;
    message.className = type;
}


// 7. Display all student records in the table
function displayStudents() {
    // Clear the old table rows
    studentTableBody.replaceChildren();

    // Update the total number of students
    recordCount.textContent = `Total Students: ${students.length}`;

    // Display a message when no records exist
    if (students.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 4;
        cell.className = "empty-message";
        cell.textContent = "No student records found.";

        row.appendChild(cell);
        studentTableBody.appendChild(row);
        return;
    }

    // Create a table row for each student
    students.forEach(student => {
        const row = document.createElement("tr");

        const rollCell = document.createElement("td");
        rollCell.textContent = student.rollNumber;

        const nameCell = document.createElement("td");
        nameCell.textContent = student.name;

        const departmentCell = document.createElement("td");
        departmentCell.textContent = student.department;

        const actionCell = document.createElement("td");
        const actionButtons = document.createElement("div");

        actionButtons.className = "action-buttons";

        // Create Edit button
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "edit-button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            editStudent(student.rollNumber);
        });

        // Create Delete button
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "delete-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            deleteStudent(student.rollNumber);
        });

        actionButtons.append(editButton, deleteButton);
        actionCell.appendChild(actionButtons);

        row.append(
            rollCell,
            nameCell,
            departmentCell,
            actionCell
        );

        studentTableBody.appendChild(row);
    });
}


// 8. Check whether a roll number already exists
function rollNumberExists(rollNumber, excludeRollNumber = null) {
    const newKey = rollNumber.trim().toLowerCase();
    const excludedKey = excludeRollNumber === null
        ? null
        : excludeRollNumber.trim().toLowerCase();

    return students.some(student => {
        const existingKey = student.rollNumber.trim().toLowerCase();

        return existingKey === newKey && existingKey !== excludedKey;
    });
}


// 9. Handle adding a new student or updating an existing student
studentForm.addEventListener("submit", function (event) {
    // Prevent the page from refreshing
    event.preventDefault();

    const rollNumber = rollNumberInput.value.trim();
    const name = studentNameInput.value.trim();
    const department = departmentInput.value.trim();

    // Validate required fields, including whitespace-only input
    if (!rollNumber || !name || !department) {
        showMessage("Please fill in all three fields.", "error");
        return;
    }

    // Prevent duplicate roll numbers
    if (rollNumberExists(rollNumber, editingRollNumber)) {
        showMessage(
            "This roll number already exists. Please enter a unique roll number.",
            "error"
        );
        return;
    }

    // Create the student object
    const student = {
        rollNumber: rollNumber,
        name: name,
        department: department
    };

    // Update an existing student
    if (editingRollNumber !== null) {
        const index = students.findIndex(
            item => item.rollNumber === editingRollNumber
        );

        if (index === -1) {
            showMessage(
                "The student record could not be found. Please try again.",
                "error"
            );
            resetForm();
            return;
        }

        const oldStudent = students[index];
        students[index] = student;

        if (!saveStudents()) {
            students[index] = oldStudent;
            return;
        }

        showMessage("Student record updated successfully.", "success");

    } else {
        // Add a new student
        students.push(student);

        if (!saveStudents()) {
            students.pop();
            return;
        }

        showMessage("Student added successfully.", "success");
    }

    // Refresh the table and clear the form
    displayStudents();
    resetForm();
});


// 10. Load a student's details into the form for editing
function editStudent(rollNumber) {
    const student = students.find(
        item => item.rollNumber === rollNumber
    );

    if (!student) {
        showMessage("Student record not found.", "error");
        return;
    }

    rollNumberInput.value = student.rollNumber;
    studentNameInput.value = student.name;
    departmentInput.value = student.department;

    editingRollNumber = student.rollNumber;

    formTitle.textContent = "Edit Student";
    submitButton.textContent = "Update Student";
    cancelButton.hidden = false;

    showMessage("Edit the details and click Update Student.", "success");

    // Bring the form into view
    studentForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    rollNumberInput.focus();
}


// 11. Delete a student after confirmation
function deleteStudent(rollNumber) {
    const student = students.find(
        item => item.rollNumber === rollNumber
    );

    if (!student) {
        showMessage("Student record not found.", "error");
        return;
    }

    const confirmed = window.confirm(
        `Are you sure you want to delete ${student.name} ` +
        `(Roll Number: ${student.rollNumber})?`
    );

    // Stop if the user cancels
    if (!confirmed) {
        return;
    }

    const previousStudents = [...students];

    students = students.filter(
        item => item.rollNumber !== rollNumber
    );

    if (!saveStudents()) {
        students = previousStudents;
        return;
    }

    // If the deleted record is being edited, clear the form
    if (editingRollNumber === rollNumber) {
        resetForm();
    }

    displayStudents();
    showMessage("Student deleted successfully.", "success");
}


// 12. Reset the form after adding, updating or cancelling
function resetForm() {
    studentForm.reset();
    editingRollNumber = null;

    formTitle.textContent = "Add Student";
    submitButton.textContent = "Add Student";
    cancelButton.hidden = true;
}


// Cancel the edit operation
cancelButton.addEventListener("click", function () {
    resetForm();
    showMessage("Edit cancelled.", "success");
});


// 13. Start the application
loadStudents();
displayStudents();
