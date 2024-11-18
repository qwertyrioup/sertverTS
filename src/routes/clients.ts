// client.ts (route file)
import express, { Router } from 'express';
import {
  banClient,
  createClient,
  deleteClient,
  findAllClients,
  getClient,
  getClientCount,
  updateClient, verifyClient, verifyEmail
} from "../controllers/clients";

const router: Router = express.Router();

type Permissions = {
  createClient: string[];
  readClient: string[];
  updateClient: string[];
  deleteClient: string[];
};

const permissions: Permissions = {
  createClient: ['create:client'],
  readClient: ['read:client'],
  updateClient: ['update:client'],
  deleteClient: ['delete:client'],
};

// CLIENT ROUTES

// Create a new client
// @ts-ignore
router.post('/create', createClient);
// @ts-ignore
router.get('/verify-email', verifyEmail);

// Get all clients
router.get('/findall', findAllClients);

// Get client by ID
router.get('/getclient/:id', getClient);

// Update client information
// @ts-ignore
router.put('/update/:id', updateClient);

// Delete a client
router.delete('/delete/:id', deleteClient);

// @ts-ignore
router.delete('/BanClient/:id', banClient);
// @ts-ignore
router.delete('/verifyClient/:id', verifyClient);


// Get client count
router.get('/count', getClientCount);

export default router;
