const express = require('express');
const Task = require('../models/DataModel');
const moment = require("moment");

const User = require("../models/UserModel"); // Import your User model

exports.getUserId = async (req, res) => {
    try {
        const { email } = req.query; // Get email from query parameters

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ userId: user._id }); // Send user ID as response
    } catch (error) {
        console.error("Error fetching user ID:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.addTask = async (req, res) => {
    try {
        const { userId, date, title, subtasks } = req.body;

        if (!userId || !date || !title) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Format the date to 'YYYY-MM-DD' to avoid time zone issues
        const formattedDate = moment(date).format('YYYY-MM-DD'); // Ensures it's just the date without time

        const newTask = new Task({ userId, date: formattedDate, title, subtasks });
        await newTask.save();

        res.status(201).json({ message: "Task created successfully", task: newTask });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.addSubTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, completed } = req.body;
        const task = await Task.findById(taskId);
        console.log("Received taskId:", taskId);  // Log taskId being passed
        console.log("Task found:", task); // Log the found task
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        const newSubTask = { title, completed };
        task.subtasks.push(newSubTask);
        await task.save();
        res.status(201).json({ message: "Subtask added successfully", task });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find();
        res.status(200).json({ tasks });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getSubTasks = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await Task.findById(taskId);

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json({ subtasks: task.subtasks });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const deletedTask = await Task.findByIdAndDelete(taskId);

        if (!deletedTask) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json({ message: "Task deleted successfully", deletedTask });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.deleteSubTask = async (req, res) => {
    try {
        const { subTaskId } = req.params; // Extract subTaskId from URL
        const { taskId } = req.body; // Extract taskId from request body

        console.log("Received taskId:", taskId);  // Log taskId being passed
        console.log("Received subTaskId:", subTaskId);  // Log subTaskId being passed

        // Find the task by taskId
        const task = await Task.findById(taskId);

        if (!task) {
            console.log("Task not found for taskId:", taskId);  // Log if task is not found
            return res.status(404).json({ message: "Task not found" });
        }

        console.log("Task found:", task); // Log the found task

        // Find the subtask by subTaskId and remove it
        const subtaskIndex = task.subtasks.findIndex(subtask => subtask._id.toString() === subTaskId);

        if (subtaskIndex === -1) {
            console.log("Subtask not found for subTaskId:", subTaskId);  // Log if subtask is not found
            return res.status(404).json({ message: "Subtask not found" });
        }

        // Remove the subtask from the task's subtasks array
        task.subtasks.splice(subtaskIndex, 1);
        await task.save();

        res.status(200).json({ message: "Subtask deleted successfully", task });
    } catch (error) {
        console.error("Error deleting subtask:", error);  // Log any unexpected errors
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getTodayPlans = async (req, res) => {
    try {
        const { userId } = req.params; // Get userId from request params
        const startOfDay = moment().startOf('day'); // Start of today
        const endOfDay = moment().endOf('day'); // End of today

        // Find tasks that match today's date and belong to the user
        const tasks = await Task.find({
            userId,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (tasks.length === 0) {
            return res.status(404).json({ message: "No tasks found for today" });
        }

        res.status(200).json(tasks); // Return the array of tasks directly
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getPastPlans = async (req, res) => {
    try {
        const startOfToday = moment().startOf('day').toISOString();
        const { userId } = req.params;

        const tasks = await Task.find({
            userId: userId,
            date: { $lt: startOfToday }
        });

        if (tasks.length === 0) {
            return res.status(404).json({ message: `No past plans found for user ${userId}` });
        }

        res.status(200).json({ tasks });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getFuturePlans = async (req, res) => {
    try {
        // Get today's date in the required format (YYYY-MM-DD)
        const today = moment().format('YYYY-MM-DD');

        // Extract the userId from the URL parameter
        const { userId } = req.params;

        // Find all tasks for the specific user where the date is strictly after today
        const tasks = await Task.find({
            userId: userId,
            date: { $gt: today } // Find tasks with a date after today (exclude today and past)
        });

        if (tasks.length === 0) {
            return res.status(404).json({ message: `No future plans found for user ${userId}` });
        }

        res.status(200).json({ tasks });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { title, date } = req.body;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        if (title) task.title = title;
        if (date) task.date = date;
        task.updatedAt = new Date();

        await task.save();
        res.status(200).json({ message: "Task updated successfully", task });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.updateSubTask = async (req, res) => {
    try {
        const { subTaskId } = req.params;
        const { title, completed } = req.body;

        // Find the task that contains this subtask
        const task = await Task.findOne({ "subtasks._id": subTaskId });
        if (!task) {
            return res.status(404).json({ message: "Subtask not found" });
        }

        // Update the specific subtask
        const subtask = task.subtasks.id(subTaskId);
        if (title !== undefined) subtask.title = title;
        if (completed !== undefined) subtask.completed = completed;
        subtask.updatedAt = new Date();

        await task.save();
        res.status(200).json({ message: "Subtask updated successfully", subtask });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getTaskQty = async (req, res) => {
    try {
        const { userId } = req.params;

        const tasks = await Task.find({ userId });
        const totalTasks = tasks.length;

        const completedTasks = tasks.reduce((count, task) => {
            const allSubtasksCompleted = task.subtasks.length > 0 && task.subtasks.every(subtask => subtask.completed);
            return count + (allSubtasksCompleted ? 1 : 0);
        }, 0);

        const pendingTasks = totalTasks - completedTasks;

        res.status(200).json({ totalTasks, completedTasks, pendingTasks });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getRecentTasks = async (req, res) => {
    try {
        const { userId } = req.params;

        const startDate = moment().subtract(3, 'days').startOf('day');
        const endDate = moment().add(2, 'days').endOf('day');

        const recentTasks = await Task.find({
            userId: userId,
            date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
        });

        // now pass the taskTitle, taskStatus(completed, In Progress and Pending), and taskDate to the frontend
        const formattedTasks = recentTasks.map(task => {
            if(task.subtasks.length > 0) {
                const completedCount = task.subtasks.filter(subtask => subtask.completed).length;
                const totalCount = task.subtasks.length;
                let status = "Pending";
                if (completedCount === totalCount) {
                    status = "Completed";
                } else if (completedCount > 0) {
                    status = "In Progress";
                }
                return {
                    taskTitle: task.title,
                    taskStatus: status,
                    taskDate: task.date.toISOString().split("T")[0]
                };
            }
            return {
                taskTitle: task.title,
                taskStatus: "Pending",
                taskDate: task.date.toISOString().split("T")[0]
            };
        })

        res.status(200).json({ recentTasks:formattedTasks });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getSubTasksQtyforThisWeek = async (req, res) => {
    try {
        const { userId } = req.params; 

        const startOfWeek = moment().startOf('week'); // Start of the week
        const endOfWeek = moment().endOf('week'); // End of the week

        // Find tasks that belong to the user and fall within this week
        const tasks = await Task.find({
            userId,
            date: { $gte: startOfWeek, $lte: endOfWeek }
        });

        // Aggregate subtasks per day
        const weekTaskData = tasks.reduce((acc, task) => {
            const day = moment(task.date).format('ddd'); // Get short day name (Mon, Tue, etc.)
            const count = task.subtasks.length;

            // Check if the day already exists in the accumulator
            const existingDay = acc.find(item => item.day === day);

            if (existingDay) {
                existingDay.count += count; // Sum up the counts
            } else {
                acc.push({ day, count });
            }

            return acc;
        }, []);

        res.status(200).json({ weekTaskData });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        //pass the name and email
        const userDetails = {
            name: user.name,
            email: user.email
        };
        res.status(200).json( userDetails );
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.updateUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, email } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (name) user.name = name;
        if (email) user.email = email;

        await user.save();
        res.status(200).json({ message: "User details updated successfully", user });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.getUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ role: user.role });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.getAllUsers = async (req, res) => {
    try {
      const users = await User.find({ role: { $ne: "admin" } })  // exclude admin
        .select("-password -verificationCode -verificationCodeValidation -forgotPasswordCode -forgotPasswordCodeValidation -lastLogin");
  
      if (users.length === 0) {
        return res.status(404).json({ message: "No users found" });
      }
  
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
}

  

exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("Received userId:", userId);  // Log userId being passed
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

exports.getAppUsage = async (req, res) => {
  try {
    const allUsers = await User.find({});
    const monthlyLogins = {};

    // Get the last 6 months (including current)
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString("default", { month: "long" });
      const year = date.getFullYear();
      const key = `${monthName} ${year}`;
      months.push(key);
      monthlyLogins[key] = 0;
    }

    // Count users updated in those months
    allUsers.forEach((user) => {
      const updated = new Date(user.updatedAt);
      const key = updated.toLocaleString("default", { month: "long" }) + " " + updated.getFullYear();

      if (monthlyLogins.hasOwnProperty(key)) {
        monthlyLogins[key]++;
      }
    });

    // Format result
    const result = months.map((month) => ({
      month,
      count: monthlyLogins[month]
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Error in getAppUsage:", err);
    res.status(500).json({ error: "Server error" });
  }
};

