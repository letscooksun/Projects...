"use strict";

const STORAGE_KEYS={TASKS:"taskflow_tasks",PROJECTS:"taskflow_projects",THEME:"taskflow_theme"};

function loadData(key,fallback=[]){try{const data=localStorage.getItem(key);return data?JSON.parse(data):fallback}catch(error){console.error("Storage error:",error);return fallback}}
function saveData(key,data){localStorage.setItem(key,JSON.stringify(data))}
function generateId(){return Date.now().toString(36)+Math.random().toString(36).substring(2,9)}
function getTodayString(){const date=new Date();return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}
function formatDate(dateString){if(!dateString)return "";return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})}
function escapeHTML(value){const div=document.createElement("div");div.textContent=value??"";return div.innerHTML}

let tasks=loadData(STORAGE_KEYS.TASKS);
let projects=loadData(STORAGE_KEYS.PROJECTS);
let currentFilter="all";
let searchQuery="";
let taskToDelete=null;

if(projects.length===0){projects=[{id:generateId(),name:"Personal"},{id:generateId(),name:"Work"},{id:generateId(),name:"College"}];saveData(STORAGE_KEYS.PROJECTS,projects)}

const elements={
taskList:document.getElementById("taskList"),emptyState:document.getElementById("emptyState"),
taskModal:document.getElementById("taskModal"),confirmModal:document.getElementById("confirmModal"),
taskForm:document.getElementById("taskForm"),taskId:document.getElementById("taskId"),
taskName:document.getElementById("taskName"),taskDescription:document.getElementById("taskDescription"),
taskPriority:document.getElementById("taskPriority"),taskDueDate:document.getElementById("taskDueDate"),
taskProject:document.getElementById("taskProject"),taskTags:document.getElementById("taskTags"),
modalTitle:document.getElementById("modalTitle"),searchInput:document.getElementById("searchInput"),
sortSelect:document.getElementById("sortSelect"),toast:document.getElementById("toast"),
taskTitle:document.getElementById("taskTitle"),taskSubtitle:document.getElementById("taskSubtitle"),
progressFill:document.getElementById("progressFill"),progressText:document.getElementById("progressText"),
totalTasks:document.getElementById("totalTasks"),completedTasks:document.getElementById("completedTasks"),
pendingTasks:document.getElementById("pendingTasks"),progressPercent:document.getElementById("progressPercent"),
allCount:document.getElementById("allCount"),todayCount:document.getElementById("todayCount"),
upcomingCount:document.getElementById("upcomingCount"),completedCount:document.getElementById("completedCount"),
projectsList:document.getElementById("projectsList"),currentDate:document.getElementById("currentDate")
};

function createTask(data){
 const task={id:generateId(),title:data.title.trim(),description:data.description.trim(),priority:data.priority,dueDate:data.dueDate,project:data.project,tags:data.tags,completed:false,createdAt:Date.now(),completedAt:null};
 tasks.unshift(task);saveData(STORAGE_KEYS.TASKS,tasks);render();showToast("Task created successfully")
}
function updateTask(id,data){
 const task=tasks.find(item=>item.id===id);if(!task)return;
 Object.assign(task,{title:data.title.trim(),description:data.description.trim(),priority:data.priority,dueDate:data.dueDate,project:data.project,tags:data.tags});
 saveData(STORAGE_KEYS.TASKS,tasks);render();showToast("Task updated successfully")
}
function deleteTask(id){tasks=tasks.filter(task=>task.id!==id);saveData(STORAGE_KEYS.TASKS,tasks);render();showToast("Task deleted")}
function toggleTask(id){
 const task=tasks.find(item=>item.id===id);if(!task)return;
 task.completed=!task.completed;task.completedAt=task.completed?Date.now():null;
 saveData(STORAGE_KEYS.TASKS,tasks);render();showToast(task.completed?"Task completed ✓":"Task marked as pending")
}

function getFilteredTasks(){
 let filtered=[...tasks];
 if(searchQuery){const query=searchQuery.toLowerCase();filtered=filtered.filter(task=>task.title.toLowerCase().includes(query)||task.description.toLowerCase().includes(query)||task.tags.some(tag=>tag.toLowerCase().includes(query)))}
 switch(currentFilter){
  case"today":filtered=filtered.filter(task=>task.dueDate===getTodayString());break;
  case"upcoming":filtered=filtered.filter(task=>!task.completed&&task.dueDate&&task.dueDate>getTodayString());break;
  case"completed":filtered=filtered.filter(task=>task.completed);break;
 }
 if(currentFilter.startsWith("project:")){const projectId=currentFilter.split(":")[1];filtered=filtered.filter(task=>task.project===projectId)}
 return filtered
}
function sortTasks(taskArray){
 const sort=elements.sortSelect.value;
 if(sort==="priority"){const order={high:1,medium:2,low:3};taskArray.sort((a,b)=>order[a.priority]-order[b.priority])}
 else if(sort==="due"){taskArray.sort((a,b)=>{if(!a.dueDate)return 1;if(!b.dueDate)return-1;return a.dueDate.localeCompare(b.dueDate)})}
 else if(sort==="alphabetical")taskArray.sort((a,b)=>a.title.localeCompare(b.title));
 else taskArray.sort((a,b)=>b.createdAt-a.createdAt);
 return taskArray
}
function renderTasks(){
 const filtered=sortTasks(getFilteredTasks());elements.taskList.innerHTML="";
 if(filtered.length===0){elements.emptyState.classList.add("show");return}
 elements.emptyState.classList.remove("show");
 filtered.forEach(task=>elements.taskList.appendChild(createTaskElement(task)))
}
function createTaskElement(task){
 const article=document.createElement("article");article.className=`task ${task.completed?"completed":""}`;
 const project=projects.find(p=>p.id===task.project);
 const tagsHTML=task.tags.length?task.tags.map(tag=>`<span class="due-date">#${escapeHTML(tag)}</span>`).join(""):"";
 article.innerHTML=`
 <div class="task-checkbox" data-action="toggle" data-id="${task.id}">${task.completed?"✓":""}</div>
 <div class="task-content">
  <div class="task-name">${escapeHTML(task.title)}</div>
  ${task.description?`<div class="task-description">${escapeHTML(task.description)}</div>`:""}
  <div class="task-meta">
   <span class="priority ${task.priority}">${task.priority}</span>
   ${task.dueDate?`<span class="due-date">📅 ${formatDate(task.dueDate)}</span>`:""}
   ${project?`<span class="due-date">📁 ${escapeHTML(project.name)}</span>`:""}
   ${tagsHTML}
  </div>
 </div>
 <div class="task-actions">
  <button data-action="edit" data-id="${task.id}" title="Edit">✏️</button>
  <button data-action="delete" data-id="${task.id}" title="Delete">🗑️</button>
 </div>`;
 return article
}
function renderStatistics(){
 const total=tasks.length,completed=tasks.filter(t=>t.completed).length,pending=total-completed,percentage=total?Math.round(completed/total*100):0;
 elements.totalTasks.textContent=total;elements.completedTasks.textContent=completed;elements.pendingTasks.textContent=pending;elements.progressPercent.textContent=`${percentage}%`;
 elements.progressFill.style.width=`${percentage}%`;elements.progressText.textContent=`${completed} / ${total}`
}
function renderCounts(){
 const today=getTodayString();
 elements.allCount.textContent=tasks.length;
 elements.todayCount.textContent=tasks.filter(t=>t.dueDate===today&&!t.completed).length;
 elements.upcomingCount.textContent=tasks.filter(t=>t.dueDate&&t.dueDate>today&&!t.completed).length;
 elements.completedCount.textContent=tasks.filter(t=>t.completed).length
}
function renderProjects(){
 elements.projectsList.innerHTML="";
 projects.forEach(project=>{
  const el=document.createElement("div");el.className="project-item";el.dataset.id=project.id;
  el.innerHTML=`<span class="project-dot"></span><span>${escapeHTML(project.name)}</span>`;
  el.addEventListener("click",()=>{currentFilter=`project:${project.id}`;updateNavigation();updateTitle();renderTasks()});
  elements.projectsList.appendChild(el)
 });
 elements.taskProject.innerHTML=`<option value="">No Project</option>`;
 projects.forEach(project=>{const option=document.createElement("option");option.value=project.id;option.textContent=project.name;elements.taskProject.appendChild(option)})
}
function updateTitle(){
 const titles={all:["All Tasks","Manage all your tasks"],today:["Today","Tasks due today"],upcoming:["Upcoming","Your upcoming tasks"],completed:["Completed","Tasks you've finished"]};
 if(currentFilter.startsWith("project:")){const project=projects.find(p=>p.id===currentFilter.split(":")[1]);elements.taskTitle.textContent=project?project.name:"Project";elements.taskSubtitle.textContent="Tasks in this project";return}
 const data=titles[currentFilter]||titles.all;elements.taskTitle.textContent=data[0];elements.taskSubtitle.textContent=data[1]
}
function updateNavigation(){document.querySelectorAll(".nav-item").forEach(item=>item.classList.toggle("active",item.dataset.filter===currentFilter))}
function openTaskModal(task=null){
 elements.taskModal.classList.add("show");
 if(task){
  elements.modalTitle.textContent="Edit Task";elements.taskId.value=task.id;elements.taskName.value=task.title;elements.taskDescription.value=task.description;
  elements.taskPriority.value=task.priority;elements.taskDueDate.value=task.dueDate;elements.taskProject.value=task.project;elements.taskTags.value=task.tags.join(", ")
 }else{elements.modalTitle.textContent="Create Task";elements.taskForm.reset();elements.taskId.value="";elements.taskPriority.value="medium"}
 setTimeout(()=>elements.taskName.focus(),100)
}
function closeTaskModal(){elements.taskModal.classList.remove("show");elements.taskForm.reset();elements.taskId.value=""}

elements.taskForm.addEventListener("submit",event=>{
 event.preventDefault();
 const data={title:elements.taskName.value,description:elements.taskDescription.value,priority:elements.taskPriority.value,dueDate:elements.taskDueDate.value,project:elements.taskProject.value,tags:elements.taskTags.value.split(",").map(tag=>tag.trim()).filter(Boolean)};
 const id=elements.taskId.value;if(id)updateTask(id,data);else createTask(data);closeTaskModal()
});
elements.taskList.addEventListener("click",event=>{
 const target=event.target.closest("[data-action]");if(!target)return;
 const action=target.dataset.action,id=target.dataset.id;
 if(action==="toggle")toggleTask(id);
 if(action==="edit"){const task=tasks.find(t=>t.id===id);if(task)openTaskModal(task)}
 if(action==="delete"){taskToDelete=id;elements.confirmModal.classList.add("show")}
});
document.getElementById("confirmDelete").addEventListener("click",()=>{if(taskToDelete)deleteTask(taskToDelete);taskToDelete=null;elements.confirmModal.classList.remove("show")});
document.getElementById("cancelDelete").addEventListener("click",()=>{taskToDelete=null;elements.confirmModal.classList.remove("show")});
document.getElementById("openAddTask").addEventListener("click",()=>openTaskModal());
document.getElementById("emptyAddTask").addEventListener("click",()=>openTaskModal());
document.getElementById("closeModal").addEventListener("click",closeTaskModal);
document.getElementById("cancelTask").addEventListener("click",closeTaskModal);
document.querySelectorAll(".nav-item").forEach(item=>item.addEventListener("click",()=>{currentFilter=item.dataset.filter;updateNavigation();updateTitle();renderTasks()}));
elements.searchInput.addEventListener("input",event=>{searchQuery=event.target.value.trim();renderTasks()});
elements.sortSelect.addEventListener("change",renderTasks);
document.addEventListener("keydown",event=>{
 if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){event.preventDefault();elements.searchInput.focus()}
 if(event.key==="Escape"){closeTaskModal();elements.confirmModal.classList.remove("show")}
});
function loadTheme(){if(localStorage.getItem(STORAGE_KEYS.THEME)==="dark")document.body.classList.add("dark")}
document.getElementById("themeToggle").addEventListener("click",()=>{
 document.body.classList.toggle("dark");localStorage.setItem(STORAGE_KEYS.THEME,document.body.classList.contains("dark")?"dark":"light")
});
document.getElementById("clearCompleted").addEventListener("click",()=>{
 const completed=tasks.filter(t=>t.completed).length;if(!completed){showToast("No completed tasks");return}
 tasks=tasks.filter(t=>!t.completed);saveData(STORAGE_KEYS.TASKS,tasks);render();showToast(`${completed} completed task${completed>1?"s":""} cleared`)
});
document.getElementById("addProject").addEventListener("click",()=>{
 const name=prompt("Enter project name:");if(!name||!name.trim())return;
 projects.push({id:generateId(),name:name.trim()});saveData(STORAGE_KEYS.PROJECTS,projects);renderProjects();showToast("Project created")
});
let toastTimer;
function showToast(message){elements.toast.textContent=message;elements.toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>elements.toast.classList.remove("show"),2500)}
function renderDate(){elements.currentDate.textContent=new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"})}
function renderGreeting(){
 const hour=new Date().getHours();document.querySelector(".welcome h2").textContent=hour<12?"Good morning 👋":hour<18?"Good afternoon 👋":"Good evening 👋"
}
function render(){renderTasks();renderStatistics();renderCounts();renderProjects();updateTitle()}
elements.taskModal.addEventListener("click",e=>{if(e.target===elements.taskModal)closeTaskModal()});
elements.confirmModal.addEventListener("click",e=>{if(e.target===elements.confirmModal)elements.confirmModal.classList.remove("show")});
loadTheme();renderDate();renderGreeting();render();
