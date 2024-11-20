import * as dotenv from 'dotenv';
import cors from "cors";
import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser'; // Import body-parser
import { corsOptions } from './consts';
import { checkElasticsearchConnection, checkPythonConnection, connectToDB } from './affigen_helpers';
import { CustomError } from './interfaces';
import cookieParser from 'cookie-parser'; // Import cookie-parser
import authRoutes from "./routes/auth"
import usersRoute from "./routes/users"
import clientsRoute from "./routes/clients"
import roleRoutes from "./routes/role"
import blogRoutes from "./routes/affigen_blog"
import orderRoutes from "./routes/order"
import contactRoutes from "./routes/contact"
import mailRoutes from "./routes/mail"
import affigenProductsRoutes from "./routes/affigen_product"
import gentaurProductsRoutes from "./routes/gentaur_product"
import affigenFiltersRoutes from "./routes/affigen_filter"
import affigenBrandsRoutes from "./routes/brand"
import affigenElasticRoutes from "./routes/affigen_elastic"
import gentaurElasticRoutes from "./routes/gentaur_elastic"
import gentaurSuppliersRoutes from "./routes/supplier"
import gentaurCategoriesRoutes from "./routes/gentaur_category";

import AffigenProduct from './models/Affigen_Product';
import GentaurProduct from './models/Gentaur_Product';
import Count from './models/Count';
// Load environment variables from .env file
import gentaurFiltersRoutes from "./routes/gentaur_filter"
import oldeAuth from "./routes/oldeAuth";
import gentaur_hot_product from "./routes/gentaur_hot_product";
import affigen_hot_product from "./routes/affigen_hot_product";
dotenv.config();

// Get the port from environment variables or default to 8800
const port: number = 8800;

// Create an Express application
const app = express();


app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '1024mb' }))
app.use(bodyParser.urlencoded({ limit: '1024mb', extended: true }))
app.use(cookieParser())

connectToDB()
// checkElasticsearchConnection()
// checkPythonConnection()


// const updateCounts = async () => {
//     try {
//         const affigens = await AffigenProduct.countDocuments()
//         const gentaurs = await GentaurProduct.countDocuments()
//         console.log('affigens ', affigens)
//         console.log('gentaurs ', gentaurs)
//         const count = new Count({name: 'products', affigen: affigens, gentaur: gentaurs})
//         await count.save()
//     } catch (error) {
//         console.log(error)
//     }
// }

// updateCounts()



app.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.json('Hello, TypeScript + Node + Express');
});

app.use('/auth', authRoutes)
app.use('/users', usersRoute)
// THE ENDPINT FOR CLIENTS SO THAT ORDERS WILL WORK
app.use('/clients', clientsRoute)


// app.use('/auth' , oldeAuth)
app.use('/roles', roleRoutes)
app.use('/orders', orderRoutes)
app.use('/affigen/blogs', blogRoutes)
app.use('/affigen/products', affigenProductsRoutes)
app.use('/affigen/hot-products', affigen_hot_product)
app.use('/affigen/filters', affigenFiltersRoutes)
app.use('/affigen/search', affigenElasticRoutes)
app.use('/affigen/brands', affigenBrandsRoutes)
app.use('/affigen/contacts', contactRoutes)
app.use('/affigen/mails', mailRoutes)
app.use('/gentaur/products', gentaurProductsRoutes)
app.use('/gentaur/search', gentaurElasticRoutes)
app.use('/gentaur/suppliers', gentaurSuppliersRoutes)
// app.use('/gentaur/orders', orderRoutes)
app.use('/gentaur/contacts', contactRoutes)
app.use('/gentaur/hot-products', gentaur_hot_product)
app.use('/gentaur/filters', gentaurFiltersRoutes)
app.use('/gentaur/categories', gentaurCategoriesRoutes);



// error handler
app.use((err: CustomError, req: Request, res: Response, next: NextFunction): any => {
    const status = err.status || 500
    const message = err.message || "Something went wrong!";
    const JSON = res.status(Number(status)).json({
        success: false,
        sattus: Number(status),
        message: String(message)
    })
    return JSON
});

// Start the server
app.listen(port, () => {
    // Log a message when the server is successfully running
    console.log(`Server is running on http://localhost:${port}`);
});
