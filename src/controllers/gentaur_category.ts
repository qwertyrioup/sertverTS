import { NextFunction, Request, Response } from "express";
import Category, { IGentaurCategory } from "../models/Gentaur_Category";
import {
  ELASTIC_BATCH_SCROLL_QUERY_FILTERS, ELASTIC_SCROLL_QUERY_FILTERS,
  GENERAL_ELSTIC_FILTERS_QUERY, getCategoriesWithLogic,
  getFiltersWithLogic,
  searchClient
} from "../gentaur_helpers";
import { createError } from "../error";
import AffigenProduct from "../models/Gentaur_Product";
import { Transform } from "stream";
import GentaurFilter from "../models/Gentaur_Filter";
import GentaurProduct from "../models/Gentaur_Product";
import GentaurCategory from "../models/Gentaur_Category";

export const getAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories: IGentaurCategory[] | [] = await Category.find();
    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
};

export const getAllCategoriesElastic = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await searchClient.search({
      index: "gentaur_products",
      body: {
        size: 0,
        aggs: {
          all_categories: {
            nested: {
              path: "categories",
            },
            aggs: {
              category_names: {
                terms: {
                  field: "categories.category",
                  size: 500,
                },
                aggs: {
                  category_values: {
                    terms: {
                      field: "categories.value",
                      size: 500,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // @ts-ignore
    const data = result.aggregations.all_categories.category_names.buckets.map(
      (obj: any) => {
        const sortedCategoryValues = obj.category_values.buckets.sort(
          (a: any, b: any) => a.key.localeCompare(b.key)
        );
        return { ...obj, category_values: sortedCategoryValues };
      }
    );

    const sortOrder = [
      "Application Area",
      "Brand",
      "Host",
      "Isotype",
      "Label",
      "Pathogen",
      "Species",
      "Tag",
      "Technique",
      "Tissue",
      "Virus",
    ];

    const sortedData = data.sort((a: any, b: any) => {
      return sortOrder.indexOf(a.key) - sortOrder.indexOf(b.key);
    });

    res.status(200).json(sortedData);
  } catch (error) {
    next(error);
  }
};

export const insertParentCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const data = req.body;
  try {
    const newCategory = new Category(data);
    const savedCategory = await newCategory.save();
    res.status(200).json(savedCategory);
  } catch (error) {
    next(error);
  }
};

export const insertSubCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;

  try {
    const existingCategory = await Category.findOne({
      _id: id,
      "counts.category_value": req.body.category_value,
    });

    if (!existingCategory) {
      const category = await Category.findByIdAndUpdate(
        id,
        {
          $addToSet: { counts: { ...req.body } },
        },
        { new: true }
      );

      res.status(200).json(category);
    } else {
      next(createError(500, "already exists"));
    }
  } catch (error) {
    next(error);
  }
};

export const deleteParentCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;

  try {
    const result = await Category.findByIdAndDelete(id);
    if (result) {
      res.status(200).json("category deleted successfully");
    } else {
      next(createError(404, "category not found"));
    }
  } catch (error) {
    next(error);
  }
};

export const updateParentCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;

  try {
    const result = await Category.findByIdAndUpdate(
      id,
      {
        $set: { ...req.body },
      },
      { new: true }
    );
    if (result) {
      res.status(200).json("category updated successfully");
    } else {
      next(createError(404, "category not found"));
    }
  } catch (error) {
    next(error);
  }
};

export const updateSubCategoryName = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id, subId } = req.params;
  const { category_value } = req.body;

  try {
    const result = await Category.findOneAndUpdate(
      { _id: id, "counts._id": subId },
      { $set: { "counts.$.category_value": category_value } },
      { new: true }
    );

    if (result) {
      res
        .status(200)
        .json({ message: "Sub-category updated successfully", data: result });
    } else {
      next(createError(404, "Sub-category not found"));
    }
  } catch (error) {
    next(error);
  }
};

export const deleteSubCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const parentId = req.params.parentId;
  const subCategoryId = req.params.subCategoryId;

  try {
    const category = await Category.findByIdAndUpdate(
      parentId,
      {
        $pull: { counts: { _id: subCategoryId } },
      },
      { new: true }
    );

    if (!category) {
      next(createError(404, "category not found"));
    } else {
      res.status(200).json(category);
    }
  } catch (error) {
    next(error);
  }
};

export const updateCategoryChildLogic = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let finalMessage = "Category Updated!\nAffected Docs: 0";
    const { categoryId, subCategoryId, additionalData, operator, queryData } =
      req.body;

    if (!(operator && queryData.length > 0)) {
      return next(createError(400, "Category logic not provided"));
    }

    const category = await GentaurCategory.findOne(
      { _id: categoryId, "counts._id": subCategoryId },
      { _id: 1, category: 1, "counts.$": 1 }
    );

    if (!category || !category.counts || category.counts.length === 0) {
      return next(createError(404, "Sub-category not found"));
    }

    // Directly update the specific sub-filter within counts array
    const updateResult = await GentaurCategory.updateOne(
      { _id: categoryId, "counts._id": subCategoryId },
      {
        $set: {
          "counts.$.logic": {
            operator,
            queryData,
            additionalData,
          },
        },
      }
    );

    //   @ts-ignore
    if (updateResult.nModified === 0) {
      return next(createError(500, "Failed to update Gentaur Category logic"));
    }

    // Remove the filter from all matching products
    // const subFilter = filter.counts[0]; // Existing sub-filter data
    const result = await GentaurProduct.updateMany(
      {
        "categories.categoryId": categoryId,
      },
      {
        $pull: { categories: { categoryId: categoryId, subId: subCategoryId } },
        $set: { sync: false },
      }
    );

    // Build the ElasticSearch query
    const elasticSearchQuery = GENERAL_ELSTIC_FILTERS_QUERY(
      operator,
      queryData,
      additionalData
    );
    const catAffigenFields = await ELASTIC_SCROLL_QUERY_FILTERS(
      elasticSearchQuery
    );

    if (catAffigenFields.length > 0) {
      // Add the filter back to the matching products
      const updateResult = await GentaurProduct.updateMany(
        {
          id: { $in: catAffigenFields },
        },
        {
          $addToSet: { categories: { categoryId: categoryId, subId: subCategoryId } },
          $set: { sync: false },
        }
      );

      finalMessage = `Category Updated!\nAffected Docs: ${updateResult.modifiedCount}`;
    }

    res.status(200).json(finalMessage);
  } catch (err) {
    next(err);
  }
};

export const getCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      next(createError(404, "Category found"));
    }

    if (category && category.counts && category.counts.length > 0) {
      category.counts.reverse();
    }

    res.status(200).json(category);
  } catch (err) {
    next(err);
  }
};
export const getSubCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const parentId = req.params.parentId;
  const subCategoryId = req.params.subCategoryId;

  try {
    const category = await GentaurCategory.findOne(
      { _id: parentId, "counts._id": subCategoryId },
      { _id: 1, category: 1, "counts.$": 1 } // Project the parent _id and the specific sub-filter in 'counts' array
    );

    if (!category || !category.counts || category.counts.length === 0) {
      next(createError(404, "Sub-filter not found"));
    } else {
      res.status(200).json({
        _id: category._id, // Return parent _id
        category: category.category, // Return the filter field
        subCategory: category.counts[0], // Return the matched sub-filter
      });
    }
  } catch (error) {
    next(error);
  }
};

export const applyLogicForAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Flush headers to establish SSE

    // Function to send SSE messages
    const sendSSE = (message: string) => {
      res.write(`data: ${message}\n\n`);
    };

    sendSSE('Started category processing!');

    const categories = await getCategoriesWithLogic();

    if (categories.length > 0) {
      for (const document of categories) {
        const categoryParent = document.category;
        const parentId = document._id;

        for (const count of document.counts) {
          const subCategoryId = count._id;
          const { queryData, additionalData } = count.logic;
          const elasticSearchQuery = GENERAL_ELSTIC_FILTERS_QUERY(
            'All',
            queryData,
            additionalData
          );

          const catAffigenFields = await ELASTIC_BATCH_SCROLL_QUERY_FILTERS(
            elasticSearchQuery
          );

          const MESSAGE = `${categoryParent} : ${count.category_value} has ${catAffigenFields.length} products`;
          if (catAffigenFields.length > 0) {
            await GentaurProduct.updateMany(
              {
                id: { $in: catAffigenFields },
              },
              {
                $addToSet: {
                  "categories": { "categoryId": parentId, "subId": subCategoryId }
                },
                $set: { sync: false },
              }
            );

            console.log(MESSAGE);
            sendSSE(MESSAGE); // Send SSE message
          }
        }
      }
    }

    sendSSE('Categories Done!');
    res.end(); // Close SSE connection
  } catch (error) {
    console.error(error);
    const sendSSE = (message: string) => {
      res.write(`data: ${message}\n\n`);
    };
    sendSSE('An error occurred during category processing.');
    res.end();
  }
};

