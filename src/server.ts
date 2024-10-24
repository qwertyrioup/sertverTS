import * as dotenv from 'dotenv';
import cors from "cors";
import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser'; // Import body-parser
import { corsOptions } from './consts';
import { checkElasticsearchConnection, checkPythonConnection, connectToDB } from './helpers';
import { CustomError } from './interfaces';
import cookieParser from 'cookie-parser'; // Import cookie-parser
import authRoutes from "./routes/auth"
import roleRoutes from "./routes/role"
import blogRoutes from "./routes/blog"
import affigenProductsRoutes from "./routes/affigen_product"
import affigenFiltersRoutes from "./routes/affigen_filter"
// Load environment variables from .env file
dotenv.config();

// Get the port from environment variables or default to 8800
const port: number = Number(process.env.PORT) || 8800;

// Create an Express application
const app = express();


app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '512mb' }))
app.use(bodyParser.urlencoded({ limit: '512mb', extended: true }))
app.use(cookieParser())

connectToDB()
checkElasticsearchConnection()
// checkPythonConnection()



app.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.json('Hello, TypeScript + Node + Express');
});

app.use('/auth', authRoutes)
app.use('/roles', roleRoutes)
app.use('/affigen/blogs', blogRoutes)
app.use('/affigen/products', affigenProductsRoutes)
app.use('/affigen/filters', affigenFiltersRoutes)


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
