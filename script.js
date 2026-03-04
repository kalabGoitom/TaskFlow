const taskListContainer = document.getElementById("task-list-container");
const searchBarEl = document.getElementById("search-bar");
const priorityOption = document.getElementById("priority");
const statisticsList = document.querySelector(".statistics-list");
const navBarContainer = document.getElementById("nav-bar");
const sortOptions = document.querySelector(".sort-type");
const sortOptionsContainer = sortOptions.querySelector("ul");
const asideEl = document.querySelector("aside");
const currentTaskEl = document.getElementById("current-task");

// Form section El
const formSection = document.querySelector(".form-section");
const taskTitle = document.getElementById("title");
const taskDescription = document.getElementById("description");
const taskDue = document.getElementById("due-date");
const taskPriority = document.getElementById("task-priority");

// btns
const addBtn = document.getElementById("add-btn");
const sortBtn = document.getElementById("sort-btn");
const hideBtn = document.getElementById("hide-btn");
const saveTaskBtn = document.getElementById("save-task");
const showNavBtn = document.getElementById("show-nav-btn");
const dayBtn = document.querySelector(".day-mode");
const nightBtn = document.querySelector(".night-mode");

let taskList = JSON.parse(localStorage.getItem("taskList")) || [];

// Flags
let isEditing = false;
let editId = null;
let isSearching = false;
let sortIsHidden = true;
let sortingMethod = null;
let searchQuery = "";
let activeTab = "all";
let selectedPriority = "all";

let todayDate = new Date().toISOString().split("T")[0];

// eventListners

window.addEventListener("DOMContentLoaded", () => {
  updateStatistics();
  renderTasks(taskList);
});

// adding
addBtn.addEventListener("click", () => {
  formSection.classList.toggle("hide");
});

// saving tasks
saveTaskBtn.addEventListener("click", (e) => {
  e.preventDefault();

  if (!(taskTitle.value && taskDue.value)) {
    console.log("Invalid input");
    return;
  }

  if (isEditing) {
    edit(editId);
    return;
  }

  activeTab = "all";
  const links = navBarContainer.querySelectorAll("li");

  links.forEach((item) => {
    if (item.dataset.id === "all") {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  createTask();
  updateUI();
  formSection.classList.toggle("hide");
  reset();
});

// hiding form section
hideBtn.addEventListener("click", () => {
  formSection.classList.toggle("hide");
  reset();
});

// navigation
navBarContainer.addEventListener("click", (e) => {
  const linkEl = e.target.closest("li");
  currentTabLink = linkEl;
  if (!linkEl) return;
  const linkId = linkEl.dataset.id;
  const links = navBarContainer.querySelectorAll("li");

  links.forEach((item) => {
    item.classList.remove("active");
  });
  linkEl.classList.add("active");

  activeNav(linkId);
  asideEl.classList.toggle("show");
});

taskListContainer.addEventListener("click", (e) => {
  const el = e.target.closest("li");
  if (!el) return;
  const elId = String(el.dataset.id);

  if (e.target.classList.contains("fa-trash")) deleteTask(elId);
  if (e.target.classList.contains("fa-edit")) editTask(elId);
  if (e.target.classList.contains("fa-star")) {
    importantList(elId, e.target.parentElement);
  }
  if (e.target.classList.contains("checkbox")) taskCompleted(elId);
});

searchBarEl.addEventListener("input", () => {
  isSearching = true;
  searchQuery = searchBarEl.value;
  // filterSearch(searchInput);
  updateUI();
});

priorityOption.addEventListener("change", () => {
  selectedPriority = priorityOption.value;
  // filterPriority(priority);
  updateUI();
});

sortBtn.addEventListener("click", () => {
  if (sortIsHidden) {
    sortOptions.style.display = "block";
    sortIsHidden = false;
  } else {
    sortOptions.style.display = "none";
    sortIsHidden = true;
  }
});

sortOptionsContainer.addEventListener("click", (e) => {
  const sortType = e.target.dataset.type;
  if (!sortType) return;
  sortingMethod = sortType.toLowerCase();
  sortOptions.style.display = "none";

  // sortTask(sortingMethod);
  updateUI();
});

showNavBtn.addEventListener("click", () => {
  asideEl.classList.toggle("show");
});

nightBtn.addEventListener("click", () => {
  dayBtn.classList.remove("hide");
  nightBtn.classList.add("hide");
  document.querySelector("body").classList.remove("default");
  console.log("working");
});

dayBtn.addEventListener("click", () => {
  dayBtn.classList.add("hide");
  nightBtn.classList.remove("hide");
  document.querySelector("body").classList.add("default");
  console.log("working");
});

// Functions

function activeNav(linkId) {
  if (linkId === "all") {
    activeTab = "all";
    updateUI();
    currentTaskEl.textContent = "all tasks";
  } else if (linkId === "today") {
    activeTab = "today";
    updateUI();
    currentTaskEl.textContent = "today's tasks";
  } else if (linkId === "important") {
    activeTab = "important";
    updateUI();
    currentTaskEl.textContent = "important tasks";
  } else if (linkId === "completed") {
    activeTab = "completed";
    updateUI();
    currentTaskEl.textContent = "completed tasks";
  }
}

// Update statistics UI
function updateStatistics() {
  let totalTasks = taskList.length;
  let pendingTasks = taskList.filter((task) => !task.isCompleted).length;
  let completedTasks = taskList.filter((task) => task.isCompleted).length;

  statisticsList.innerHTML = `  
             <li><span>Total Task</span> <span>${totalTasks}</span></li>
            <li><span>Completed</span> <span>${completedTasks}</span></li>
            <li><span>Pending </span> <span>${pendingTasks}</span></li>`;
}
updateStatistics();

function createTask() {
  const task = {
    title: taskTitle.value,
    description: taskDescription.value,
    dueDate: taskDue.value,
    priority: taskPriority.value,
    isCompleted: false,
    isImportant: false,
    id: Date.now(),
  };

  taskList.push(task);
  saveToLocalStorage();
}

// Updates the UI
function renderTasks(task) {
  let tasks = task;

  if (tasks.length === 0) {
    taskListContainer.innerHTML = `<p>
                <span
                  ><i class="fa-solid fa-clipboard-list"></i></span
                >
                  <span
                    >No tasks found. Add a new task to get started!</span
                  >
              </p>`;
    return;
  }
  taskListContainer.innerHTML = html(tasks);
  updateStatistics();
}

function updateUI() {
  let tasks = [...taskList];

  // Apply active tab filter
  if (activeTab === "today") {
    tasks = tasks.filter((task) => task.dueDate === todayDate);
  }

  if (activeTab === "important") {
    tasks = tasks.filter((task) => task.isImportant);
  }

  if (activeTab === "completed") {
    tasks = tasks.filter((task) => task.isCompleted);
  }

  // Apply search filter
  if (searchQuery) {
    tasks = tasks.filter((task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }

  // Apply priority filter
  if (selectedPriority !== "all") {
    tasks = tasks.filter((task) => task.priority === selectedPriority);
  }

  // Apply sorting
  if (sortingMethod === "priority") {
    tasks = sortyByPriority(tasks);
  }

  if (sortingMethod === "date") {
    tasks = sortByDueDate(tasks);
  }

  if (sortingMethod === "alphabet") {
    tasks = sortByAlphabate(tasks);
  }

  // Render
  renderTasks(tasks);
}

function html(tasks) {
  tasks = tasks
    .map((task) => {
      return ` 
              <li class=${task.priority} data-id=${task.id}>
                <div class="task-container">
                  <div class="task-discription">
                    <div class="task-name">
                      <input class="checkbox" type="checkbox" for=${task.id} id=${task.id}  ${task.isCompleted ? "checked" : ""}>
                      <label for=${task.id}>${task.title}</label>
                    </div>
                    <h3>${task.description}</h3>

                    <div class="data-container">
                      <div class="date">
                        <span><i class="fa-solid fa-calendar-days"></i></span>
                        <span>${formatDate(task.dueDate)}</span>
                      </div>

                      <div class="label-container">
                        <i class="fa-solid fa-bolt"></i>
                        <span class="label">${task.priority}</span>
                      </div>
                    </div>
                  </div>

                  <div class="task-btns">
                    <button class = "important-btn ${task.isImportant ? "important" : ""}">
                      <i class="fa fa-star"></i>
                    </button>
                    <button class="edit-btn" data-id="edit"><i class="fa fa-edit"></i></button>
                    <button class="delete-btn"  data-id="delete">
                      <i class="fa fa-trash"></i>
                    </button>
                  </div>
                </div>
              </li>`;
    })
    .join(" ");
  return tasks;
}

// Function for saving the tasks to LocalStorage
function saveToLocalStorage() {
  localStorage.setItem("taskList", JSON.stringify(taskList));
}

function getLocaltStorage() {
  const tasks = JSON.parse(localStorage.getItem("taskList"));
  return tasks;
}

// Format Date
function formatDate(dateVal) {
  const date = new Date(dateVal);

  const formatted = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  // Replace comma between day and year with a dot
  const finalFormat = formatted.replace(",", ".").replace(", ", ", ");

  return finalFormat;
}

// Function for deleting tasks

function deleteTask(id) {
  taskList = taskList.filter((task) => !(parseInt(task.id) === parseInt(id)));

  saveToLocalStorage();
  updateStatistics();
  updateUI();
}

// function for editing tasks
function editTask(id) {
  isEditing = true;
  editId = id;

  taskList.map((task) => {
    if (parseInt(id) === parseInt(task.id)) {
      taskTitle.value = task.title;
      taskDescription.value = task.description;
      taskDue.value = task.dueDate;
      taskPriority.value = task.priority;
    }
  });
  formSection.classList.toggle("hide");
  saveTaskBtn.innerHTML = "Edit Tasks";
}

function edit(id) {
  taskList = taskList.map((task) => {
    if (parseInt(id) === parseInt(task.id)) {
      task.title = taskTitle.value;
      task.description = taskDescription.value;
      task.dueDate = taskDue.value;
      task.priority = taskPriority.value;
    }
    return task;
  });
  saveToLocalStorage();
  updateUI();
  formSection.classList.toggle("hide");
  saveTaskBtn.innerHTML = "Save Tasks";
}

function importantList(id, btn) {
  taskList = taskList.map((task) => {
    if (parseInt(id) === parseInt(task.id)) {
      if (task.isImportant) {
        task.isImportant = false;
        btn.classList.remove("important");
      } else {
        task.isImportant = true;
        btn.classList.add("important");
      }
    }
    return task;
  });
  saveToLocalStorage();
  updateUI();
}

function taskCompleted(id) {
  taskList = taskList.map((task) => {
    if (parseInt(task.id) === parseInt(id)) {
      if (task.isCompleted) {
        task.isCompleted = false;
      } else {
        task.isCompleted = true;
      }
    }
    return task;
  });
  saveToLocalStorage();
  updateStatistics();
  updateUI();
}

// function that resets input value to default
function reset() {
  taskTitle.value = "";
  taskDescription.value = "";
  taskDue.value = "";
  isEditing = false;
  editId = null;
}

function weightPriority(priority) {
  const weight = {
    high: 1,
    medium: 2,
    low: 3,
  };

  return weight[priority];
}

// Sorting functions

function sortyByPriority(tasks) {
  tasks.sort((a, b) => weightPriority(a.priority) - weightPriority(b.priority));
  console.log(tasks);

  return tasks;
}

function sortByDueDate(tasks) {
  tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  return tasks;
}

function sortByAlphabate(tasks) {
  tasks.sort((a, b) =>
    a.title.toLowerCase().localeCompare(b.title.toLowerCase()),
  );
  return tasks;
}
