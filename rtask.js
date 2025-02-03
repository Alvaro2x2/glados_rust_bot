/**
 * RTask class handles the scheduling and execution of tasks.
 * Supports task creation, status checking, stopping, and deletion.
 * Tasks persist between bot restarts and are reloaded on startup.
 *
 * Task command example:
 *   :task search jackhammer 1 scrap 100
 *   -> Schedules a search for "jackhammer" with quantity 1, priced at 100 scrap or less.
 * 
 * Other commands:
 *   :task status   - Returns the list of active tasks.
 *   :task stop ID  - Stops the task with the given ID.
 *   :task delete ID - Deletes the task with the given ID.
 *
 * All code comments are provided in English.
 */
const fs = require('fs');
const path = require('path');
const rsearch = require('./functions/rsearch');  // Assumes rsearch exports an 'execute' function

class RTask {
  constructor() {
    this.tasks = {}; // Object to store tasks with task id as key
    this.persistencePath = path.join(__dirname, 'rtasks.json');
    this.loadTasks();
    // Initialize active tasks on startup
    for (const id in this.tasks) {
      const task = this.tasks[id];
      if (task.status === 'active') {
        this.scheduleTask(task);
      }
    }
  }

  // Generate a unique task ID (string between "0" and "99"); reuse IDs from deleted tasks.
  generateId() {
    for (let i = 0; i < 100; i++) {
      if (!this.tasks.hasOwnProperty(i.toString())) {
        return i.toString();
      }
    }
    // Fallback: return a random id if all are taken
    return Math.floor(Math.random() * 100).toString();
  }

  // Save tasks to a JSON file for persistence.
  saveTasks() {
    fs.writeFileSync(this.persistencePath, JSON.stringify(this.tasks, null, 2), 'utf8');
  }

  // Load tasks from the persistence file. Initialize with an empty object if file does not exist.
  loadTasks() {
    try {
      const data = fs.readFileSync(this.persistencePath, 'utf8');
      this.tasks = JSON.parse(data);
    } catch (e) {
      this.tasks = {};
    }
  }

  // Schedule periodic execution for a task (every 5 minutes).
  scheduleTask(task) {
    if (task.intervalRef) {
      clearInterval(task.intervalRef);
    }
    task.intervalRef = setInterval(() => {
      // Execute the search functionality using rsearch.
      // It is assumed that rsearch.execute returns an object with properties 'meetsFilter' and 'data'.
      const result = rsearch.execute(task.parameters);
      if (result && result.meetsFilter) {
        console.log(`Task ${task.id} result:`, result.data);
      }
    }, 300000); // 300,000 ms = 5 minutes
  }

  // Create a new task from a given command string.
  // Expected format: "search jackhammer 1 scrap 100"
  createTask(commandStr) {
    const parts = commandStr.trim().split(/\s+/);
    const type = parts[0];
    if (type === 'search') {
      if (parts.length < 5) {
        return 'Invalid search command format. Expected: search <item> <quantity> <costItem> <maxCost>';
      }
      const parameters = {
        item: parts[1],
        quantity: Number(parts[2]),
        costItem: parts[3],
        maxCost: Number(parts[4])
      };
      const id = this.generateId();
      const task = {
        id: id,
        type: type,
        parameters: parameters,
        status: 'active'
      };
      this.tasks[id] = task;
      this.scheduleTask(task);
      this.saveTasks();
      // Direct immediate execution for search commands
      const directResult = rsearch.execute(parameters);
      return `Task ${id} created. Immediate search result: ${JSON.stringify(directResult)}`;
    } else {
      return 'Unsupported task type';
    }
  }

  // Retrieve the status of all tasks.
  // Format: "ID - search jackhammer 1 scrap 100 active"
  getStatus() {
    let statusStr = '';
    for (const id in this.tasks) {
      const task = this.tasks[id];
      statusStr += `${id} - ${task.type} ${task.parameters.item} ${task.parameters.quantity} ${task.parameters.costItem} ${task.parameters.maxCost} ${task.status}\n`;
    }
    return statusStr.trim();
  }

  // Stop a task with the given ID by marking it as "stoped" and canceling its periodic execution.
  stopTask(id) {
    const task = this.tasks[id];
    if (!task) {
      return `Task ${id} not found.`;
    }
    if (task.intervalRef) {
      clearInterval(task.intervalRef);
      task.intervalRef = null;
    }
    task.status = 'stoped';
    this.saveTasks();
    return `Task ${id} stopped.`;
  }

  // Delete a task with the given ID and remove it from persistent storage.
  deleteTask(id) {
    const task = this.tasks[id];
    if (!task) {
      return `Task ${id} not found.`;
    }
    if (task.intervalRef) {
      clearInterval(task.intervalRef);
    }
    delete this.tasks[id];
    this.saveTasks();
    return `Task ${id} deleted.`;
  }
}

module.exports = RTask;
