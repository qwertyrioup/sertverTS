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
import GentaurProduct from "../models/Gentaur_Product";

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
          $addToSet: { counts: { ...req.body } },
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
      { _id: id, "counts._id": subId },
      { $set: { "counts.$.filter_value": filter_value } },
      { new: true }
    );

    if (result) {
      res
        .status(200)
        .json({ message: "Sub-filter updated successfully", data: result });
    } else {
      next(createError(404, "Sub-filter not found"));
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
export const getSubFilter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const parentId = req.params.parentId;
  const subFilterId = req.params.subFilterId;

  try {
    const filter = await GentaurFilter.findOne(
      { _id: parentId, "counts._id": subFilterId },
      { _id: 1, filter: 1, "counts.$": 1 } // Project the parent _id and the specific sub-filter in 'counts' array
    );

    if (!filter || !filter.counts || filter.counts.length === 0) {
      next(createError(404, "Sub-filter not found"));
    } else {
      res.status(200).json({
        _id: filter._id, // Return parent _id
        filter: filter.filter, // Return the filter field
        subFilter: filter.counts[0], // Return the matched sub-filter
      });
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
    let finalMessage = "Filter added for 0 Docs";
    const { filterId, subFilterId, additionalData, operator, queryData } =
      req.body;

    if (!(operator && queryData.length > 0)) {
      return next(createError(400, "Filter logic not provided"));
    }

    const filter = await GentaurFilter.findOne(
      { _id: filterId, "counts._id": subFilterId },
      { _id: 1, filter: 1, "counts.$": 1 }
    );



    if (!filter || !filter.counts || filter.counts.length === 0) {
      return next(createError(404, "Sub-filter not found"));
    }

    // Directly update the specific sub-filter within counts array
    const updateResult = await GentaurFilter.findOneAndUpdate(
      { _id: filterId, "counts._id": subFilterId },
      {
        $set: {
          "counts.$.logic": {
            operator,
            queryData,
            additionalData,
          },
        },
      },
      {new: true}
    );

    // console.log(JSON.stringify(updateResult?.counts.find(({filter_value}) => filter_value === 'Dog')))

    //   @ts-ignore
    if (updateResult.nModified === 0) {
      return next(createError(500, "Failed to update filter logic"));
    }

    // Remove the filter from all matching products
    // const subFilter = filter.counts[0]; // Existing sub-filter data
    const result = await GentaurProduct.updateMany(
      {
        "filters.filterId": filterId,
      },
      {
        $pull: { filters: { filterId: filterId, subId: subFilterId } },
        $set: { sync: false },
      }
    );


    // Build the ElasticSearch query
    const elasticSearchQuery = GENERAL_ELSTIC_FILTERS_QUERY(
        operator,
        queryData,
        additionalData
    );
    console.log(JSON.stringify(elasticSearchQuery))
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
          $addToSet: { filters: { filterId: filterId, subId: subFilterId } },
          $set: { sync: false },
        }
      );

      finalMessage = `Filter added for ${updateResult.modifiedCount} Docs`;
    }

    res.status(200).json(finalMessage);
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
    try {
      // Set headers for SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders(); // Flush headers to establish SSE

      // Function to send SSE messages
      const sendSSE = (message: string) => {
        res.write(`data: ${message}\n\n`);
      };

      sendSSE("Started!");

      const filters = await getFiltersWithLogic();

      if (filters.length > 0) {
        for await (const document of filters) {
          const filterParent = document.filter;
          const parentId = document._id;

          for (const count of document.counts) {
            const subFilterId = count._id;
            const { queryData, additionalData } = count.logic;

            // Pull (remove) the specific filter combination from products that contain it
            await GentaurProduct.updateMany(
              { "filters.filterId": parentId, "filters.subId": subFilterId },
              { $pull: { filters: { filterId: parentId, subId: subFilterId } }, $set: {sync: false} }
            );

            // Log the number of products from which filters were removed
            // const total = await GentaurProduct.find({ "filters.filterId": parentId, "filters.subId": subFilterId }).count();
            // console.log(`Total products found for filter removal: ${total}`);

            // Perform Elasticsearch query to get products that match the new filter criteria
            const elasticSearchQuery = GENERAL_ELSTIC_FILTERS_QUERY("All", queryData, additionalData);
            const catAffigenFields = await ELASTIC_BATCH_SCROLL_QUERY_FILTERS(elasticSearchQuery);

            const MESSAGE = `${filterParent} : ${count.filter_value} has ${catAffigenFields.length} products`;

            if (catAffigenFields.length > 0) {

              // Add the new filter combination to relevant products
              await GentaurProduct.updateMany(
                { id: { $in: catAffigenFields } },
                {
                  $addToSet: { filters: { filterId: parentId, subId: subFilterId } },
                  $set: { sync: false },
                }
              );

              sendSSE(MESSAGE); // Send SSE message
            }
          }
        }
      }

      sendSSE("Filters Done!");
      res.end(); // Close SSE connection
    } catch (error) {
      console.error(error);
      const sendSSE = (message: string) => {
        res.write(`data: ${message}\n\n`);
      };
      sendSSE("An error occurred.");
      res.end();
    }
  };
export const removeLogic = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {



      const {parent, sub} = req.params




      const updatedFilter = await GentaurFilter.findOneAndUpdate(
        { _id: parent, 'counts._id': sub }, // Filter criteria
        { $unset: { 'counts.$.logic': "" } }, // Update action
        { new: true } // Return the updated document
      ).exec();

      // Check if the document was found and updated
      if (!updatedFilter) {
        res.status(404).json({ message: 'No matching document or counts element found.' });
      }

      const response = await GentaurProduct.updateMany(
        { "filters.filterId": parent, "filters.subId": sub },
        { $pull: { filters: { filterId: parent, subId: sub } }, $set: {sync: false} }
      );
      // Function to send SSE messages

      res.status(200).json(`Logic removed from ${response.modifiedCount} products`)

    } catch (error) {
        next(error);

    }
  };
