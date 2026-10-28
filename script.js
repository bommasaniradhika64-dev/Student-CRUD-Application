
const studentForm = document.getElementById("studentForm");
const rollInput = document.getElementById("rollNumber");
const nameInput = document.getElementById("studentName");
const departmentInput = document.getElementById("department");

const studentTable = document.getElementById("studentTable");
const searchInput = document.getElementById("searchInput");
const message = document.getElementById("message");

const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");

let students = JSON.parse(localStorage.getItem("campusStudents")) || [];
let editingRoll = null;

// Save student records in browser storage
function saveData() {
    localStorage.setItem("campusStudents", JSON.stringify(students));
}

// Display success or error message
function showMessage(text, color = "#16845c") {
    message.textContent = text;
    message.style.color = color;
}

// Add or update student
studentForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const roll = rollInput.value.trim();
    const name = nameInput.value.trim();
    const department = departmentInput.value;

    if (!roll || !name || !department) {
        showMessage("Please fill in all fields.", "#d44242");
        return;
    }

    // Prevent duplicate roll numbers
    const duplicate = students.some(function (student) {
        return student.roll.toLowerCase() === roll.toLowerCase()
            && student.roll !== editingRoll;
    });

    if (duplicate) {
        showMessage("This roll number already exists.", "#d44242");
        return;
    }

    if (editingRoll !== null) {
        // UPDATE operation
        students = students.map(function (student) {
            if (student.roll === editingRoll) {
                return {
                    roll: roll,
                    name: name,
                    department: department
                };
            }
            return student;
        });

        showMessage("Student details updated successfully!");
    } else {
        // CREATE operation
        students.push({
            roll: roll,
            name: name,
            department: department
        });

        showMessage("Student registered successfully!");
    }

    saveData();
    renderStudents();
    resetForm();
});

// Display student records
function renderStudents() {
    const keyword = searchInput.value.trim().toLowerCase();

    const filteredStudents = students.filter(function (student) {
        return student.roll.toLowerCase().includes(keyword)
            || student.name.toLowerCase().includes(keyword)
            || student.department.toLowerCase().includes(keyword);
    });

    studentTable.innerHTML = "";

    if (filteredStudents.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 4;
        cell.className = "empty";
        cell.textContent = students.length === 0
            ? "No records yet. Register your first student!"
            : "No matching students found.";

        row.appendChild(cell);
        studentTable.appendChild(row);
    } else {
        filteredStudents.forEach(function (student) {
            const row = document.createElement("tr");

            const rollCell = document.createElement("td");
            rollCell.className = "student-roll";
            rollCell.textContent = student.roll;

            const nameCell = document.createElement("td");
            nameCell.className = "student-name";
            nameCell.textContent = student.name;

            const departmentCell = document.createElement("td");
            const badge = document.createElement("span");
            badge.className = "dept-badge";
            badge.textContent = student.department;
            departmentCell.appendChild(badge);

            const actionsCell = document.createElement("td");

            const editButton = document.createElement("button");
            editButton.className = "action-btn edit-btn";
            editButton.textContent = "Edit";
            editButton.addEventListener("click", function () {
                editStudent(student.roll);
            });

            const deleteButton = document.createElement("button");
            deleteButton.className = "action-btn delete-btn";
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", function () {
                deleteStudent(student.roll);
            });

            actionsCell.append(editButton, deleteButton);
            row.append(
                rollCell,
                nameCell,
                departmentCell,
                actionsCell
            );

            studentTable.appendChild(row);
        });
    }

    // Update dashboard statistics
    document.getElementById("totalStudents").textContent = students.length;

    const departments = [...new Set(
        students.map(function (student) {
            return student.department;
        })
    )];

    document.getElementById("totalDepartments").textContent =
        departments.length;

    document.getElementById("recordCount").textContent =
        students.length + (students.length === 1 ? " record" : " records");
}

// Edit existing student
function editStudent(roll) {
    const student = students.find(function (item) {
        return item.roll === roll;
    });

    if (!student) return;

    editingRoll = student.roll;

    rollInput.value = student.roll;
    nameInput.value = student.name;
    departmentInput.value = student.department;

    document.getElementById("formTitle").textContent = "Edit Student";
    submitBtn.textContent = "Update Student";
    cancelBtn.hidden = false;

    showMessage("Editing student: " + student.name, "#176fc0");

    document.getElementById("student-form").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// Delete student
function deleteStudent(roll) {
    const confirmed = confirm(
        "Are you sure you want to delete student " + roll + "?"
    );

    if (!confirmed) return;

    students = students.filter(function (student) {
        return student.roll !== roll;
    });

    if (editingRoll === roll) {
        resetForm();
    }

    saveData();
    renderStudents();
    showMessage("Student record deleted successfully!");
}

// Reset form
function resetForm() {
    studentForm.reset();
    editingRoll = null;

    document.getElementById("formTitle").textContent = "Register Student";
    submitBtn.textContent = "Save Student";
    cancelBtn.hidden = true;
}

// Cancel edit
cancelBtn.addEventListener("click", function () {
    resetForm();
    showMessage("Edit cancelled.");
});

// Search records
searchInput.addEventListener("input", renderStudents);

// Load saved records when the page opens
renderStudents();
