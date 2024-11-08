import { NextFunction, Request, Response } from "express";
import {
    ELASTIC_SIMILARS_RESPONSE,
  ELASTIC_WITH_CUSTOM_FILTERS_PAGINATION_QUERY,
  ELASTIC_WITH_CUSTOM_FILTERS_PAGINATION_RESPONSE,
  ELASTIC_WITH_FILTERS_PAGINATION_RESPONSE,
  generateSimplesGentaurELASTIC,
  generateVariantsGentaurELASTIC,
} from "../gentaur_helpers";
import { createError } from "../error";

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
    "query": {
      "query_string": {
        "query": searchParam
      }
    },
    "size": 100
  }



  try {
    const searchResponse = await ELASTIC_SIMILARS_RESPONSE(
      requestBody
    );
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
