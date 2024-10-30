import { NextFunction, Request, Response } from "express";
import { searchClient } from "../affigen_helpers";
import Brand from "../models/Brand";



  export const getAllBrands_Sorted = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const brands = await Brand.find().sort({ createdAt: -1 }).select('brand_name')
      res.status(200).send(brands);
    } catch (err) {
      next(err);
    }
  };

  export const createNewBrand = async (req: Request, res: Response, next: NextFunction) => {
    var objForUpdate = {};
    // @ts-ignore
    objForUpdate.userId = req.body.userId;
    // @ts-ignore
    if (req.body.brand_name) objForUpdate.brand_name = req.body.brand_name;
    // @ts-ignore
    if (req.body.image) objForUpdate.image = req.body.image;
    const newBrand = new Brand(objForUpdate);
    try {
      const savedBrand = await newBrand.save();
      res.status(200).send(savedBrand);
    } catch (err) {
      next(err);
    }
  };

  export const deleteBrand = async (req: Request, res: Response, next: NextFunction) => {
    try {
       await Brand.findOneAndDelete({brand_name: req.params.id})
      res.status(200).json('success deleted');
    } catch (error) {
      next(error);
    }
  };

  export const brandsPreview = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const brands = await Brand.find({ in_home: true }).sort({ updatedAt: -1 });
      const searchPromises = brands.map(brand => {
        const brandName = brand.brand_name;
        return searchClient.search({
          index: "affigen_products",
          body: {
            query: {
                bool: {
                    must: [
                        {
                            multi_match: {
                                query: brandName,
                                type: "best_fields",
                            }
                        },
                        {
                            range: {
                                "sell_price": {
                                    gt: 0
                                }
                            }
                        },

                    ],
                    must_not: [
                        {
                            exists: {
                                field: "variations" // Exclude if the `variations` field exists
                            }
                        }
                    ]
                }
            },
            // @ts-ignore
            sort: [{ _score: "desc" }],
            size: 10,
        },
        }).then(searchResponse => ({
        //   _id: brand._id,
          brand_name: brand.brand_name,
        //   in_home: brand.in_home,
          products: searchResponse.hits.hits.map((hit) =>  {

            // @ts-ignore
            const {cat_affigen, product_name, size, sell_price, cluster_name, brand_name, ...others} = hit._source
            return {
                cat_affigen,
                product_name,
                size,
                sell_price,
                cluster_name,
                brand_name
            }
          }),
        })).catch(() => ({
        //   _id: brand._id,
          brand_name: brand.brand_name,
        //   in_home: brand.in_home,
          products: [],
        }));
      });


      const values = await Promise.all(searchPromises);

      res.status(200).send(values);
    } catch (err) {
      console.error(err);
      next(err);
    }
  };
