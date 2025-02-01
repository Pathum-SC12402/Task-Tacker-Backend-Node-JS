const express = require('express');
const router = express.Router();
const dataController = require('../controllers/DataController');

router.get('/getUserId', dataController.getUserId);
router.post('/create-task', dataController.addTask);
router.get('/get-all-tasks', dataController.getAllTasks);
router.get('/get-subTask/:taskId', dataController.getSubTasks);
router.delete('/delete-task/:taskId', dataController.deleteTask);
router.delete('/delete-Subtask/:subTaskId', dataController.deleteSubTask);
router.get('/get-TodayPlans/:userId', dataController.getTodayPlans);
router.get('/get-PastPlans/:userId', dataController.getPastPlans);
router.get('/get-FuturePlans/:userId', dataController.getFuturePlans);
router.put('/update-SubTask/:subTaskId', dataController.updateSubTask);

module.exports = router;
