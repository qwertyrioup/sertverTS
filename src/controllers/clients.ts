import { Request, Response, NextFunction } from 'express';
import Client, { IClient } from '../models/Client';
import { createError } from '../error';
import jwt from 'jsonwebtoken';
import nodemailer from "nodemailer";

// Create a new client
export const createClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for duplicate email or phone number
    const existingClient = await Client.findOne({
      $or: [
        { email: req.body.email },
        { phoneNumber: req.body.phoneNumber },
      ],
    });

    if (existingClient) {
      return res.status(400).json({ message: 'Email or phone number already in use' });
    }

    // Create and save new client
    const newClient = new Client({ ...req.body });
    const savedClient = await newClient.save();

    if (!savedClient) {
      return res.status(404).json({ message: 'Cannot create client' });
    }

    // Send email verification (placeholder for actual implementation)
    // Here, you would typically generate a verification token and send an email with a verification link.
    // For example:
    // const verificationToken = generateVerificationToken();
    // await sendVerificationEmail(savedClient.email, verificationToken);

    // @ts-ignore
    const verificationToken = generateVerificationToken(savedClient._id.toString());
    await sendVerificationEmail(savedClient.email, verificationToken);

    res.status(200).json(savedClient);
  } catch (error) {
    next(error);
  }
};
function generateVerificationToken(clientId: string): string {
  return jwt.sign({ clientId }, process.env.JWT_SECRET || 'ahmed', {
    expiresIn: '1d', // Token valid for 1 day
  });
}

async function sendVerificationEmail(email: string, token: string) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NODEMAILER_USER, // your email address
      pass: process.env.NODEMAILER_PASS, // your email password
    },
  });

  const verificationLink = `http://localhost:8800/clients/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.NODEMAILER_USER,
    to: email,
    subject: 'Email Verification',
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Affigen Gentaur</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding: 20px 0;
    }
    .header img {
      max-width: 150px;
    }
    .content {
      padding: 20px;
      text-align: center;
    }
    .button {
      display: inline-block;
      padding: 15px 25px;
      font-size: 16px;
      color: #ffffff;
      background-color: #007bff;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .warning {
      margin-top: 20px;
      padding: 15px;
      background-color: #ffdddd;
      border-left: 6px solid #f44336;
      color: #555;
    }
    .footer {
      margin-top: 20px;
      font-size: 14px;
      color: #777;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Welcome to Affigen Gentaur!</h2>
    </div>
    <div class="content">
      <p>Thank you for registering with Affigen Gentaur. Please verify your email address by clicking the button below:</p>
      <a href="${verificationLink}" class="button">Verify Email</a>
      <p>If you did not create an account with Affigen Gentaur, please ignore this email.</p>
    </div>
    <div class="warning">
      <strong>Important Security Notice:</strong>
      <ul>
        <li>Never share this email or verification link with anyone else.</li>
        <li>If you did not initiate this request, please contact our support team immediately.</li>
        <li>This link will expire in 24 hours for security purposes.</li>
      </ul>
    </div>
    <div class="footer">
      <p>Affigen Gentaur - Your trusted partner in biological products and biotechnology solutions.</p>
      <p>For any questions, please contact us at <a href="mailto:support@affigen-gentaur.com">support@affigen-gentaur.com</a>.</p>
    </div>
  </div>
</body>
</html>
`,
  };

  await transporter.sendMail(mailOptions);
}

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from query parameter (if you use GET method) or from request body (if you use POST)
    const token = req.query.token as string || req.body.token;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is missing' });
    }
    // Verify the token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'ahmed');
    const clientId = decoded.clientId;

    // Update client as verified
    const client = await Client.findByIdAndUpdate(clientId, { isEmilVerified: true }, { new: true });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.status(200).json({ message: 'Email verified successfully', client });
  } catch (error) {
    next(error);
  }
};

// Update client information
export const updateClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fieldsANDvalues: Record<string, any> = req.body || {};

    // Ensure password field is not included in updates
    delete fieldsANDvalues.password;

    // Filter out undefined or null fields
    const updateObject: Record<string, any> = {};
    for (const [key, value] of Object.entries(fieldsANDvalues)) {
      if (value !== undefined && value !== null) {
        updateObject[key] = value;
      }
    }

    // Update the client
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      { $set: updateObject },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedClient) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.status(200).json(updatedClient);
  } catch (error) {
    next(error);
  }
};

// Delete a client
export const deleteClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.status(200).json('Client Deleted Successfully!');
  } catch (error) {
    next(error);
  }
};

export const banClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = req.params.id;
    const updatedClient = await Client.findByIdAndUpdate(
      clientId,
      { isBnned: true },
      { new: true }
    );

    if (!updatedClient) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.status(200).json({ message: 'Client banned successfully', client: updatedClient });
  } catch (error) {
    next(error);
  }
};

export const verifyClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientId = req.params.id;
    const updatedClient = await Client.findByIdAndUpdate(
      clientId,
      { isVerified: true },
      { new: true }
    );

    if (!updatedClient) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.status(200).json({ message: 'Client verified successfully', client: updatedClient });
  } catch (error) {
    next(error);
  }
};


// Get client by ID
export const getClient = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return next(createError(404, 'Client not found!'));
    res.status(200).json(client);
  } catch (error) {
    next(error);
  }
};

// Get all clients
export const findAllClients = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clients = await Client.find();
    if (!clients) return next(createError(404, 'No clients found!'));

    res.status(200).json(clients);
  } catch (error) {
    next(error);
  }
};

// Get client count
export const getClientCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clientCount = await Client.countDocuments();
    res.status(200).json(clientCount);
  } catch (error) {
    next(error);
  }
};

export const getClientCountOverTime = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const clientCounts = await Client.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            emailVerified: '$isEmilVerified',
            banned: '$isBnned',
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          year: '$_id.year',
          month: '$_id.month',
          emailVerified: '$_id.emailVerified',
          banned: '$_id.banned',
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { year: 1, month: 1 },
      },
    ]);

    res.status(200).json(clientCounts);
  } catch (error) {
    next(error);
  }
};

