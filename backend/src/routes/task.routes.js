import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { z } from "zod";

const router = Router();



function parseTaskId(value) {
  const taskId = Number(value);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    return null;
  }

  return taskId;
}

router.get("/", authenticateToken, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve tasks",
    });
  }
});

const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required"),

  description: z
    .string()
    .trim()
    .optional()
    .nullable(),

  priority: z.enum(["LOW", "MEDIUM", "HIGH"], {
    message: "Priority must be LOW, MEDIUM, or HIGH",
  }),

  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"], {
    message: "Status must be PENDING, IN_PROGRESS, or COMPLETED",
  }),

  dueDate: z
    .string()
    .min(1, "Due date is required")
    .refine((value) => {
      const dueDate = new Date(value);

      if (Number.isNaN(dueDate.getTime())) {
        return false;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      dueDate.setHours(0, 0, 0, 0);

      return dueDate >= today;
    }, "Due date cannot be earlier than today"),
});

const updateTaskSchema = createTaskSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Provide at least one field to update",
    },
  );


router.post("/", authenticateToken, async (req, res) => {
  try {
    const validationResult = createTaskSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Task validation failed",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const { title, description, priority, status, dueDate } =
      validationResult.data;

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        priority,
        status,
        dueDate: new Date(dueDate),
        userId: req.user.id,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create task",
    });
  }
});

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const taskId = parseTaskId(req.params.id);

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: req.user.id,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    return res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Get task error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve task",
    });
  }
});

router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const taskId = parseTaskId(req.params.id);

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const validationResult = updateTaskSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Task validation failed",
        errors: validationResult.error.flatten().fieldErrors,
      });
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: req.user.id,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const updateData = {
      ...validationResult.data,
    };

    if ("description" in updateData) {
      updateData.description = updateData.description || null;
    }

    if (updateData.dueDate) {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("Update task error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update task",
    });
  }
});

router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const taskId = parseTaskId(req.params.id);

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: req.user.id,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    await prisma.task.delete({
      where: {
        id: taskId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete task",
    });
  }
});

export default router;