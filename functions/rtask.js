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
const rsearch = require('./rsearch');

class RTask {
  constructor(rustplus) {
    this.tasks = {}; // Object to store tasks with task id as key
    this.persistencePath = path.join(__dirname, 'rtasks.json');
    this.rustplus = rustplus;
    this.loadTasks();
    // Initialize active tasks on startup
    if (rustplus) {
      for (const id in this.tasks) {
        const task = this.tasks[id];
        if (task.status === 'active') {
          this.scheduleTask(task, rustplus);
        }
      }
    }
  }

  generateId() {
    for (let i = 0; i < 100; i++) {
      if (!this.tasks.hasOwnProperty(i.toString())) {
        return i.toString();
      }
    }
    return Math.floor(Math.random() * 100).toString();
  }

  saveTasks() {
    try {
      // Remove intervalRef before saving as it can't be serialized
      const tasksToSave = {};
      for (const [id, task] of Object.entries(this.tasks)) {
        tasksToSave[id] = { ...task };
        delete tasksToSave[id].intervalRef;
      }
      fs.writeFileSync(this.persistencePath, JSON.stringify(tasksToSave, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving tasks:', error);
      if (this.rustplus) {
        this.rustplus.sendTeamMessage(`GLaDOS Error: Failed to save tasks - ${error.message}`);
      }
    }
  }

  loadTasks() {
    try {
      if (fs.existsSync(this.persistencePath)) {
        const data = fs.readFileSync(this.persistencePath, 'utf8');
        this.tasks = JSON.parse(data);
      } else {
        this.tasks = {};
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      this.tasks = {};
      if (this.rustplus) {
        this.rustplus.sendTeamMessage(`GLaDOS Error: Failed to load tasks - ${error.message}`);
      }
    }
  }

  scheduleTask(task, rustplus) {
    if (!rustplus) {
      console.error('RustPlus instance not provided for task scheduling');
      return;
    }

    if (task.intervalRef) {
      clearInterval(task.intervalRef);
    }

    if (task.type === 'search') {
      task.intervalRef = setInterval(async () => {
        try {
          console.log(new Date().toISOString(),` Executing task ${task.id}:`, task.parameters);
          const { item, quantity, costItem, maxCost } = task.parameters;
          // Use silent mode to avoid spamming chat with non-matching results
          const result = await rsearch.rsearch(rustplus, null, item, quantity, costItem, maxCost, true);
          
          if (result.matches && result.matches.length > 0) {
            // Only send messages for matches that meet criteria
            for (const match of result.matches) {
              const message = `GLaDOS Task ${task.id}: x${match.quantity} :${item}: at ${match.grid} - Price: ${match.costPerItem} ${match.currencyName} - Stock: ${match.amountInStock}`;
              rustplus.sendTeamMessage(message);
              console.log(new Date().toISOString(),` Task ${task.id} match found:`, message);
              // Add delay between messages
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        } catch (error) {
          console.error(`Error executing task ${task.id}:`, error);
          rustplus.sendTeamMessage(`GLaDOS Error in task ${task.id}: ${error.message}`);
        }
      }, 15000); // 300,000 ms = 5 minutes
    }
  }

  createTask(commandStr, rustplus) {
    if (!rustplus) {
      return 'Error: RustPlus instance not available';
    }

    const parts = commandStr.trim().split(/\s+/);
    const type = parts[0];
    if (type === 'search') {
      if (parts.length < 5) {
        return 'Invalid search command format. Expected: search <item> <quantity> <costItem> <maxCost>';
      }
      try {
        const parameters = {
          item: parts[1],
          quantity: Number(parts[2]),
          costItem: parts[3],
          maxCost: Number(parts[4])
        };

        if (isNaN(parameters.quantity) || parameters.quantity <= 0) {
          return 'Invalid quantity: must be a positive number';
        }
        if (isNaN(parameters.maxCost) || parameters.maxCost <= 0) {
          return 'Invalid maxCost: must be a positive number';
        }

        const id = this.generateId();
        const task = {
          id,
          type,
          parameters,
          status: 'active',
          created: new Date().toISOString()
        };
        this.tasks[id] = task;
        this.scheduleTask(task, rustplus);
        this.saveTasks();

        // Perform immediate search
        rsearch.rsearch(rustplus, null, parameters.item, parameters.quantity, parameters.costItem, parameters.maxCost, false)
          .then(result => {
            console.log(`Initial search for task ${id}:`, result);
          })
          .catch(error => {
            console.error(`Error in initial search for task ${id}:`, error);
          });

        return `Task ${id} created and scheduled. Searching for ${parameters.quantity} ${parameters.item} at ${parameters.maxCost} ${parameters.costItem} or less.`;
      } catch (error) {
        console.error('Error creating task:', error);
        return `Error creating task: ${error.message}`;
      }
    } else {
      return 'Unsupported task type';
    }
  }

  getStatus() {
    let statusStr = '';
    for (const id in this.tasks) {
      const task = this.tasks[id];
      statusStr += `${id} - ${task.type} ${task.parameters.item} ${task.parameters.quantity} ${task.parameters.costItem} ${task.parameters.maxCost} ${task.status} |`;
    }
    return statusStr.trim() || 'No active tasks.';
  }

  stopTask(id) {
    try {
      const task = this.tasks[id];
      if (!task) {
        return `Task ${id} not found.`;
      }
      if (task.intervalRef) {
        clearInterval(task.intervalRef);
        task.intervalRef = null;
      }
      task.status = 'stopped';
      task.lastUpdated = new Date().toISOString();
      this.saveTasks();
      return `Task ${id} stopped.`;
    } catch (error) {
      console.error('Error stopping task:', error);
      return `Error stopping task ${id}: ${error.message}`;
    }
  }

  deleteTask(id) {
    try {
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
    } catch (error) {
      console.error('Error deleting task:', error);
      return `Error deleting task ${id}: ${error.message}`;
    }
  }
}

module.exports = RTask;
