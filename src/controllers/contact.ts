import { NextFunction, Request, Response } from "express";
import { getContactMailOptions, getTransporter } from "../affigen_helpers";
import Contact from "../models/Contact";

export const create = async (req: Request, res: Response, next: NextFunction) => {
  const transporter = await getTransporter()



  try {
    const newContact = new Contact({
      ...req.body
    });

    const savedContact = await newContact.save();

    res.status(200).json(savedContact);
    const {plateform, ...others} = req.body
    const mailOptions = getContactMailOptions(others, plateform)
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

