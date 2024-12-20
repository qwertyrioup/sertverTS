import { NextFunction, Request, Response } from "express";
import * as stringSimilarity from "string-similarity";
import { createError } from "../error";
import {
  checkIfDocumentExistsInELASTIC,
  cleanText,
  deleteGentaurProductFromELASTIC,
  ELASTIC_QUERY_SINGLE_INSERT,
  ELASTIC_SCROLL_QUERY_FILTERS,
  GENERAL_ELSTIC_FILTERS_QUERY,
  generateSimpleGentaur,
  generateSimplesGentaur,
  generateVariantsGentaur,
  getBulkDownloadProductMailOptions,
  getCreateProductMailOptions,
  getDeleteProductMailOptions,
  getEditProductMailOptions,
  getFiltersWithLogic,
  getTransporter,
  PROCESS_VARIATIONS_SINGLE_PRODUCT,
  searchClient,
  uploadFile,
  upsertGentaurProductToELASTIC,
} from "../gentaur_helpers";
import { IBrandCount } from "../interfaces";
import GentaurFilter from "../models/Gentaur_Filter";
import GentaurProduct, { IGentaurProduct } from "../models/Gentaur_Product";
import User, { IUser } from "../models/User";
import moment from "moment";
import { exec } from "child_process";
import { getGentaurProductsCount } from "../utils";
import Supplier from "../models/Supplier";

export const getCountsForAllBrands = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const brandsWithCounts: IBrandCount[] | [] = await GentaurProduct.aggregate(
      [
        {
          $group: {
            _id: { $toLower: "$brand_name" },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            brand: "$_id",
            count: 1,
            _id: 0,
          },
        },
        {
          $sort: { brand: 1 },
        },
      ]
    );

    res.status(200).json(brandsWithCounts);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // @ts-ignore
  const userId = req.user.id;

  const transporter = await getTransporter();
  let fieldsANDvalues: any = {};

  if (req.body) {
    try {
      fieldsANDvalues = JSON.parse(JSON.stringify(req.body));
    } catch (error) {
      next(new Error("Invalid JSON data"));
    }
  }

  if (!fieldsANDvalues.images) {
    fieldsANDvalues.images = [];
  }
  // @ts-ignore
  if (req.files && req.files.length > 0) {
    try {
      // @ts-ignore
      const uploadPromises = req.files.map((f) => uploadFile(f));
      const publicUrls = await Promise.all(uploadPromises);
      fieldsANDvalues.images.push(...publicUrls);
    } catch (error) {
      next(error);
    }
  }

  try {
    const clusters = await GentaurProduct.distinct("cluster_name");
    const { name } = fieldsANDvalues;

    const cleanedProductName = cleanText(name);


    const bestMatch = stringSimilarity.findBestMatch(
        cleanedProductName,
        // @ts-ignore
      clusters
    );

    const cluster_name = bestMatch.bestMatch.target;
    fieldsANDvalues.cluster_name = cluster_name


    const productToSave: IGentaurProduct = new GentaurProduct({...fieldsANDvalues})
    const savedProduct = await productToSave.save()
    if (!savedProduct) {
      next(createError(400, "product not saved"));
    }


    res.status(200).json('Product Inserted')

    //   @ts-ignore
    const ProductRows = Object.entries(savedProduct._doc)
      .map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`)
      .join("");


      const user: IUser | null = await User.findById(userId);

    //   @ts-ignore
      const mailOptions = getCreateProductMailOptions(user, ProductRows);

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email Sent");
        }
      });


  } catch (error) {
    next(error);
  }
};

export const editProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // @ts-ignore
  const userId = req.user.id;
  const transporter = await getTransporter();
  let fieldsANDvalues: any = {};

  // Parsing request body
  if (req.body) {
    try {
      fieldsANDvalues = JSON.parse(JSON.stringify(req.body));
    } catch (error) {
      next(new Error("Invalid JSON data"));
    }
  }
  // @ts-ignore
  fieldsANDvalues.sync = false;
  // @ts-ignore
  fieldsANDvalues.images = fieldsANDvalues.images || [];
  // @ts-ignore
  if (req.files && req.files.length > 0) {
    try {
      // @ts-ignore
      const uploadPromises = req.files.map((file) => uploadFile(file));
      const publicUrls = await Promise.all(uploadPromises);
      // @ts-ignore
      fieldsANDvalues.images.push(...publicUrls);
    } catch (error) {
      next(error);
    }
  }

  // Ensuring that images and others are separated properly
  const { images = [], ...updateFields } = fieldsANDvalues;

  try {
    const product = await GentaurProduct.findOne({id: req.params.id}).lean();

    if (!product) {
      next(createError(404, "product not found"));
    }

    const update = {
      ...updateFields,
      ...(images.length > 0 && { $push: { images: { $each: images } } }),
    };
    //   @ts-ignore
    const updatedProduct = await GentaurProduct.findOneAndUpdate(
      {id: req.params.id},
      {...update},
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedProduct) {
      next(createError(500, "error updating product"));
    }

    res.status(200).json("product updated successfully");
    const user: IUser | null = await User.findById(userId);

    if (user) {
      const newOne = await GentaurProduct.findOne({id: req.params.id}).lean();
      //   @ts-ignore
      const oldProductRows = Object.entries(product)
        .map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`)
        .join("");
      //   @ts-ignore
      const newProductRows = Object.entries(newOne)
        .map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`)
        .join("");

      const mailOptions = getEditProductMailOptions(
        user,
        oldProductRows,
        newProductRows
      );

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email Sent");
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // @ts-ignore
  const userId = req.user.id;
  const transporter = await getTransporter();
  const regex = req.params.id

  try {
    const product = await GentaurProduct.findOne({
      id: regex,
    }).lean();

    if (!product) {
      // If the product is not found in MongoDB, still attempt to delete it from Elasticsearch
      const CAT = String(req.params.id).toUpperCase();

      const existInElastic = await checkIfDocumentExistsInELASTIC(
        "gentaur_products",
        CAT
      );
      if (existInElastic) {
        await deleteGentaurProductFromELASTIC("gentaur_products", CAT);

        next(
          createError(
            404,
            "product not found in MongoDB, but deleted from Elasticsearch if it existed."
          )
        );
      }
    }

    await GentaurProduct.findOneAndDelete({ id: regex });
    const CAT = String(req.params.id).toUpperCase();

    const existInElastic = await checkIfDocumentExistsInELASTIC(
      "gentaur_products",
      CAT
    );
    if (existInElastic) {
      await deleteGentaurProductFromELASTIC("gentaur_products", CAT);
    }

    res.status(200).json("product has been deleted.");
    const user = await User.findById(userId);

    if (user) {
      //  @ts-ignore
      const ProductRows = Object.entries(product)
        .map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`)
        .join("");
      const mailOptions = getDeleteProductMailOptions(user, ProductRows);

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email Sent");
        }
      });
    }
  } catch (err) {
    next(err);
  }
};

export const downloadBackup = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const mongoHost = process.env.mongoHost;
    const mongoPort = process.env.mongoPort;
    const mongoUsername = process.env.mongoUsername;
    const mongoPassword = process.env.mongoPassword;
    const mongoServerPass = process.env.mongoServerPass;
    const authenticationDatabase = process.env.authenticationDatabase;
    const sshUser = process.env.sshUser;
    const databaseName = process.env.databaseName;

    const timestamp = moment().format("DD-MM-YYYY_HH:mm");
    const remoteBackupPath = `/home/db/backups/${timestamp}`;

    // Construct sshpass and mongodump command with verbose logging and host key checking disabled
    const command = `sshpass -p '${mongoServerPass}' ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -vvv ${sshUser}@${mongoHost} mongodump --host ${mongoHost} --port ${mongoPort} --username ${mongoUsername} --password ${mongoPassword} --authenticationDatabase ${authenticationDatabase} --db ${databaseName} --out ${remoteBackupPath}`;

    // Execute the command as a promise

    const execPromise = (cmd: any) => {
      return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`Command execution error: ${error.message}`));
          } else if (stderr && !stderr.includes("debug")) {
            reject(new Error(`Command execution stderr: ${stderr}`));
          } else {
            resolve(stdout);
          }
        });
      });
    };

    await execPromise(command);

    res.status(200).json({ success: true, message: `Backup Created` });
  } catch (err) {
    //   console.error(`Error: ${err.message}`);

    res.status(200).json({ success: false, message: `Backup Failed` });
  }
};


export const getProductsByIds = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // @ts-ignore
  const userId = req.user.id;
  const transporter = await getTransporter();
  const IDS = req.body.ids;

  try {
    const result = await GentaurProduct.find({
      id: { $in: IDS },
    })

    res.status(200).json(result);
    const user = await User.findById(userId);
    if (user) {
      const mailOptions = getBulkDownloadProductMailOptions(user, IDS);
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email Sent");
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product: IGentaurProduct | null = await GentaurProduct.findOne({
      id: req.params.id,
    }).select(
      "-_id id name price shipment cluster_name catalog_number supplier size additional_information description specifications storage_and_shipping notes"
    );

    if (!product) {
      next(createError(404, "product not found!"));
    }

    //@ts-ignore
    let finalProduct = product.toObject();

    if (finalProduct.supplier && finalProduct.supplier.id) {
      const supplier = await Supplier.findOne({ id: finalProduct.supplier.id });
      if (!supplier) {
        next(createError(404, "supplier not found!"));
      }
      if (supplier) {
        // Convert the supplier to a plain object and update finalProduct
        finalProduct.supplier = supplier.toObject();
      }
    }

    const response = generateSimpleGentaur(finalProduct);
    //   if (product && product.variations && product.variations.length > 1) {
    //     // console.log(product.variations)
    //     // const variations = JSON.parse(product.variations.replace(/'/g, '"'))
    //     const variations = PROCESS_VARIATIONS_SINGLE_PRODUCT(product.variations)
    //     // @ts-ignore
    //     const {sell_price, size, ...others} = product._doc

    //     finalProduct = {...others, variations, variant: true}
    //   } else {
    //     // @ts-ignore
    //     const {variations, ...others} = product._doc
    //     finalProduct = {...others, variant: false}
    //   }

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};
export const getProductForDash = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product: IGentaurProduct | null = await GentaurProduct.findOne({
      id: req.params.id,
    })

    if (!product) {
      next(createError(404, "product not found!"));
    }

    //@ts-ignore
    let finalProduct = product.toObject();

    if (finalProduct.supplier && finalProduct.supplier.id) {
      const supplier = await Supplier.findOne({ id: finalProduct.supplier.id });
      if (!supplier) {
        next(createError(404, "supplier not found!"));
      }
      if (supplier) {
        // Convert the supplier to a plain object and update finalProduct
        finalProduct.supplier = supplier.toObject();
      }
    }



    res.status(200).json(finalProduct);
  } catch (err) {
    next(err);
  }
};

//   export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
//     let page: number;
//     const pageQuery = req.query.page;

//     if (typeof pageQuery === "string" && parseInt(pageQuery, 10) >= 1) {
//       page = parseInt(pageQuery, 10);
//     } else {
//       page = 1;
//     }

//     if (page < 1) {
//       return next(createError(400, "Invalid page number, should start with 1"));
//     }
//     const lastId = req.query.lastId ? parseInt(req.query.lastId as string, 10) : null;

//     // if (typeof pageQuery === "string" && parseInt(pageQuery, 10) >= 1) {
//     //   page = parseInt(pageQuery, 10);
//     // } else {
//     //   page = 1;
//     // }

//     // if (page < 1) {
//     //   return next(createError(400, "Invalid page number, should start with 1"));
//     // }

//     // const skip: number = (page - 1) * 100;
//     const limit: number = 100;

//     try {
//     //   const totalProducts = await GentaurProduct.countDocuments();
//       const totalProducts = (await getGentaurProductsCount()).count;
//       if (totalProducts && totalProducts === 0) {
//         next(createError(404, 'error fetching counts'))
//       }
//       const totalPages = Math.ceil(totalProducts / limit);

//       let query = {};
//     if (lastId) {
//       query = { id: { $gt: lastId } };
//     }
//       // Fetch products greater than the last `id` seen, sorted by `id`
//       const products = await GentaurProduct.find(query)
//         .sort({ id: 1 })
//         .select(
//           "-_id id name shipment catalog_number price size variations supplier cluster_name url"
//         )
//         .limit(limit);

//         const populatedProducts = await Promise.all(
//             products.map(async (product) => {
//                 // Convert Mongoose document to plain object
//                 let finalProduct = product.toObject();

//                 if (finalProduct.supplier && finalProduct.supplier.id) {
//                     const supplier = await Supplier.findOne({ id: finalProduct.supplier.id });
//                     if (supplier) {
//                         // Convert the supplier to a plain object and update finalProduct
//                         finalProduct.supplier = supplier.toObject();
//                     }
//                 }
//                 return finalProduct;
//             })
//         );

//       // Determine the new last seen id for the next page
//       const newLastSeenId = populatedProducts.length > 0 ? populatedProducts[products.length - 1].id : null;

//       // Processing product variations directly from the query results
//       const generatedNoVariations = generateSimplesGentaur(populatedProducts.filter(product => !product.variations));
//     //   const generatedVariations = generateVariantsGentaur(populatedProducts.filter(product => product.variations));

//       // Combining the results for final output
//       const PRODUCTS = [...generatedNoVariations];

//       const data = {
//         count: totalProducts,
//         pages: totalPages,
//         page: page,
//         lastId: newLastSeenId,
//         products: PRODUCTS,
//       };

//       res.status(200).json(data);
//     } catch (err) {
//       next(err);
//     }
//   };
export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let page: number;
  const pageQuery = req.query.page;

  // Validate and set the page number
  if (typeof pageQuery === "string" && parseInt(pageQuery, 10) >= 1) {
    page = parseInt(pageQuery, 10);
  } else {
    page = 1;
  }

  if (page < 1) {
    return next(createError(400, "Invalid page number, should start with 1"));
  }

  const limit: number = 100;

  try {
    const totalProducts = (await getGentaurProductsCount()).count;
    // if (!totalProducts || totalProducts === 0) {
    //   return next(createError(404, "No products found"));
    // }
    const totalPages = Math.ceil(totalProducts / limit);

    // Calculate the range for the current page
    const skip = (page - 1) * limit;

    // Fetch products starting from the calculated skip, sorted by `id`
    const products = await GentaurProduct.find()
      .sort({ id: 1 }) // Ensure sorting by `id`
      .skip(skip) // Efficiently skip to the required page
      .limit(limit)
      .select(
        "-_id id name shipment catalog_number price size variations supplier cluster_name url"
      )




      // Step 2: Process each product to include only the relevant sub-filter based on subId


    // Manually populate supplier data
    const populatedProducts = await Promise.all(
        products.map(async (product) => {
        // Convert Mongoose document to plain object
        // @ts-ignore
        let finalProduct = product.toObject()

        if (finalProduct.supplier && finalProduct.supplier.id) {
          const supplier = await Supplier.findOne({
            id: finalProduct.supplier.id,
          });
          if (supplier) {
            // Convert the supplier to a plain object and update finalProduct
            finalProduct.supplier = supplier.toObject();
          }
        }
        return finalProduct;
      })
    );

    // Determine the new last seen id for the next page
    //   const newLastSeenId = populatedProducts.length > 0 ? populatedProducts[products.length - 1].id : null;

    // Processing product variations directly from the query results
    const generatedNoVariations = generateSimplesGentaur(
        // @ts-ignore
      populatedProducts.filter((product) => !product.variations)
    );
    //   const generatedVariations = generateVariantsGentaur(populatedProducts.filter(product => product.variations));

    // Combining the results for final output
    const PRODUCTS = [...generatedNoVariations];

    const data = {
      count: totalProducts,
      pages: totalPages,
      page: page,
      // lastId: newLastSeenId,
      products: PRODUCTS,
    };

    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
};





export const getClusters = async (req: Request, res: Response, next: NextFunction) => {
    let clusters
    try {

      let response = await GentaurProduct.distinct('cluster_name')
    //   @ts-ignore
      clusters = response.filter((item) => item.length > 0)





      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  };
