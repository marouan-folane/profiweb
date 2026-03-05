const Client = require('../models/client.model');
const AppError = require('../utils/AppError');

/**
 * Service to handle core client operations
 */
class ClientService {
    /**
     * Creates a new client with validation and normalization
     */
    static async createClient(data, userId) {
        const {
            name, email, phone, company, industry, address, contactPerson, notes,
            status = "lead", source = "other"
        } = data;

        if (!name?.trim()) throw new AppError("Client name is required", 400);
        if (!email?.trim()) throw new AppError("Client email is required", 400);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) throw new AppError("Please provide a valid email address", 400);

        const normalizedPhone = phone ? phone.replace(/\s+/g, '') : '';
        const orConditions = [{ email: email.trim().toLowerCase() }];
        if (normalizedPhone) orConditions.push({ phone: normalizedPhone });

        const existingClient = await Client.findOne({ $isActive: true, $or: orConditions });
        if (existingClient) throw new AppError("A client with this email or phone already exists", 409);

        const clientAddress = address || { street: "", city: "", state: "", country: "Morocco", postalCode: "" };
        const clientContactPerson = contactPerson || {
            name: name.trim(), position: "Contact", email: email.trim().toLowerCase(), phone: normalizedPhone
        };

        return await Client.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: normalizedPhone,
            company: company ? company.trim() : "",
            industry: industry || "Other",
            address: clientAddress,
            contactPerson: clientContactPerson,
            notes: notes || "",
            status, source, createdBy: userId
        });
    }

    /**
     * List clients with filters and pagination
     */
    static async listClients(options) {
        const { search, status, industry, sort = 'name', page = 1, limit = 10 } = options;

        let query = { isActive: true };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { company: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) query.status = status;
        if (industry) query.industry = industry;

        const pageInt = parseInt(page);
        const limitInt = parseInt(limit);
        const skip = (pageInt - 1) * limitInt;

        const clients = await Client.find(query)
            .sort(sort).skip(skip).limit(limitInt)
            .populate({
                path: 'projects',
                match: { isDeleted: false, isActive: true },
                select: 'title status'
            })
            .select('-__v');

        const total = await Client.countDocuments(query);

        return {
            clients,
            pagination: { currentPage: pageInt, totalPages: Math.ceil(total / limitInt), totalItems: total, itemsPerPage: limitInt }
        };
    }

    /**
     * Get total projects and stats for clients (Optional expansion)
     */
    static async getClientById(id) {
        const client = await Client.findById(id).populate({
            path: 'projects',
            match: { isDeleted: false, isActive: true }
        });
        if (!client) throw new AppError("No client found with that ID", 404);
        return client;
    }
}

module.exports = ClientService;
