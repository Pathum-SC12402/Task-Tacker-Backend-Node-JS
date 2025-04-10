const express = require('express');
const router = express.Router();
const dataController = require('../controllers/DataController');

router.get('/getUserId', dataController.getUserId);
router.post('/create-task', dataController.addTask);
router.post('/create-subTask/:taskId', dataController.addSubTask);
router.get('/get-all-tasks', dataController.getAllTasks);
router.get('/get-subTask/:taskId', dataController.getSubTasks);
router.delete('/delete-task/:taskId', dataController.deleteTask);
router.delete('/delete-Subtask/:subTaskId', dataController.deleteSubTask);
router.get('/get-TodayPlans/:userId', dataController.getTodayPlans);
router.get('/get-PastPlans/:userId', dataController.getPastPlans);
router.get('/get-FuturePlans/:userId', dataController.getFuturePlans);
router.put('/update-Task/:taskId', dataController.updateTask);
router.put('/update-SubTask/:subTaskId', dataController.updateSubTask);
router.get('/get-taskQty/:userId', dataController.getTaskQty);
router.get('/get-recentTasks/:userId', dataController.getRecentTasks);
router.get('/get-subTasksQtyforThisWeek/:userId', dataController.getSubTasksQtyforThisWeek);
router.get('/get-userDetails/:userId', dataController.getUserDetails);
router.put('/update-userDetails/:userId', dataController.updateUserDetails);
router.get('/get-userRole/:userId', dataController.getUserRole);
router.get('/getAllUsers', dataController.getAllUsers);
router.delete('/delete-user/:userId', dataController.deleteUser);
router.get('/get-appUsage', dataController.getAppUsage);


module.exports = router;
