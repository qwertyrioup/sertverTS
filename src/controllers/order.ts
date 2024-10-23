import Order from "../models/Order";
import { createError } from "../error";
import nodemailer from 'nodemailer';
import { Request, Response, NextFunction } from 'express';

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'affigeninc@gmail.com',
            pass: 'skah tcwy ferm legc' // Consider using environment variables for sensitive data
        }
    });

    let str = "";
    req.body.cart.products.forEach((p: any) => {
        const text = `<tr><td>${p.cat_affigen}</td><td>${p.product_name}</td><td>${p.size}</td><td>${p.qty}</td><td> $${(p.sell_price).toFixed(2)}</td><td> $${(p.sell_price * p.qty).toFixed(2)}</td></tr>`;
        str += text;
    });

    const mailOptions = {
        from: 'affigeninc@gmail.com',
        to: ['affigeninc@gmail.com', 'tunisia@gentaur.com', 'info@affigen.com'],
        subject: `New Order From ${req.body.user_details.address.country}`,
        html: `
            <div style="display: flex; flex-direction: column; height: 100%; flex-wrap: nowrap; justify-content: flex-start; align-items: center; align-content: stretch;">
                <div>
                    <table align="left" border="1" cellpadding="1" cellspacing="1" style="width:345px">
                        <caption>User Details</caption>
                        <tbody>
                            <tr><td>Type</td><td>${req.body.type}</td></tr>
                            <tr><td>Client Name</td><td>${req.body.user_details.name}</td></tr>
                            <tr><td>Country</td><td>${req.body.user_details.address.country}</td></tr>
                            <tr><td>Phone Number</td><td>${req.body.user_details.phone}</td></tr>
                            <tr><td>Address</td><td>${req.body.user_details.address.line1}</td></tr>
                            <tr><td>City</td><td>${req.body.user_details.address.city}</td></tr>
                            <tr><td>Postal Code</td><td>${req.body.user_details.address.postal_code}</td></tr>
                            <tr><td>Comment</td><td>${req.body.comment}</td></tr>
                        </tbody>
                    </table>
                </div>
                <br/>
                <div>
                    <table align="left" border="1" cellpadding="1" cellspacing="1" style="width:345px">
                        <caption>Order Values</caption>
                        <tbody>
                            <tr><td>Total</td><td>$ ${(req.body.cart.total).toFixed(2)}</td></tr>
                            <tr><td>Shipping</td><td>$ ${(req.body.cart.shipping).toFixed(2)}</td></tr>
                            <tr><td>Total With Shipping</td><td>$ ${(req.body.cart.totalWithShipping).toFixed(2)}</td></tr>
                        </tbody>
                    </table>
                </div>
                <br/>
                <div>
                    <table align="left" border="1" cellpadding="1" cellspacing="1" style="width:345px">
                        <caption>Order Details</caption>
                        <tbody>
                            <tr><td>CAT</td><td>Product Name</td><td>Size</td><td>Quantity</td><td>Price</td><td>Total</td></tr>
                            ${str}
                        </tbody>
                    </table>
                </div>
            </div>`
    };

    try {
        const newOrder = new Order({
            user_details: req.body.user_details,
            cart: req.body.cart,
            comment: req.body.comment,
            userId: req.body.userId,
            type: req.body.type
        });

        const savedOrder = await newOrder.save();
        transporter.sendMail(mailOptions, (error) => {
            if (error) {
                console.log(error);
            } else {
                console.log("Email Sent");
            }
        });

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "text/plain");

        const raw = `{
            "domain": "affitechbio.com",
            "secret": "A1ko-au7Yp-QroU-ao3z"
        }`;

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };
        // @ts-ignore
        fetch("http://api-dev.gentaur.online/api/v1.0/auth/login", requestOptions)
            .then(response => response.headers.get("Authorization"))
            .then(authHeader => {
                const formData = new URLSearchParams({
                    'customer[email]': req.body.user_details.email || req.body.user_details.name,
                    'order[ship_country]': req.body.user_details.address.country,
                    'order[note]': '-'
                });

                req.body.cart.products.forEach((product: any, index: number) => {
                    formData.append(`order[items][${index + 1}][name]`, product.product_name);
                    formData.append(`order[items][${index + 1}][supplier][name]`, 'Affigen');
                    formData.append(`order[items][${index + 1}][catalog_number]`, product.cat_affigen);
                    formData.append(`order[items][${index + 1}][price]`, product.sell_price.toString());
                    formData.append(`order[items][${index + 1}][quantity]`, product.qty.toString());
                });

                return fetch('http://api-dev.gentaur.online/api/v1.0/orders/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': authHeader || ''
                    },
                    body: formData.toString()
                });
            })
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.error('Error:', error));

        res.status(200).send(savedOrder);
    } catch (err) {
        next(err);
    }
};

export const getCountOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const count = await Order.countDocuments();
        res.status(200).json(count);
    } catch (err) {
        next(err);
    }
};

export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        if (!orders) return next(createError(404, "orders not found!"));

        const data = orders.map(order => ({
            _id: order._id,
            status: order.status,
            type: order.type,
            seen: order.seen,
            name: order.user_details.name,
            // @ts-ignore
            phone: order.user_details.phone,
            quantity: order.cart.quantity,
            total: order.cart.total,
            shipping: order.cart.shipping,
            totalWithShipping: order.cart.totalWithShipping,
            // @ts-ignore
            line1: order.user_details.address.line1,
            // @ts-ignore

            city: order.user_details.address.city,
            // @ts-ignore
            country: order.user_details.address.country,
            // @ts-ignore

            postal_code: order.user_details.address.postal_code,
        }));

        res.status(200).json(data);
    } catch (err) {
        next(err);
    }
};

export const getOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await Order.findById(req.params.id);
        if (!product) return next(createError(404, "Order not found!"));

        res.status(200).json({
            name: product.user_details.name,
            status: product.status,
            products: product.cart.products
        });
    } catch (err) {
        next(err);
    }
};

export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orders = await Order.find({ userId: req.params.id }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (err) {
        next(err);
    }
};

export const getFullOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await Order.findById(req.params.id);
        if (!product) return next(createError(404, "Order not found!"));
        res.status(200).json(product);
    } catch (err) {
        next(err);
    }
};

export const topOrders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const orders = await Order.find().sort({ "cart.total": -1 }).limit(7);
        res.status(200).json(orders);
    } catch (err) {
        next(err);
    }
};

export const deliverOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await Order.findById(req.params.id);
        if (!product) return next(createError(404, "Order not found!"));

        const updatedProduct = await Order.findByIdAndUpdate(
            req.params.id,
            { $set: { status: "Delivered", seen: true } },
            { new: true }
        );
        res.status(200).json(updatedProduct);
    } catch (err) {
        next(err);
    }
};

export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await Order.findById(req.params.id);
        if (!product) return next(createError(404, "Order not found!"));

        const updatedProduct = await Order.findByIdAndUpdate(
            req.params.id,
            { $set: { status: "Cancelled", seen: true } },
            { new: true }
        );
        res.status(200).json(updatedProduct);
    } catch (err) {
        next(err);
    }
};

export const seeOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const product = await Order.findById(req.params.id);
        if (!product) return next(createError(404, "Order not found!"));

        const updatedProduct = await Order.findByIdAndUpdate(
            req.params.id,
            { $set: { seen: true } },
            { new: true }
        );
        res.status(200).json(updatedProduct);
    } catch (err) {
        next(err);
    }
};
