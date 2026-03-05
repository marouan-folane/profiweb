const ClientService = require("../services/clientService");
const catchAsync = require("../utils/catchAsync");
const Client = require("../models/client.model");
const AppError = require("../utils/AppError");

const createClient = catchAsync(async (req, res, next) => {
  const client = await ClientService.createClient(req.body, req.user?.id);
  res.status(201).json({
    status: 'success',
    message: 'Client created successfully',
    data: { client }
  });
});

const getClients = catchAsync(async (req, res, next) => {
  const result = await ClientService.listClients(req.query);
  res.status(200).json({
    status: 'success',
    results: result.clients.length,
    data: result
  });
});

const getClientById = catchAsync(async (req, res, next) => {
  const client = await ClientService.getClientById(req.params.id);
  res.status(200).json({
    status: 'success',
    data: { client }
  });
});

const updateClient = catchAsync(async (req, res, next) => {
  const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!client) return next(new AppError("No client found with that ID", 404));

  res.status(200).json({
    status: 'success',
    data: { client }
  });
});

const deleteClient = catchAsync(async (req, res, next) => {
  const client = await Client.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!client) return next(new AppError("No client found with that ID", 404));

  res.status(200).json({
    status: 'success',
    message: 'Client deleted successfully'
  });
});

module.exports = {
  createClient,
  deleteClient,
  getClients,
  updateClient,
  getClientById
};