const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const bodyParser = require("body-parser");
const path = require('path');

const authRouter = require("./routes/auth.routes");
const adminRouter = require("./routes/admin.routes");
const projectsRouter = require("./routes/project.routes");
const clientsRouter = require("./routes/client.routes");
const templatesRouter = require("./routes/template.routes");
const pdfRouter = require("./routes/pdf.routes");
const folderRouter = require("./routes/folder.routes");
const fileRouter = require("./routes/file.routes");
const uploadRouter = require("./routes/upload.routes");
const roleRouter = require("./routes/role.routes");
const aiInteractionsRouter = require("./routes/ai-interactions.routes");
const siteAccessRouter = require("./routes/siteAccess.routes");
const checklistRouter = require("./routes/checklist.routes");
const profileRouter = require("./routes/profile.routes");
const statsRouter = require("./routes/stats.routes");
const questionTemplateRouter = require('./routes/questionTemplate.routes');
const notificationRouter = require('./routes/notification.routes');
const userRouter = require('./routes/user.routes');

const handleErrors = require("./middlewares/handleErrors");
const cors = require("cors");

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config({ path: "./config/config.env" });

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json());

app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

connectDB();

app.get("/", (req, res) => {
  res.send("Server Started Successfully :)");
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admins", adminRouter);
app.use("/api/v1/projects", projectsRouter);
app.use("/api/v1/clients", clientsRouter);
app.use("/api/v1/templates", templatesRouter);
app.use("/api/v1/pdfs", pdfRouter);
app.use("/api/v1/folders", folderRouter);
app.use("/api/v1/files", fileRouter);
app.use("/api/v1/upload", uploadRouter);
app.use("/api/v1/role", roleRouter);
app.use("/api/v1/ai-interactions", aiInteractionsRouter);
app.use("/api/v1/site-access", siteAccessRouter);
app.use("/api/v1/checklist", checklistRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/stats", statsRouter);
app.use('/api/v1/question-templates', questionTemplateRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/users', userRouter);

app.use(handleErrors);

app.use((err, req, res, next) => {
  console.error("❌ UNHANDLED ERROR:", err.message);
  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Server error. Please try again later.",
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ✅ Only listen locally — Vercel handles this in production
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 2030;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;