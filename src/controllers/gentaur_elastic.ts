import { NextFunction, Request, Response } from "express";
import {
  ELASTIC_SCROLL_QUERY_FILTERS,
  ELASTIC_SIMILARS_RESPONSE,
  ELASTIC_WITH_CUSTOM_FILTERS_PAGINATION_QUERY,
  ELASTIC_WITH_CUSTOM_FILTERS_PAGINATION_RESPONSE,
  ELASTIC_WITH_FILTERS_PAGINATION_RESPONSE,
  GENERAL_ELSTIC_FILTERS_QUERY,
  generateSimplesGentaurELASTIC,
  generateVariantsGentaurELASTIC,
} from "../gentaur_helpers";
import { createError } from "../error";
import { json } from "body-parser";
import GentaurProduct from "../models/Gentaur_Product";
import GentaurFilter from "../models/Gentaur_Filter";

export const SEARCH_WITH_CUSTOM_FILTERS = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const data = req.body;
  // console.log("Request data:", data);
  const { page } = req.query;
  // @ts-ignore
  const pageNumber = parseInt(page, 10) || 1;
  const limit = 100;

  const { operator, queryData, additionalData } = data;

  const isDataPresent =
    operator && operator.length > 0 && queryData && queryData.length;

  try {
    if (!isDataPresent) {
      next(createError(400, "missing request body"));
      // console.log(true)
    }

    const elasticSearchQuery = ELASTIC_WITH_CUSTOM_FILTERS_PAGINATION_QUERY(
      operator,
      queryData,
      additionalData,
      pageNumber,
      limit
    );

    const searchResponse =
      await ELASTIC_WITH_CUSTOM_FILTERS_PAGINATION_RESPONSE(elasticSearchQuery);
    // @ts-ignore
    const { products, ...others } = searchResponse;

    let PRODUCTS;
    if (products) {
      const variations = products.filter(
        (product: any) =>
          product.variations !== null && product.variations !== undefined
      );
      const noVariations = products.filter(
        (product: any) =>
          product.variations === null || product.variations === undefined
      );

      let generatedNoVariations = [];
      let generatedVariations = [];

      if (noVariations.length > 0) {
        generatedNoVariations = generateSimplesGentaurELASTIC(noVariations);
      }
      if (variations.length > 0) {
        generatedVariations = generateVariantsGentaurELASTIC(variations);
      }

      PRODUCTS = [...generatedNoVariations, ...generatedVariations];
    }

    res.status(200).json({ ...others, products: PRODUCTS });
  } catch (error) {
    //   console.error(error);
    next(error);
  }
};

export const SEARCH_WITH_FILTERS = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const data = req.body ? req.body.data || [] : [];
  const { page, searchParam } = req.query;
  // @ts-ignore
  const pageNumber = parseInt(page, 10) || 1;
  const limit = 100;

  let mustConditions = [];

  if (searchParam) {
    mustConditions.push({
        query_string: {
          query: searchParam,
          fields: ["name", "catalog_number"], // Search specifically in 'name' and 'catalog_number'
        },
      });
  }

  data.forEach((item: any) => {
    mustConditions.push({
      nested: {
        path: "filters",
        query: {
          bool: {
            must: [
              { match: { "filters.filter": item.filter } },
              { match: { "filters.value": item.value } },
            ],
          },
        },
      },
    });
  });

  const requestBody = {
    query: {
      bool: {
        must: mustConditions,
      },
    },
    aggs: {
      filters_count: {
        nested: {
          path: "filters",
        },
        aggs: {
          filterNames: {
            terms: {
              field: "filters.filter",
              size: 5000,
            },
            aggs: {
              filterValues: {
                terms: {
                  field: "filters.value",
                  size: 5000,
                },
              },
            },
          },
        },
      },
    },
    size: limit,
    from: (pageNumber - 1) * limit,
  };

  try {
    const searchResponse = await ELASTIC_WITH_FILTERS_PAGINATION_RESPONSE(
      requestBody
    );
    // @ts-ignore
    const { products, ...others } = searchResponse;

    let PRODUCTS;
    if (products) {
      const variations = products.filter(
        (product: any) =>
          product.variations !== null && product.variations !== undefined
      );
      const noVariations = products.filter(
        (product: any) =>
          product.variations === null || product.variations === undefined
      );

      let generatedNoVariations = [];
      let generatedVariations = [];

      if (noVariations.length > 0) {
        generatedNoVariations = generateSimplesGentaurELASTIC(noVariations);
      }
      if (variations.length > 0) {
        generatedVariations = generateVariantsGentaurELASTIC(variations);
      }

      PRODUCTS = [...generatedNoVariations, ...generatedVariations];
    }

    res.status(200).json({ ...others, products: PRODUCTS });
  } catch (error) {
    //   console.error('Failed to execute search query:', JSON.stringify(requestBody));
    //   console.error('Elasticsearch error:', error.message);
    //   res.status(500).json({ error: "Internal Server Error", details: error.message });
    next(error);
  }
};
export const SIMILARS = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { searchParam } = req.query;
  // @ts-ignore

  const requestBody = {
    query: {
      query_string: {
        query: searchParam,
      },
    },
    size: 100,
  };

  try {
    const searchResponse = await ELASTIC_SIMILARS_RESPONSE(requestBody);
    // @ts-ignore
    const { products, ...others } = searchResponse;
    // console.log(products)
    let PRODUCTS;
    if (products) {
      const variations = products.filter(
        (product: any) =>
          product.variations !== null && product.variations !== undefined
      );
      const noVariations = products.filter(
        (product: any) =>
          product.variations === null || product.variations === undefined
      );

      let generatedNoVariations = [];
      let generatedVariations = [];

      if (noVariations.length > 0) {
        generatedNoVariations = generateSimplesGentaurELASTIC(noVariations);
      }
      if (variations.length > 0) {
        generatedVariations = generateVariantsGentaurELASTIC(variations);
      }

      PRODUCTS = [...generatedNoVariations, ...generatedVariations];
    }

    res.status(200).json({ ...others, products: PRODUCTS });
  } catch (error) {
    //   console.error('Failed to execute search query:', JSON.stringify(requestBody));
    //   console.error('Elasticsearch error:', error.message);
    //   res.status(500).json({ error: "Internal Server Error", details: error.message });
    next(error);
  }
};

export const SEARCH_WITH_FILTERS_FIXED_CLUSTER = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const data = req.body ? req.body.data || [] : [];
  const { id: clusterParam } = req.params; // Get 'affiextract' from URL

  const { page, searchParam } = req.query;
  // @ts-ignore
  const pageNumber = parseInt(page, 10) || 1;
  const limit = 100;

  let mustConditions: any[] = [
    {
      match_phrase: { cluster_name: clusterParam }, // Ensure clusterParam is correctly set to "affielisa" or another valid brand
    },
  ];

  //   @ts-ignore
  if (searchParam && searchParam.length > 0) {
    mustConditions.push({
      bool: {
        should: [
          { match_phrase: { name: searchParam } },
          { match_phrase: { catalog_number: searchParam } },
        ],
        minimum_should_match: 1, // At least one of these fields must match
      },
    });
  }

  if (data && data.length > 0) {
    const filtredData = data.filter(
      (item: any) => item.filter !== "cluster_name"
    );
    filtredData.forEach((item: any) => {
      mustConditions.push({
        nested: {
          path: "filters",
          query: {
            bool: {
              must: [
                { match: { "filters.filter": item.filter } },
                { match: { "filters.value": item.value } },
              ],
            },
          },
        },
      });
    });
  }

  const requestBody = {
    query: {
      bool: {
        must: mustConditions,
      },
    },
    aggs: {
      filters_count: {
        nested: {
          path: "filters",
        },
        aggs: {
          filterNames: {
            terms: {
              field: "filters.filter",
              size: 5000,
            },
            aggs: {
              filterValues: {
                terms: {
                  field: "filters.value",
                  size: 5000,
                },
              },
            },
          },
        },
      },
    },
    size: limit,
    from: (pageNumber - 1) * limit,
  };

  try {
    const searchResponse = await ELASTIC_WITH_FILTERS_PAGINATION_RESPONSE(
      requestBody
    );
    // @ts-ignore
    const { products, ...others } = searchResponse;

    let PRODUCTS;
    if (products) {
      const variations = products.filter(
        (product: any) =>
          product.variations !== null && product.variations !== undefined
      );
      const noVariations = products.filter(
        (product: any) =>
          product.variations === null || product.variations === undefined
      );

      let generatedNoVariations = [];
      let generatedVariations = [];

      if (noVariations.length > 0) {
        generatedNoVariations = generateSimplesGentaurELASTIC(noVariations);
      }
      if (variations.length > 0) {
        generatedVariations = generateVariantsGentaurELASTIC(variations);
      }

      PRODUCTS = [...generatedNoVariations, ...generatedVariations];
    }

    res.status(200).json({ ...others, products: PRODUCTS });
  } catch (error) {
    //   console.error('Failed to execute search query:', JSON.stringify(requestBody));
    //   console.error('Elasticsearch error:', error.message);
    //   res.status(500).json({ error: "Internal Server Error", details: error.message });
    next(error);
  }
};

export const APPLY_FILTER_AND_CHILDRENS_FOR_ALL_GENTAUR_PRODUCTS = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { operator, queryData, additionalData, filtersArray } = req.body;

      let MESSAGE = "No Docs to Modify";

      // Build ElasticSearch query and fetch fields
      const elasticSearchQuery = GENERAL_ELSTIC_FILTERS_QUERY(
        operator,
        queryData,
        additionalData
      );

      const catGentaurFields = await ELASTIC_SCROLL_QUERY_FILTERS(
        elasticSearchQuery
      );


      if (catGentaurFields.length === 0) {
        res.status(200).json(MESSAGE);
        return;
      }

      const updatedProducts = await GentaurProduct.updateMany(
        { id: { $in: catGentaurFields } },
        {
          $addToSet: { filters: { $each: filtersArray } },
          $set: {sync: false}
        }
      );

      if (updatedProducts.modifiedCount === 0) {
        res.status(200).json(MESSAGE);
        return;
      }

      // Map over filtersArray and create update promises for each filter
    //   @ts-ignore
      const updatePromises = filtersArray.map(({ filterId, subId }) =>
        GentaurFilter.updateOne(
          { _id: filterId, "counts._id": subId },
          {
            $set: {
              "counts.$.logic": {
                operator: operator,
                queryData: queryData,
                additionalData: additionalData,
              },
            },
          }
        )
      );

      const updateResults = await Promise.all(updatePromises);

      // Check if any document was modified in the filter update process
      const anyUpdates = updateResults.some(
        ({ modifiedCount }) => modifiedCount > 0
      );

      if (!anyUpdates) {
        MESSAGE = "No filters were updated.";
      } else {
        MESSAGE = `Filters added for ${catGentaurFields.length} products`;
      }

      res.status(200).json(MESSAGE);
    } catch (error) {
      next(error);
    }
  };
