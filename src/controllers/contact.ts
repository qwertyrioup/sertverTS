import { Request, Response, NextFunction } from "express";
import Contact from "../models/Contact";
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
    subject: `New Message From ${req.body.firstname} ${req.body.lastname}`,
    html:
      '<table border="1" cellpadding="1" cellspacing="1" style="width:500px"><tbody><tr><td>First Name</td><td>Last Name</td><td>Email</td><td>Phone</td><td>Message</td></tr><tr><td>' +
      req.body.firstname +
      "</td><td>" +
      req.body.lastname +
      "</td><td>" +
      req.body.email +
      "</td><td>" +
      req.body.phone +
      "</td><td>" +
      req.body.message +
      "</td></tr></tbody></table>",
  };

  try {
    const newContact = new Contact({
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      phone: req.body.phone,
      message: req.body.message,
    });

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
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).send(contacts);
  } catch (err) {
    next(err);
  }
};

export const getContact = async (req: Request, res: Response, next: NextFunction) => {
  const id = req.params.id;
  try {
    const contact = await Contact.findById(id);
    res.status(200).send(contact);
  } catch (err) {
    next(err);
  }
};
