import { NextFunction, Request, Response } from 'express';
import Order from '../models/Order';
import { getOrderMailOptions, getTransporter } from "../affigen_helpers";
import Client from "../models/Client";

export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
    try {
        const transporter = await getTransporter();

        // Validate client
        const client = await Client.findById(req.body.clientId);
        if (!client || !client.isEmilVerified) {
            res.status(400).json({ message: 'Client is not verified. Cannot create order.' });
            return; // Ensure no further code is executed
        }

        // Create new order
        const newOrder = new Order({
            ...req.body,
        });

        const savedOrder = await newOrder.save();
        await savedOrder.populate('clientId', 'firstname lastname email country phoneNumber');

        // Send response after saving the order
        res.status(200).json({
            ...savedOrder.toObject(),
        });

        // Send email notification after response
        const mailOptions = getOrderMailOptions(savedOrder.clientId, req.body.cart, req.body.comment);
        transporter.sendMail(mailOptions, (error: any) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email Sent');
            }
        });
    } catch (err) {
        if (!res.headersSent) {
            next(err); // Pass to the error handling middleware if no response has been sent yet
        } else {
            console.error('Unhandled error after response:', err);
        }
    }
};



export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orders = await Order.find().populate('clientId', 'firstname lastname email country phoneNumber');
        res.status(200).json(orders.map(order => ({
            ...order.toObject()
        })));
    } catch (err) {
        next(err);
    }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        // Validate the status value
        const allowedStatuses = ["pending", "in progress", "shipped", "delivered", "canceled", "refunded"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value." });
        }

        // Find the order and update the status
        const updatedOrder = await Order.findByIdAndUpdate(
          orderId,
          { status: status },
          { new: true } // Return the updated order
        ).populate('clientId', 'firstname lastname email country phoneNumber');

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found." });
        }

        // Return the updated order as response
        res.status(200).json({
            ...updatedOrder.toObject()
        });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const order = await Order.findById(req.params.id).populate('clientId', 'firstname lastname email country phoneNumber');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json({
            ...order.toObject()
        });
    } catch (err) {
        next(err);
    }
};

export const getOrdersByPlatform = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { platform } = req.params;
        const orders = await Order.find({ platform: platform }).populate('clientId', 'firstname lastname email country phoneNumber');
        res.status(200).json(orders.map(order => ({
            ...order.toObject()
        })));
    } catch (err) {
        next(err);
    }
};

export const updateOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate('clientId', 'firstname lastname email country phoneNumber');
        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json({
            ...updatedOrder.toObject()
        });
    } catch (err) {
        next(err);
    }
};

export const deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const deletedOrder = await Order.findByIdAndDelete(req.params.id).populate('clientId', 'firstname lastname email country phoneNumber');
        if (!deletedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (err) {
        next(err);
    }
};

export const getOrderCountOverTime = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
    try {
        const orderCounts = await Order.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        status: '$status',
                    },
                    count: { $sum: 1 },
                    totalSales: { $sum: '$cart.total' },
                },
            },
            {
                $project: {
                    year: '$_id.year',
                    month: '$_id.month',
                    status: '$_id.status',
                    count: 1,
                    totalSales: 1,
                    _id: 0,
                },
            },
            {
                $sort: { year: 1, month: 1 },
            },
        ]);

        res.status(200).json(orderCounts);
    } catch (error) {
        next(error);
    }
};

export const getBestSellingProductAndPlatformAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
    try {
        // Get best-selling product each month
        const bestSellingProductsByMonth = await Order.aggregate([
            {
                $unwind: {
                    path: '$cart.products',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $match: {
                    'cart.products.product_name': { $ne: null },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        productName: '$cart.products.product_name',
                        catAffigen: '$cart.products.cat_affigen',
                    },
                    totalQuantity: { $sum: { $toInt: '$cart.products.qty' } },
                },
            },
            {
                $project: {
                    year: '$_id.year',
                    month: '$_id.month',
                    productName: '$_id.productName',
                    catAffigen: '$_id.catAffigen',
                    totalQuantity: 1,
                    _id: 0,
                },
            },
            {
                $sort: { year: 1, month: 1, totalQuantity: -1 },
            },
            {
                $group: {
                    _id: {
                        year: '$year',
                        month: '$month',
                    },
                    bestProduct: { $first: '$$ROOT' },
                },
            },
            {
                $replaceRoot: { newRoot: '$bestProduct' },
            },
        ]);

        // Get order count per platform
        const orderCountByPlatform = await Order.aggregate([
            {
                $match: {
                    platform: { $ne: null },
                },
            },
            {
                $group: {
                    _id: '$platform',
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    platform: '$_id',
                    count: 1,
                    _id: 0,
                },
            },
        ]);

        res.status(200).json({ bestSellingProductsByMonth, orderCountByPlatform });
    } catch (error) {
        next(error);
    }
};




