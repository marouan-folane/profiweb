// controllers/clientController.js
const catchAsync = require("../utils/catchAsync");
const Client = require("../models/client.model");
const AppError = require("../utils/AppError");

const createClient = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    phone,
    company,
    industry,
    address,
    contactPerson,
    notes,
    status = "lead",
    source = "other"
  } = req.body;

  // ── Required field validation ────────────────────────────────────────────
  if (!name || !name.trim()) {
    return next(new AppError("Client name is required", 400));
  }

  if (!email || !email.trim()) {
    return next(new AppError("Client email is required", 400));
  }

  // ── Email format validation ──────────────────────────────────────────────
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return next(new AppError("Please provide a valid email address", 400));
  }

  // ── Phone format validation (if provided) ────────────────────────────────
  const normalizedPhone = phone ? phone.replace(/\s+/g, '') : '';
  if (normalizedPhone && !/^[+]?[\d\s\-().]{7,20}$/.test(normalizedPhone)) {
    return next(new AppError("Please provide a valid phone number", 400));
  }

  // ── Duplicate checks ─────────────────────────────────────────────────────
  // Build OR query so we only hit the DB once
  const orConditions = [{ email: email.trim().toLowerCase() }];
  if (normalizedPhone) orConditions.push({ phone: normalizedPhone });

  const existingClient = await Client.findOne({ $or: orConditions });

  if (existingClient) {
    if (existingClient.email === email.trim().toLowerCase()) {
      return next(new AppError("A client with this email already exists", 409));
    }
    if (normalizedPhone && existingClient.phone === normalizedPhone) {
      return next(new AppError("A client with this phone number already exists", 409));
    }
    return next(new AppError("A client with these details already exists", 409));
  }

  // ── Build sub-documents ──────────────────────────────────────────────────
  const clientAddress = address || {
    street: "",
    city: "",
    state: "",
    country: "Morocco",
    postalCode: ""
  };

  const clientContactPerson = contactPerson || {
    name: name.trim(),
    position: "Contact",
    email: email.trim().toLowerCase(),
    phone: normalizedPhone
  };

  // ── Create ───────────────────────────────────────────────────────────────
  const client = await Client.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: normalizedPhone,
    company: company ? company.trim() : "",
    industry: industry || "Other",
    address: clientAddress,
    contactPerson: clientContactPerson,
    notes: notes || "",
    status,
    source,
    createdBy: req.user?.id
  });

  res.status(201).json({
    status: 'success',
    message: 'Client created successfully',
    data: { client }
  });
});

const deleteClient = catchAsync(async (req, res, next) => {
  const client = await Client.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });

  if (!client) {
    return next(new AppError("No client found with that ID", 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Client deleted successfully'
  });
});

const updateClient = catchAsync(async (req, res, next) => {
  const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!client) {
    return next(new AppError("No client found with that ID", 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      client
    }
  });
});

const getClientById = catchAsync(async (req, res, next) => {
  const client = await Client.findById(req.params.id).populate({
    path: 'projects',
    match: { isDeleted: false, isActive: true }
  });

  if (!client) {
    return next(new AppError("No client found with that ID", 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      client
    }
  });
});

const getClients = catchAsync(async (req, res, next) => {
  // Get query parameters for filtering, sorting, pagination
  const {
    search,
    status,
    industry,
    sort = 'name',
    page = 1,
    limit = 10
  } = req.query;

  // Build query
  let query = { isActive: true };

  // Search by name, email, company, or phone
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by industry
  if (industry) {
    query.industry = industry;
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);

  // Execute query with pagination
  const clients = await Client.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limitInt)
    .populate({
      path: 'projects',
      match: { isDeleted: false, isActive: true },
      select: 'title status'
    })
    .select('-__v'); // Exclude version key

  // Get total count for pagination
  const total = await Client.countDocuments(query);
  const totalPages = Math.ceil(total / limitInt);

  res.status(200).json({
    status: 'success',
    results: clients.length,
    data: {
      clients,
      pagination: {
        currentPage: pageInt,
        totalPages,
        totalItems: total,
        itemsPerPage: limitInt
      }
    }
  });
});

module.exports = {
  createClient,
  deleteClient,
  getClients,
  updateClient,
  getClientById
};