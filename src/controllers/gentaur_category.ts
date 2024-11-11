import { NextFunction, Request, Response } from "express";
import Category, { IGentaurCategory } from "../models/Gentaur_Category";
import {
  // ELASTIC_BATCH_SCROLL_QUERY_CATEGORIES,
  // ELASTIC_SCROLL_QUERY_CATEGORIES,
  // GENERAL_ELASTIC_CATEGORIES_QUERY,
  // getCategoriesWithLogic,
  searchClient,
} from "../gentaur_helpers";
import { createError } from "../error";
import AffigenProduct from "../models/Gentaur_Product";
import { Transform } from "stream";

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
  const data = req.body.data;
  console.log(data.data);
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
    let response;
    const { categoryId, categoryName, additionalData, operator, queryData } =
      req.body.data;

    const isLogicProvided = operator.length > 0 && queryData.length > 0;

    if (!isLogicProvided) {
      next(createError(400, "Category logic not provided"));
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      next(createError(404, "Category not found"));
    }
    // @ts-ignore
    const CATEGORY = category.category;
    // @ts-ignore
    const categoryValues = category.counts;

    const targetChildIndex = categoryValues.findIndex(
      (item: { category_value: any; }) => item.category_value === categoryName
    );

    if (targetChildIndex === -1) {
      next(createError(404, "Category child not found"));
    }

    categoryValues[targetChildIndex].logic = {
      queryData,
      additionalData,
    };

    await Category.findByIdAndUpdate(
      categoryId,
      { $set: { counts: categoryValues } },
      { new: true }
    );

    await AffigenProduct.updateMany(
      {
        "categories.category": CATEGORY,
        "categories.value": categoryName,
      },
      {
        $pull: {
          categories: { category: CATEGORY, value: categoryName },
        },
        $set: { sync: false },
      }
    );

    // const elasticSearchQuery = GENERAL_ELASTIC_CATEGORIES_QUERY(
    //   operator,
    //   queryData,
    //   additionalData
    // );
    // const catAffigenFields = await ELASTIC_SCROLL_QUERY_CATEGORIES(
    //   elasticSearchQuery
    // );

    // if (catAffigenFields.length > 0) {
    //   const updateResult = await AffigenProduct.updateMany(
    //     {
    //       cat_affigen: { $in: catAffigenFields },
    //     },
    //     {
    //       $push: { categories: { category: CATEGORY, value: categoryName } },
    //       $set: { sync: false },
    //     }
    //   );
    //
    //   response = `Category Updated!\nAffected Docs: ${updateResult.modifiedCount}`;
    // } else {
    //   response = `Category Updated!\nAffected Docs: 0`;
    // }

    res.status(200).json(response);
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
      next(createError(404, "category found"));
    }

    if (category && category.counts && category.counts.length > 0) {
      category.counts.reverse();
    }

    res.status(200).json(category);
  } catch (err) {
    next(err);
  }
};

export const applyLogicForAllCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const jsonStream = new Transform({
    writableObjectMode: true,
    transform(chunk, encoding, callback) {
      // if (this.firstChunkWritten) {
      //   this.push("," + JSON.stringify(chunk));
      // } else {
      //   this.push(JSON.stringify(chunk));
      //   this.firstChunkWritten = true;
      // }
      callback();
    },
    flush(callback) {
      callback();
    },
  });

  jsonStream.pipe(res);
  // try {
  //   const categories = await getCategoriesWithLogic();
  //   categories.forEach((category) => {
  //     jsonStream.write(category);
  //   });
  //   jsonStream.end();
  // } catch (error) {
  //   jsonStream.end();
  //   next(error);
  // }
};
