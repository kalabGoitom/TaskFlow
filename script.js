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

let taskList = JSON.parse(localStorage.getItem("taskList")) || [];

// Flags
let isEditing = false;
let editId = null;
let isSearching = false;
let sortIsHidden = true;
let sortingMethod = null;

let activeTab = "all";
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
  renderTasks(taskList);
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
  const searchInput = searchBarEl.value;
  filterSearch(searchInput);
});

priorityOption.addEventListener("change", () => {
  const priority = priorityOption.value;
  filterPriority(priority);
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

  sortTask(sortingMethod);
});

showNavBtn.addEventListener("click", () => {
  asideEl.classList.toggle("show");
});

// Functions

function activeNav(linkId) {
  if (linkId === "all") {
    renderTasks(taskList);
    activeTab = "all";
    currentTaskEl.textContent = "all tasks";
  } else if (linkId === "today") {
    activeTab = "today";
    tasks = taskList.filter((task) => {
      if (task.dueDate === todayDate) {
        return task;
      }
    });
    navigate(tasks, "today");
    currentTaskEl.textContent = "today's tasks";
  } else if (linkId === "important") {
    activeTab = "important";
    tasks = taskList.filter((task) => {
      if (task.isImportant) {
        return task;
      }
    });
    navigate(tasks, "important");
    currentTaskEl.textContent = "important tasks";
  } else if (linkId === "completed") {
    activeTab = "completed";
    tasks = taskList.filter((task) => {
      if (task.isCompleted) {
        return task;
      }
    });
    navigate(tasks, "completed");
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
  let tasks;
  taskList = taskList.filter((task) => !(parseInt(task.id) === parseInt(id)));

  saveToLocalStorage();
  updateStatistics();
  activeNav(activeTab);
  // if (activeTab === "all") {
  //   renderTasks();
  // } else if (activeTab === "today") {
  //   tasks = taskList.filter((task) => {
  //     if (task.dueDate === todayDate) {
  //       return task;
  //     }
  //   });
  //   navigate(tasks, "today");
  // } else if (activeTab === "important") {
  //   tasks = taskList.filter((task) => {
  //     if (task.isImportant) {
  //       return task;
  //     }
  //   });
  //   navigate(tasks, "important");
  // } else if (activeTab === "completed") {
  //   tasks = taskList.filter((task) => {
  //     if (task.isCompleted) {
  //       return task;
  //     }
  //   });
  //   navigate(tasks, "completed");
  // }
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
  renderTasks(taskList);
  reset();
  formSection.classList.toggle("hide");
  saveTaskBtn.innerHTML = "Save Tasks";
}

function importantList(id, btn) {
  let tasks;
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
  tasks = taskList.filter((task) => {
    if (task.isImportant) {
      return task;
    }
  });

  if (activeTab === "important") navigate(tasks, "important");
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

  if (activeTab === "all") {
    renderTasks(taskList);
  } else if (activeTab === "completed") {
    let tasks = taskList.filter((task) => {
      if (task.isCompleted) {
        return task;
      }
    });
    navigate(tasks, "completed");
  }
}

// function that resets input value to default
function reset() {
  taskTitle.value = "";
  taskDescription.value = "";
  taskDue.value = "";
  isEditing = false;
  editId = null;
}

function navigate(tasks, type) {
  if (tasks.length === 0) {
    let html;
    if (type === "today") {
      html = `<p>
                <span
                  ><i class="fa-solid fa-clipboard-list"></i></span
                >
                  <span
                    >No Tasks for Today!</span
                  >
              </p>`;
    } else if (type === "important") {
      html = `<p>
                <span
                  ><i class="fa-solid fa-clipboard-list"></i></span
                >
                  <span
                    >No Important Tasks!</span
                  >
              </p>`;
    } else if (type === "completed") {
      html = `<p>
                <span
                  ><i class="fa-solid fa-clipboard-list"></i></span
                >
                  <span
                    >No Completed Tasks!</span
                  >
              </p>`;
    }

    taskListContainer.innerHTML = html;
    return;
  }
  taskListContainer.innerHTML = html(tasks);
}

function filterSearch(searchInput) {
  let tasks = taskList.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchInput.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "all") return true;
    if (activeTab === "completed") return task.isCompleted;
    if (activeTab === "important") return task.isImportant;
    if (activeTab === "today") return task.dueDate === todayDate;

    return false;
  });

  if (activeTab === "all") {
    renderTasks(tasks);
  } else {
    navigate(tasks, activeTab);
  }
}

function filterPriority(priority) {
  let tasks = taskList.filter((task) => {
    let temp = priority === "all" || task.priority === priority;
    if (!temp) return false;

    if (activeTab === "all") return true;
    if (activeTab === "completed") return task.isCompleted;
    if (activeTab === "important") return task.isImportant;
    if (activeTab === "today") return task.dueDate === todayDate;
    return false;
  });

  if (activeTab === "all") {
    renderTasks(tasks);
  } else {
    navigate(tasks, activeTab);
  }
}

function sortTask(sortType) {
  let tasks = [...taskList];
  let sortedTasks;
  if (sortType === "date") {
    sortedTasks = sortByDueDate(tasks);
  } else if (sortType === "priority") {
    sortedTasks = sortyByPriority(tasks);
  } else if (sortType === "alphabet") {
    sortedTasks = sortByAlphabate(tasks);
  }
  renderSortedTasks(sortedTasks);
}

function renderSortedTasks(sortedTasks) {
  if (activeTab === "all") {
    renderTasks(sortedTasks);
  } else if (activeTab === "today") {
    sortedTasks = sortedTasks.filter((task) => {
      if (task.dueDate === todayDate) {
        return task;
      }
    });
    navigate(sortedTasks, "today");
  } else if (activeTab === "important") {
    sortedTasks = sortedTasks.filter((task) => {
      if (task.isImportant) {
        return task;
      }
    });
    navigate(sortedTasks, "important");
  } else if (activeTab === "completed") {
    sortedTasks = sortedTasks.filter((task) => {
      if (task.isCompleted) {
        return task;
      }
    });
    navigate(sortedTasks, "completed");
  }
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
  tasks = tasks.sort(
    (a, b) => weightPriority(a.priority) - weightPriority(b.priority),
  );
  console.log(tasks);

  return tasks;
}

function sortByDueDate(tasks) {
  tasks = tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  return tasks;
}

function sortByAlphabate(tasks) {
  tasks = tasks.sort((a, b) =>
    a.title.toLowerCase().localeCompare(b.title.toLowerCase()),
  );
  return tasks;
}
