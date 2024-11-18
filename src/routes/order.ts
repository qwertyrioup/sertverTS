import express, { Router } from "express";
import {
  createOrder,
  deleteOrder,
  getAllOrders,
  getOrderById,
  getOrdersByPlatform,
  updateOrder, updateOrderStatus
} from "../controllers/order";



const router : Router = express.Router();


// const permissions = {
//   create: ['create:brand'],
//   read: ['read:brand'],
//   update: ['update:brand'],
//   delete: ['delete:brand']
// };



router.post('/', createOrder);

// Route to get all orders
router.get('/', getAllOrders);

// Route to get an order by its ID
// @ts-ignore
router.get('/get-oerder-by-id/:id', getOrderById);

// Route to get orders by platform
router.get('/get-oerder-by-platform/:platform', getOrdersByPlatform);
// @ts-ignore
router.put("/status/:orderId", updateOrderStatus);


// Route to update an order by its ID
// @ts-ignore
router.put('/update-order/:id', updateOrder);

// Route to delete an order by its ID
// @ts-ignore
router.delete('/delete-order/:id', deleteOrder);



////////////////////////                //////////////////
///////////////////////    DASH        //////////////////
/////////////////////                //////////////////
router.post("/create", createOrder);






export default router;
