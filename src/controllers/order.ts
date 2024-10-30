import { NextFunction, Request, Response } from 'express';
import { getOrderMailOptions, getTransporter } from "../affigen_helpers";
import Order from "../models/Order";

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
    const transporter = await getTransporter()



    try {
        const newOrder = new Order({
            ...req.body
        });



        const savedOrder = await newOrder.save();
        console.log(savedOrder)
        res.status(200).json(savedOrder);

        const mailOptions = getOrderMailOptions(req.body.user_details, req.body.cart, req.body.comment)
        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.log(error);
            } else {
                console.log("Email Sent");
            }
        });
    } catch (err) {
        next(err);
    }
};
