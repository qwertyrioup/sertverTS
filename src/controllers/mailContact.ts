import { Request, Response, NextFunction } from "express";
import MailContact from "../models/MailContact";
import nodemailer from "nodemailer";

export const create = async (req: Request, res: Response, next: NextFunction) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'affigeninc@gmail.com', // Replace with your Gmail address
            pass: 'skah tcwy ferm legc', // Replace with your Gmail password
        },
    });

    const mailOptions = {
        from: "affigeninc@gmail.com",
        to: ["majri@gentaur.com", "tunisia@gentaur.com", "info@affigen.com"],
        subject: `New Subscription From ${req.body.mail}`,
        html: `<p>${req.body.mail} has subscribed to the newsletter!</p>`,
    };

    try {
        const newContact = new MailContact({ mail: req.body.mail });
        const savedContact = await newContact.save();

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log("Email Sent");
            }
        });

        res.status(200).send(savedContact);
    } catch (err) {
        next(err);
    }
};

export const getall = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const contacts = await MailContact.find().sort({ createdAt: -1 });
        res.status(200).send(contacts);
    } catch (err) {
        next(err);
    }
};