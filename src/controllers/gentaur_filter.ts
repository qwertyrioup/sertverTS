import { NextFunction, Request, Response } from "express";
import GentaurFilter, { IGentaurFilter } from "../models/Gentaur_Filter";
import {
  ELASTIC_BATCH_SCROLL_QUERY_FILTERS,
  ELASTIC_SCROLL_QUERY_FILTERS,
  GENERAL_ELSTIC_FILTERS_QUERY,
  getFiltersWithLogic,
  searchClient,
} from "../gentaur_helpers";
import { createError } from "../error";
import AffigenProduct from "../models/Gentaur_Product";
import { Transform } from "stream";

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const filters: IGentaurFilter[] | [] = await GentaurFilter.find();
    res.status(200).json(filters);
  } catch (err) {
    next(err);
  }
};

export const getAllFiltersElastic = async (
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
          all_filters: {
            nested: {
              path: "filters",
            },
            aggs: {
              filter_names: {
                terms: {
                  field: "filters.filter",
                  size: 500,
                },
                aggs: {
                  filter_values: {
                    terms: {
                      field: "filters.value",
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

    //   @ts-ignore
    const data = result.aggregations.all_filters.filter_names.buckets.map(
      (obj: any) => {
        // Sort filter_values alphabetically
        const sortedFilterValues = obj.filter_values.buckets.sort(
          (a: any, b: any) => a.key.localeCompare(b.key)
        );
        return { ...obj, filter_values: sortedFilterValues };
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

    // Sort data based on the sortOrder
    const sortedData = data.sort((a: any, b: any) => {
      return sortOrder.indexOf(a.key) - sortOrder.indexOf(b.key);
    });

    res.status(200).json(sortedData);
  } catch (error) {
    //   console.error(error);
    next(error);
  }
};

export const insertParentFilter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const data = req.body; // Data for the new parent filter document
  try {
    const newFilter = new GentaurFilter(data); // Create a new document instance
    const savedFilter = await newFilter.save(); // Save the new document to the database
    res.status(200).json(savedFilter); // Send the saved document back to the client
  } catch (error) {
    next(error); // Handle any errors that occur
  }
};

export const insertSubFilter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;


  try {
    // Check if the filter object already exists
    const existingFilter = await GentaurFilter.findOne({
      _id: id,
      "counts.filter_value": req.body.filter_value,
    });

    if (!existingFilter) {
      // Add new object only if it doesn't exist
      const filter = await GentaurFilter.findByIdAndUpdate(
        id,
        {
          $addToSet: { counts: {...req.body} },
        },
        { new: true }
      );

      res.status(200).json(filter);
    } else {
      next(createError(500, "already exists"));
    }
  } catch (error) {
    next(error);
  }
};

export const deleteParentFilter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id; // ID of the parent filter to delete

  try {
    const result = await GentaurFilter.findByIdAndDelete(id); // Delete the document
    if (result) {
      res.status(200).json("filter deleted successfully");
    } else {
      next(createError(404, "filter not found"));
    }
  } catch (error) {
    next(error);
  }
};

export const updateParentFilter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id; // ID of the parent filter to delete

  try {
    const result = await GentaurFilter.findByIdAndUpdate(
      id,
      {
        $set: { ...req.body },
      },
      { new: true }
    ); // Delete the document
    if (result) {
      res.status(200).json("filter updated successfully");
    } else {
      next(createError(404, "filter not found"));
    }
  } catch (error) {
    next(error);
  }
};



export const updateSubFilterName = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { id, subId } = req.params;
    const { filter_value } = req.body;



    try {
      const result = await GentaurFilter.findOneAndUpdate(
        { _id: id, 'counts._id': subId },
        { $set: { 'counts.$.filter_value': filter_value } },
        { new: true }
      );

      if (result) {
        res.status(200).json({ message: 'Sub-filter updated successfully', data: result });
      } else {
        next(createError(404, 'Sub-filter not found'));
      }
    } catch (error) {
      next(error);
    }
  };

export const deleteSubFilter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const parentId = req.params.parentId;
  const subFilterId = req.params.subFilterId;

  try {
    const filter = await GentaurFilter.findByIdAndUpdate(
      parentId,
      {
        $pull: { counts: { _id: subFilterId } },
      },
      { new: true }
    );

    if (!filter) {
      next(createError(404, "filter not found"));
    } else {
      res.status(200).json(filter);
    }
  } catch (error) {
    next(error);
  }
};

export const updateFilterChildLogic = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let response;
    const { filterId, filterName, additionalData, operator, queryData } =
      req.body.data;

    const isLogicProvided = operator.length > 0 && queryData.length > 0;

    if (!isLogicProvided) {
      next(createError(400, "Filter logic not provided"));
    }

    // Fetch the filter by ID
    const filter = await GentaurFilter.findById(filterId);
    if (!filter) {
      next(createError(404, "Filter not found"));
    }
    //   @ts-ignore
    const FILTER = filter.filter;
    //   @ts-ignore
    const filterValues = filter.counts;

    // Find the target child index
    const targetChildIndex = filterValues.findIndex(
      (item) => item.filter_value === filterName
    );

    if (targetChildIndex === -1) {
      next(createError(404, "Filter child not found"));
    }

    // Update the logic of the target child
    filterValues[targetChildIndex].logic = {
      queryData,
      additionalData,
    };

    // Update the filter document with the modified counts array
    await GentaurFilter.findByIdAndUpdate(
      filterId,
      { $set: { counts: filterValues } },
      { new: true }
    );

    // Remove the filter from all products that match the filter and value
    await AffigenProduct.updateMany(
      {
        "filters.filter": FILTER,
        "filters.value": filterName,
      },
      {
        $pull: {
          filters: { filter: FILTER, value: filterName },
        },
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
      const updateResult = await AffigenProduct.updateMany(
        {
          cat_affigen: { $in: catAffigenFields },
        },
        {
          $push: { filters: { filter: FILTER, value: filterName } },
          $set: { sync: false },
        }
      );

      response = `Filter Updated!\nAffected Docs: ${updateResult.modifiedCount}`;
    } else {
      response = `Filter Updated!\nAffected Docs: 0`;
    }

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const getFilter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Retrieve the filter document by ID
    let filter = await GentaurFilter.findById(req.params.id);

    // Check if the filter exists
    if (!filter) {
      next(createError(404, "filter found"));
    }

    // Reverse the 'counts' array if it exists and has elements
    if (filter && filter.counts && filter.counts.length > 0) {
      filter.counts.reverse();
    }

    // Send the modified filter object as response
    res.status(200).json(filter);
  } catch (err) {
    // Handle any errors that occur during the operation
    next(err);
  }
};

export const applyLogicForAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const jsonStream = new Transform({
    writableObjectMode: true,
    transform(chunk, encoding, callback) {
      // @ts-ignore
      if (this.firstChunkWritten) {
        this.push("," + JSON.stringify(chunk));
      } else {
        this.push(JSON.stringify(chunk));
        //   @ts-ignore
        this.firstChunkWritten = true;
      }
      callback();
    },
    flush(callback) {
      // this.push(']');  // Close JSON array
      callback();
    },
  });

  // jsonStream.push('[');
  jsonStream.pipe(res);
  try {
    const filters = await getFiltersWithLogic();
    //   console.log(JSON.stringify(filters[0]))

    if (filters.length > 0) {
      jsonStream.write("Started!");

      await AffigenProduct.updateMany(
        {},
        { $set: { filters: [], sync: false } }
      );

      for await (const document of filters) {
        const filterParent = document.filter;
        for (const count of document.counts) {
          const { queryData, additionalData } = count.logic;

          const elasticSearchQuery = GENERAL_ELSTIC_FILTERS_QUERY(
            "All",
            queryData,
            additionalData
          );

          const catAffigenFields = await ELASTIC_BATCH_SCROLL_QUERY_FILTERS(
            elasticSearchQuery
          );

          // }
          if (catAffigenFields.length > 0) {
            // Collect all unique filter-value pairs to update in one go
            const filtersToAdd = {
              filter: filterParent,
              value: count.filter_value,
            };

            await AffigenProduct.updateMany(
              {
                cat_affigen: { $in: catAffigenFields },

                filters: {
                  $not: {
                    $elemMatch: {
                      filter: filterParent,
                      value: count.filter_value,
                    },
                  },
                },
              },
              {
                $addToSet: { filters: filtersToAdd },
                $set: { sync: false },
              }
            );

            console.log(
              `${filterParent} - ${count.filter_value} - ${catAffigenFields.length}`
            );
          }
        }
      }
    }
    // jsonStream.write()
    jsonStream.end("Filters Done!");
  } catch (error) {
    console.log(error);
    jsonStream.end();
  }
};
