import { NextFunction, Request, Response } from "express";
import * as stringSimilarity from "string-similarity";
import { createError } from "../error";
import { checkIfDocumentExistsInELASTIC, cleanText, deleteAffigenProductFromELASTIC, ELASTIC_QUERY_SINGLE_INSERT, ELASTIC_SCROLL_QUERY_FILTERS, GENERAL_ELSTIC_FILTERS_QUERY, generateSimplesAffigen, generateVariantsAffigen, getBulkDownloadProductMailOptions, getCreateProductMailOptions, getDeleteProductMailOptions, getEditProductMailOptions, getFiltersWithLogic, getTransporter, PROCESS_VARIATIONS_SINGLE_PRODUCT, searchClient, uploadFile, upsertAffigenProductToELASTIC } from "../helpers";
import { IBrandCount } from "../interfaces";
import AffigenFilter from "../models/Affigen_Filter";
import AffigenProduct, { IAffigenProduct } from "../models/Affigen_Product";
import User, { IUser } from "../models/User";
import moment from "moment";
import { exec } from "child_process";


export const getCountsForAllBrands = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const brandsWithCounts: IBrandCount[] | [] = await AffigenProduct.aggregate([
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
        ]);

        res.status(200).json(brandsWithCounts);
    } catch (error) {
        next(error);
    }
};



export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user.id;
    const transporter = await getTransporter()
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
        const clusters = await AffigenProduct.find({}).distinct("cluster_name");
        const { product_name } = fieldsANDvalues;

        const cleanedProductName = cleanText(product_name);

        const bestMatch = stringSimilarity.findBestMatch(
            cleanedProductName,
            clusters
        );

        const cluster_name = bestMatch.bestMatch.target;

        const savedProduct: IAffigenProduct = await AffigenProduct.findOneAndUpdate(
            { cat_affigen: fieldsANDvalues.cat_affigen }, // Use `cat_affigen` as the unique identifier
            { $set: { ...fieldsANDvalues, cluster_name, sync: true } }, // Data to update or insert
            { upsert: true, new: true, setDefaultsOnInsert: true } // Upsert options
        );

        if (!savedProduct) {
            next(createError(400, "product not saved"));
        }



        //   @ts-ignore
        const { _id, ...others } = savedProduct._doc
        const Inserted_To_Elastic = await upsertAffigenProductToELASTIC('affigen_products', others)
        if (Inserted_To_Elastic) {

            const filters = await getFiltersWithLogic()

            if (filters.length > 0) {
                await AffigenProduct.findOneAndUpdate(
                    { cat_affigen: savedProduct.cat_affigen },
                    {
                        $set: {
                            filters: [],
                            sync: true // Ensure 'filters' is the correct array field
                        },
                    },
                    { new: true }
                );

                for await (const document of filters) {
                    const filterParent = document.filter;
                    for await (const count of document.counts) {
                        const { queryData, additionalData } =
                            count.logic;
                        const { filter_value } = count

                        const elasticSearchQuery = ELASTIC_QUERY_SINGLE_INSERT(
                            "All",
                            queryData,
                            additionalData,
                            savedProduct.cat_affigen
                        );

                        const searchResponse = await searchClient.search({
                            index: "affigen_products",
                            body: elasticSearchQuery,
                        });
                        //   @ts-ignore
                        const match = searchResponse.hits.total.value;
                        if (match === 1) {

                            await AffigenProduct.findOneAndUpdate(
                                { cat_affigen: savedProduct.cat_affigen },
                                {
                                    $addToSet: {
                                        filters: { filter: filterParent, value: filter_value }, // Ensure 'filters' is the correct array field
                                    },
                                    $set: { sync: false },
                                },
                                { new: true }
                            );






                        }
                    }
                }

            }



        }

        res.status(200).json("product inserted successfully");
        const finalProduct = await AffigenProduct.findOne({ cat_affigen: fieldsANDvalues.cat_affigen })
            //   @ts-ignore
            const ProductRows = Object.entries(finalProduct._doc)
            .map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`)
            .join("");

            const user: IUser | null = await User.findById(userId);
            if (user) {
                const mailOptions = getCreateProductMailOptions(user, ProductRows)

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



export const editProduct = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user.id;
    const transporter = await getTransporter()
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
    const regex = new RegExp(`^${req.params.id}$`, "i"); // Case-insensitive regex

    try {

        const product = await AffigenProduct.findById(req.params.id).lean();

        if (!product) {
            next(createError(404, "product not found"))
        }

        const update = {
            ...updateFields,
            ...(images.length > 0 && { $push: { images: { $each: images } } }),
        };
        //   @ts-ignore
        const updatedProduct = await AffigenProduct.findByIdAndUpdate(req.params.id, update, {
            new: true,
            runValidators: true,
        });

        if (!updatedProduct) {
            next(createError(500, 'error updating product'));
        }


        res.status(200).json('product updated successfully');
        const user: IUser | null = await User.findById(userId);


        if (user) {
            const newOne = await AffigenProduct.findById(req.params.id).lean();
            //   @ts-ignore
            const oldProductRows = Object.entries(product)
                .map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`)
                .join("");
            //   @ts-ignore
            const newProductRows = Object.entries(newOne)
                .map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`)
                .join("");

            const mailOptions = getEditProductMailOptions(user, oldProductRows, newProductRows)

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




export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {

    // @ts-ignore
    const userId = req.user.id;
    const transporter = await getTransporter()
    const regex = new RegExp(`^${req.params.id}$`, "i"); // Case-insensitive regex



    try {

        const product = await AffigenProduct.findOne({ cat_affigen: regex }).lean();

        if (!product) {
            // If the product is not found in MongoDB, still attempt to delete it from Elasticsearch
            const CAT = String(req.params.id).toUpperCase()

            const existInElastic = await checkIfDocumentExistsInELASTIC('affigen_products', CAT)
            if (existInElastic) {
                await deleteAffigenProductFromELASTIC('affigen_products', CAT)


                next(
                    createError(
                        404,
                        "product not found in MongoDB, but deleted from Elasticsearch if it existed."
                    )
                );
            }



        }

        await AffigenProduct.findOneAndDelete({ cat_affigen: regex });
        const CAT = String(req.params.id).toUpperCase()

        const existInElastic = await checkIfDocumentExistsInELASTIC('affigen_products', CAT)
        if (existInElastic) {
            await deleteAffigenProductFromELASTIC('affigen_products', CAT)

        }






        res.status(200).json("product has been deleted.");
        const user = await User.findById(userId);

        if (user) {

            //  @ts-ignore
            const ProductRows = Object.entries(product)
                .map(([key, value]) => `<tr><td>${key}</td><td>${value}</td></tr>`)
                .join("");
            const mailOptions = getDeleteProductMailOptions(user, ProductRows)

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




  export const downloadBackup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mongoHost = process.env.mongoHost
      const mongoPort = process.env.mongoPort
      const mongoUsername = process.env.mongoUsername
      const mongoPassword = process.env.mongoPassword
      const mongoServerPass = process.env.mongoServerPass
      const authenticationDatabase = process.env.authenticationDatabase
      const sshUser = process.env.sshUser
      const databaseName = process.env.databaseName

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



      res
        .status(200)
        .json({ success: true, message: `Backup Created`});
    } catch (err) {
    //   console.error(`Error: ${err.message}`);

      res
        .status(200)
        .json({ success: false, message: `Backup Failed` });
    }
  };



export const APPLY_FILTER_AND_CHILDRENS_FOR_ALL_AFFIGEN_PRODUCTS = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { operator, queryData, additionalData, filter_name, filter_childrens } = req.body;

        // Build ElasticSearch query and fetch fields
        const elasticSearchQuery = GENERAL_ELSTIC_FILTERS_QUERY(operator, queryData, additionalData);
        const catAffigenFields = await ELASTIC_SCROLL_QUERY_FILTERS(elasticSearchQuery);

        if (catAffigenFields.length === 0) {
            res.status(200).json(`Filter Updated!\nAffected Docs: 0`);
        }

        // Prepare filter objects to be added
        const filterObjects = filter_childrens.map((child: any) => ({
            filter: filter_name,
            value: child,
        }));

        // Update the filters in the database
        const updateResult = await AffigenProduct.updateMany(
            { cat_affigen: { $in: catAffigenFields } },
            [
                {
                    $set: {
                        filters: {
                            $concatArrays: [
                                "$filters",
                                {
                                    $filter: {
                                        input: filterObjects,
                                        as: "newFilter",
                                        cond: {
                                            $not: {
                                                $in: [
                                                    "$$newFilter",
                                                    {
                                                        $map: {
                                                            input: "$filters",
                                                            as: "existingFilter",
                                                            in: {
                                                                filter: "$$existingFilter.filter",
                                                                value: "$$existingFilter.value",
                                                            },
                                                        },
                                                    },
                                                ],
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
                { $set: { sync: false } },
            ]
        );

        if (updateResult.modifiedCount > 0) {
            const filter = await AffigenFilter.findOne({ filter: filter_name });

            if (filter) {
                // Update the target filter's logic for each child value
                const updatedCounts = filter.counts.map((item) => {
                    if (filter_childrens.includes(item.filter_value)) {
                        return { ...item, logic: { operator, queryData, additionalData } };
                    }
                    return item;
                });

                // Save updated counts back to the filter document
                await AffigenFilter.updateOne(
                    { filter: filter_name },
                    { $set: { counts: updatedCounts } }
                );
            } else {
                console.warn(`Filter ${filter_name} not found.`);
            }
        }

        res.status(200).json(`Filter Updated!\nAffected Docs: ${catAffigenFields.length}`);
    } catch (error) {
        next(error);
    }
};




export const getProductsByIds = async (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    const userId = req.user.id;
    const transporter = await getTransporter()
    const IDS = req.body.ids

    try {
        const result = await AffigenProduct.find({
            cat_affigen: { $in: IDS },
        }).select(
            "-_id cat_affigen product_name size buy_price sell_price variations supplier internal_note"
        );




        res.status(200).json(result);
        const user = await User.findById(userId);
        if (user) {
            const mailOptions = getBulkDownloadProductMailOptions(user, IDS)
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



  export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
    let finalProduct;
    const regex = new RegExp(`^${req.params.cat_affigen}$`, "i")
    try {
      const product: IAffigenProduct | null = await AffigenProduct.findOne({ cat_affigen: regex }).select('-_id cat_affiegn product_name brand_name size sell_price variations cluster_name supplier meta_title meta_description meta_keywords ');

      if (product && product.variations && product.variations.length > 1) {
        console.log(product.variations)
        // const variations = JSON.parse(product.variations.replace(/'/g, '"'))
        const variations = PROCESS_VARIATIONS_SINGLE_PRODUCT(product.variations)
        // @ts-ignore
        const {sell_price, size, ...others} = product._doc

        finalProduct = {...others, variations, variant: true}
      } else {
        // @ts-ignore
        const {variations, ...others} = product._doc
        finalProduct = {...others, variant: false}
      }


      res.status(200).json(finalProduct);
    } catch (err) {
      next(err);
    }
  };




  export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
    let page: number;
    const pageQuery = req.query.page;

    if (typeof pageQuery === "string" && parseInt(pageQuery, 10) >= 1) {
      page = parseInt(pageQuery, 10);
    } else {
      page = 1;
    }

    if (page < 1) {
      return next(createError(400, "Invalid page number, should start with 1"));
    }

    const skip: number = (page - 1) * 100;
    const limit: number = 100;

    try {
      const totalProducts = await AffigenProduct.countDocuments();
      const totalPages = Math.ceil(totalProducts / limit);

      const products = await AffigenProduct.find()
        .select(
          "product_name cat_affigen buy_price sell_price size variations cluster_name url"
        )
        .skip(skip)
        .limit(limit);

      // Corrected filters
      const variations = products.filter(
        (product) => product.variations !== null && product.variations !== undefined
      );
      const noVariations = products.filter(
        (product) => product.variations === null || product.variations === undefined
      );

      let generatedNoVariations = [];
      let generatedVariations = [];

      if (noVariations.length > 0) {
        generatedNoVariations = generateSimplesAffigen(noVariations);
      }
      if (variations.length > 0) {
        generatedVariations = generateVariantsAffigen(variations);
      }

      const PRODUCTS = [...generatedNoVariations, ...generatedVariations];

      const data = {
        count: totalProducts,
        pages: totalPages,
        page: page,
        products: PRODUCTS,
      };

      res.status(200).json(data);
    } catch (err) {
      next(err);
    }
  };
