import { NextFunction, Request, Response } from 'express';
import Order from '../models/Order';
import { getOrderMailOptions, getTransporter } from "../affigen_helpers";

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
    const transporter = await getTransporter()


    try {
        const newOrder = new Order({
            ...req.body
        });


        const savedOrder = await newOrder.save();
        // console.log(savedOrder)
        res.status(200).json(savedOrder);

        const mailOptions = getOrderMailOptions(req.body.user_details, req.body.cart, req.body.comment)
        transporter.sendMail(mailOptions, (error: any) => {
            if (error) {
                console.log(error);
            } else {
                console.log("Email Sent");
            }
        });
    } catch (err) {
        next(err);
    }
}

export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orders = await Order.find();
        res.status(200).json(orders);
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
        );

        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found." });
        }

        // Return the updated order as response
        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ message: "Server error. Please try again later." });
    }
};
export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json(order);
    } catch (err) {
        next(err);
    }
};

export const getOrdersByPlatform = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { platform } = req.params;
        const orders = await Order.find({ plateform: platform });
        res.status(200).json(orders);
    } catch (err) {
        next(err);
    }
};

export const updateOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json(updatedOrder);
    } catch (err) {
        next(err);
    }
};

export const deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const deletedOrder = await Order.findByIdAndDelete(req.params.id);
        if (!deletedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (err) {
        next(err);
    }
};
