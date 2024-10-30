import { NextFunction, Request, Response } from "express";
import { getSubscriptionMailOptions, getTransporter } from "../affigen_helpers";
import Mail from "../models/Mail";

export const create = async (req: Request, res: Response, next: NextFunction) => {
    const transporter = await getTransporter()



    try {
        const newContact = new Mail({...req.body });
        const savedContact = await newContact.save();


        res.status(200).json(savedContact);
        const mailOptions = getSubscriptionMailOptions(req.body.mail)
        transporter.sendMail(mailOptions, (error, info) => {
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


