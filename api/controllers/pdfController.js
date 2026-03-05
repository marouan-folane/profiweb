// controllers/pdfController.js
const catchAsync = require("../utils/catchAsync");
const Project = require("../models/project.model");
const Question = require("../models/question.model");
const PDFGenerator = require("../utils/pdfGenerator");
const AppError = require("../utils/AppError");
const fs = require("fs");
const path = require("path");

const getProjectPDFs = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      documents: project.documents || [],
      project: {
        id: project._id,
        title: project.title
      }
    }
  });
});

const downloadPDF = catchAsync(async (req, res, next) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "../uploads/pdfs", filename);

  if (!fs.existsSync(filePath)) {
    return next(new AppError("File not found", 404));
  }

  res.download(filePath, filename, (err) => {
    if (err) {
      console.error("Download error:", err);
      return next(new AppError("Error downloading file", 500));
    }
  });
});

const generatePDFsForProject = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;

  const ProjectPDFService = require("../services/projectPDFService");
  const pdfResults = await ProjectPDFService.generateAllProjectPDFs(projectId, req.user.id);

  if (!pdfResults) {
    return next(new AppError("Failed to prepare data for PDF generation", 400));
  }

  // 3. Save to folders and update Project documents using ProjectFileService
  const ProjectFileService = require("../services/projectFileService");

  // Save Standard Info PDF
  await ProjectFileService.saveFileToProjectFolder(
    projectId,
    req.user.id,
    {
      name: "Project information pdf",
      description: "Standard project information and questions"
    },
    {
      filename: pdfResults.docInfos.filename,
      path: pdfResults.docInfos.url,
      size: "0"
    }
  );

  // Save AI Structured PDF
  await ProjectFileService.saveFileToProjectFolder(
    projectId,
    req.user.id,
    {
      name: "Generated instructions pdf",
      description: "Folder for generated PDF instructions"
    },
    {
      filename: pdfResults.aiStructured.filename,
      path: pdfResults.aiStructured.url,
      size: "0"
    }
  );

  // Refresh project to get updated documents
  const updatedProject = await Project.findById(projectId).populate('documents');

  res.status(201).json({
    status: "success",
    message: "PDFs generated and stored successfully",
    data: {
      project: updatedProject,
      pdfResults
    }
  });
});

const deletePDF = catchAsync(async (req, res, next) => {
  const { filename } = req.params;

  const result = await PDFGenerator.deletePDFs(`/uploads/pdfs/${filename}`);

  if (result.deleted > 0) {
    // Remove from project documents
    await Project.updateMany(
      { "documents.filename": filename },
      { $pull: { documents: { filename } } }
    );

    res.status(200).json({
      status: "success",
      message: "PDF deleted successfully"
    });
  } else {
    res.status(404).json({
      status: "error",
      message: "PDF not found or could not be deleted"
    });
  }
});

module.exports = {
  getProjectPDFs,
  downloadPDF,
  generatePDFsForProject,
  deletePDF
};