import { Client } from "@elastic/elasticsearch";
import { Storage } from "@google-cloud/storage";
import mongoose from "mongoose";
import { NextFunction } from "express"
import * as dotenv from 'dotenv';
import multer from "multer";
import { format } from "util";
import { createError } from "./error";
import nodemailer from "nodemailer";
import { IUser } from "./models/User";
import { IGentaurProduct } from "./models/Gentaur_Product";
import GentaurFilter from "./models/Gentaur_Filter";


dotenv.config();


export const connectToDB = async () => {
    mongoose
        .connect(String(process.env.MONGO_DB_CONNECTION_STRING))
        .then(() => console.log("Connected successfully to MONGODB"))
        .catch((err) => console.error("Connection to MongoDB failed", err.message));
};


export const storage = new Storage({
    projectId: "affigen-ui",
    keyFilename: String(process.env.KeyFilename),
})

export const bucket = storage.bucket("images-upload-affigen-admin");

export const Multer = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 25 * 1024 * 1024,
    },
});

export const uploadFile = (f: any): Promise<string> => {
    return new Promise((resolve, reject) => {
        const { originalname, buffer } = f;
        const filename = Date.now() + originalname;

        const blob = bucket.file(filename);

        const blobStream = blob.createWriteStream({
            resumable: false,
        });

        blobStream.on("error", (err) => {
            reject(err);
        });

        blobStream.on("finish", () => {
            const publicUrl: string = format(
                `https://storage.googleapis.com/${bucket.name}/${blob.name}`
            );
            resolve(publicUrl);
        });

        blobStream.end(buffer);
    });
};

export const parseJSON = (data: any, next: NextFunction): any | void => {
    try {
        return JSON.parse(JSON.stringify(data));
    } catch (error) {
        next(createError(400, "Invalid JSON data"));
        return;
    }
};

export const searchClient = new Client({
    node: String(process.env.ELASTICSEARCH_HOST),  // Pass the environment variable to the Client
});

export const checkElasticsearchConnection = async () => {
    let isConnected = false;
    while (!isConnected) {
        try {
            await searchClient.cluster.health({});
            console.log("Connected successfully to Elasticsearch");
            isConnected = true;
        } catch (error: any) {
            console.log(
                "Connection to Elasticsearch failed, retrying...",
                error.message
            );
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
};

export const checkPythonConnection = async () => {
    let isConnected = false;
    while (!isConnected) {
        try {
            const response = await fetch(String(process.env.CLUSTERING_HOST));
            console.log("Connected successfully to Python Server");
            if (response && response.ok) isConnected = true;
        } catch (error: any) {
            console.log("Connection to Python failed, retrying...", error.message);
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
};

export const getTransporter = async () => {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: String(process.env.NODEMAILER_USER),
            pass: String(process.env.NODEMAILER_PASS),
        },
    });
}

export function cleanText(inputString: string) {
    let cleanedString = inputString.replace(/\([^)]*\)/g, " ");
    cleanedString = cleanedString.replace(/\b(?:I[VX]|V?I{0,3})\b/g, " ");
    cleanedString = cleanedString.replace(/\s\d+\s/g, " ");
    cleanedString = cleanedString.replace(/\s\w\s/g, " ");
    cleanedString = cleanedString.replace(/[^a-zA-Z0-9\- ]/g, " ");
    const cleanedText = cleanedString
        .split(" ")
        .filter((word) => word.length >= 2)
        .join(" ");
    return cleanedText.split(" ").slice(1).join(" ");
}

export const getCreateProductMailOptions = (user: IUser, ProductRows: string) => {

    const mailOptions = {
        from: String(process.env.MAIL_SENDER),
        to: String(process.env.MAIL_RECEIVERS).split(" "),

        subject: `New Product Created by ${user.email}`,
        html: `
      <div style="display: flex; flex-direction: column; height: 100%; flex-wrap: nowrap; justify-content: flex-start; align-items: center; align-content: stretch;">
        <div>
          <table align="left" border="1" cellpadding="1" cellspacing="1" style="width:345px">
            <caption>User Details</caption>
            <tbody>
              <tr><td>First Name</td><td>${user?.firstname}</td></tr>
              <tr><td>Last Name</td><td>${user?.lastname}</td></tr>
              <tr><td>Email</td><td>${user?.email}</td></tr>
              <tr><td>Display Name</td><td>${user?.displayName}</td></tr>
            </tbody>
          </table>
        </div>
        <br/>
        <div>
          <table align="left" border="1" cellpadding="1" cellspacing="1" style="width:345px">
            <caption>Old Product</caption>
            <tbody>
                ${ProductRows}
            </tbody>
          </table>
        </div>
      </div>`,
    };

    return mailOptions


}

export const getDeleteProductMailOptions = (user: IUser, ProductRows: string) => {



    const mailOptions = {
        from: String(process.env.MAIL_SENDER),
        to: String(process.env.MAIL_RECEIVERS).split(" "),
        subject: `Product Deleted by ${user.email}`,
        html: `
        <div style="display: flex; flex-direction: column; height: 100%; flex-wrap: nowrap; justify-content: flex-start; align-items: center; align-content: stretch;">
          <div>
            <table align="left" border="1" cellpadding="1" cellspacing="1" style="width:345px">
              <caption>User Details</caption>
              <tbody>
                <tr><td>First Name</td><td>${user?.firstname}</td></tr>
                <tr><td>Last Name</td><td>${user?.lastname}</td></tr>
                <tr><td>Email</td><td>${user?.email}</td></tr>
                <tr><td>Display Name</td><td>${user?.displayName}</td></tr>
              </tbody>
            </table>
          </div>
          <br/>
          <div>
            <table align="left" border="1" cellpadding="1" cellspacing="1" style="width:345px">
              <caption>Deleted Product</caption>
              <tbody>
                ${ProductRows}
              </tbody>
            </table>
          </div>
        </div>`,
    };

    return mailOptions


}
export const getEditProductMailOptions = (user: IUser, oldProductRows: string, newProductRows: string) => {

    const mailOptions = {
        from: String(process.env.MAIL_SENDER),
        to: String(process.env.MAIL_RECEIVERS).split(" "),
        subject: `Product Updated by ${user.email}`,
        html: `
        <div style="display: flex; flex-direction: column; height: 100%; flex-wrap: nowrap; justify-content: flex-start; align-items: center; align-content: stretch;">
          <div>
            <table align="left" border="1" cellpadding="1" cellspacing="1" style="width:345px">
              <caption>User Details</caption>
              <tbody>
                <tr><td>First Name</td><td>${user?.firstname}</td></tr>
                <tr><td>Last Name</td><td>${user?.lastname}</td></tr>
                <tr><td>Email</td><td>${user?.email}</td></tr>
                <tr><td>Display Name</td><td>${user?.displayName}</td></tr>
              </tbody>
            </table>
          </div>
          <br/>
          <div>
            <table align="left" border="1" cellpadding="1" cellspacing="1" style="width:345px">
              <caption>Old Product</caption>
              <tbody>
                  ${oldProductRows}
              </tbody>
            </table>
          </div>
          <div>
            <table align="left" border="1" cellpadding="1" cellspacing="1" style="width:345px">
              <caption>New Product</caption>
              <tbody>
                  ${newProductRows}
              </tbody>
            </table>
          </div>
        </div>`,
    };

    return mailOptions


}
export const getBulkDownloadProductMailOptions = (user: IUser, IDS: any) => {

    const mailOptions = {
        from: String(process.env.MAIL_SENDER),
        to: String(process.env.MAIL_RECEIVERS).split(" "),
        subject: `New Data Exported by ${user.email}`,
        html: `
            <div style="display: flex; flex-direction: column; height: 100%; flex-wrap: nowrap; justify-content: flex-start; align-items: center; align-content: stretch;">
              <div>
                <table align="left" border="1" cellpadding="1" cellspacing="1" style="width:345px">
                  <caption>User Details</caption>
                  <tbody>
                    <tr><td>First Name</td><td>${user?.firstname}</td></tr>
                    <tr><td>Last Name</td><td>${user?.lastname}</td></tr>
                    <tr><td>Email</td><td>${user?.email}</td></tr>
                    <tr><td>Display Name</td><td>${user?.displayName}</td></tr>
                  </tbody>
                </table>
              </div>
              <br/>
              <div>
                <table align="left" border="1" cellpadding="1" cellspacing="1" style="width:345px">
                  <caption>Exported Products</caption>
                  <tbody>
                    ${IDS
                .map((item: any) => `<tr><td>${item}</td></tr>`)
                .join("")}
                  </tbody>
                </table>
              </div>
            </div>`,
    };

    return mailOptions


}

export function ELASTIC_QUERY_SINGLE_INSERT(
    operator: string,
    queryData: any,
    additionalData: any,
    catGentaurValue: string
) {
    const mustClauses: any = [];
    const shouldClauses: any = [];
    const mustNotClauses: any = [];
    const filterClauses: any = [];

    const processValue = (value: any, field = "product_name") => {
        if (value.includes("&")) {
            const values = value.split("&").map((v: any) => v.trim());
            return {
                bool: {
                    must: values.map((val: any) => ({ match_phrase: { [field]: val } })),
                },
            };
        } else if (value.includes("/")) {
            const values = value.split("/").map((v: any) => v.trim());
            return {
                bool: {
                    should: values.map((val: any) => ({ match_phrase: { [field]: val } })),
                    minimum_should_match: 1,
                },
            };
        } else {
            return { match_phrase: { [field]: value } };
        }
    };

    // Process queryData
    queryData.forEach((item: any) => {
        if (item.option === "inc") {
            const clause = processValue(item.value);
            if (operator === "All") {
                mustClauses.push(clause);
            } else {
                shouldClauses.push(clause);
            }
        } else if (item.option === "exc") {
            mustNotClauses.push(processValue(item.value));
        }
    });

    // Process additionalData for conditional logic
    if (additionalData && additionalData.length > 0) {
        additionalData.forEach((condition: any) => {
            const ifClause = processValue(condition.ifValue);
            const thenClause = processValue(condition.thenValue);

            let ifCondition;
            if (condition.ifOption === "inc") {
                ifCondition = ifClause;
            } else if (condition.ifOption === "exc") {
                ifCondition = { bool: { must_not: [ifClause] } };
            }

            let thenCondition;
            if (condition.thenOption === "inc") {
                thenCondition = thenClause;
            } else if (condition.thenOption === "exc") {
                thenCondition = { bool: { must_not: [thenClause] } };
            }

            // "If A then B" is equivalent to "NOT A OR B"
            const conditionalClause = {
                bool: {
                    should: [
                        {
                            bool: {
                                must_not: [ifCondition],
                            },
                        },
                        thenCondition,
                    ],
                    minimum_should_match: 1,
                },
            };

            filterClauses.push(conditionalClause);
        });
    }

    // Ensure the 'catalog_number' field matches the provided value
    if (catGentaurValue) {
        mustClauses.push({ match_phrase: { catalog_number: catGentaurValue } });
    }

    const query = {
        query: {
            bool: {
                must: mustClauses,
                should: operator === "Any" ? shouldClauses : [],
                must_not: mustNotClauses,
                // Only include the filter if filterClauses is not empty
                ...(filterClauses.length > 0 && { filter: filterClauses }),
            },
        },
        size: 10000,
    };

    // If using 'should' clauses without 'must', ensure at least one 'should' clause matches
    if (operator === "Any" && shouldClauses.length > 0) {
        // @ts-ignore
        query.query.bool.minimum_should_match = 1;
    }

    return query;
}

export const generateSimplesGentaur = (products: IGentaurProduct[]): any => {
    // @ts-ignore
    return products.map((_doc) => {
        let finalPrice
        const {variations, catalog_number, supplier, price, shipment, ...others} = _doc
        const buy = Number(price.buy.amount) || null
        const dry_ice = Boolean(shipment.dry_ice) || false
        const shipping_cost = Number(supplier.shipping_cost) || 200
        const shipping_cost_dry_ice = Number(supplier.shipping_cost_dry_ice) || 400
        const discount = Number(supplier.discount) || 1
        const flat_rate = Number(supplier.flat_rate)
        const bank_fee = Number(supplier.bank_fee) || 0
        const margin = Number(supplier.margin) || 1.6
        const invoice_surcharges = Number(supplier.invoice_surcharges) || 0
        const valid_shipping_cost = shipping_cost === 0 ? 200 : shipping_cost
        const valid_shipping_cost_dry_ice = shipping_cost_dry_ice === 0 ? 400 : shipping_cost_dry_ice
        const valid_discount = (discount === 0) || (discount > 1)  ? 1 : discount
        const valid_margin = (margin === 0) || (margin < 1) ? 1.6 : margin
        const supplierId = supplier.id

        const finalCat = supplierId + (catalog_number.startsWith('-') ? catalog_number : '-' + catalog_number);

        if (!buy) {
            finalPrice = null
        } else {
            if (buy < 100) {
                if (dry_ice) {
                    finalPrice = flat_rate + bank_fee + valid_shipping_cost_dry_ice + invoice_surcharges
                } else {
                    finalPrice = flat_rate + bank_fee + valid_shipping_cost + invoice_surcharges

                }
            } else if (buy >= 100) {
                if (dry_ice) {
                    finalPrice = (buy*valid_discount*valid_margin) + valid_shipping_cost_dry_ice + bank_fee + invoice_surcharges
                } else {
                    finalPrice = (buy*valid_discount*valid_margin) + valid_shipping_cost + bank_fee + invoice_surcharges

                }

            }
        }



        if (finalPrice) {
            finalPrice = Number(finalPrice.toFixed(2))
        }

        // const sell_price = price && price.sell && price.sell.amount ? Number(parseFloat(price.sell.amount).toFixed(2)) : 0.00
        // const supplierId = supplier && supplier.id ? Number(supplier.id) : null
        return {...others, catalog_number: finalCat, sell_price: finalPrice, variant: false}

    });
};
export const generateSimpleGentaur = (product: IGentaurProduct): any => {
    // console.log(product)
    // @ts-ignore
        let finalPrice
        const {variations, catalog_number, supplier, price, shipment, ...others} = product
        const buy = Number(price.buy.amount) || null
        const dry_ice = Boolean(shipment.dry_ice) || false
        const shipping_cost = Number(supplier.shipping_cost) || 200
        const shipping_cost_dry_ice = Number(supplier.shipping_cost_dry_ice) || 400
        const discount = Number(supplier.discount) || 1
        const flat_rate = Number(supplier.flat_rate)
        const bank_fee = Number(supplier.bank_fee) || 0
        const margin = Number(supplier.margin) || 1.6
        const invoice_surcharges = Number(supplier.invoice_surcharges) || 0
        const valid_shipping_cost = shipping_cost === 0 ? 200 : shipping_cost
        const valid_shipping_cost_dry_ice = shipping_cost_dry_ice === 0 ? 400 : shipping_cost_dry_ice
        const valid_discount = (discount === 0) || (discount > 1)  ? 1 : discount
        const valid_margin = (margin === 0) || (margin < 1) ? 1.6 : margin
        const supplierId = supplier.id


        const finalCat = supplierId + (catalog_number.startsWith('-') ? catalog_number : '-' + catalog_number);

        if (!buy) {
            finalPrice = null
        } else {
            if (buy < 100) {
                if (dry_ice) {
                    finalPrice = flat_rate + bank_fee + valid_shipping_cost_dry_ice + invoice_surcharges
                } else {
                    finalPrice = flat_rate + bank_fee + valid_shipping_cost + invoice_surcharges

                }
            } else if (buy >= 100) {
                if (dry_ice) {
                    finalPrice = (buy*valid_discount*valid_margin) + valid_shipping_cost_dry_ice + bank_fee + invoice_surcharges
                } else {
                    finalPrice = (buy*valid_discount*valid_margin) + valid_shipping_cost + bank_fee + invoice_surcharges

                }

            }
        }



        if (finalPrice) {
            finalPrice = Number(finalPrice.toFixed(2))
        }


        return {...others, catalog_number: finalCat, sell_price: finalPrice, dry_ice: product.shipment.dry_ice, variant: false}


};

export const generateSimplesGentaurELASTIC = (products: IGentaurProduct[]): any => {
    // @ts-ignore
    return products.map((_doc) => generateSimpleGentaur(_doc) );
};
export const generateVariantsGentaur = (products: IGentaurProduct[]): any => {
    // @ts-ignore
    return products.map(({ _doc }) => {

        let variations
        variations = PROCESS_VARIATIONS_SINGLE_PRODUCT(_doc.variations)
        const {sell_price, size, ...others} = _doc

        return {
            ...others,
            variant: true,
            variations
        };





    });
};
export const generateVariantsGentaurELASTIC = (products: IGentaurProduct[]): any => {
    // @ts-ignore
    return products.map(( _doc ) => {

        let variations
        variations = PROCESS_VARIATIONS_SINGLE_PRODUCT(_doc.variations)


        return {
            ..._doc,
            variant: true,
            variations
        };





    });
};

export const upsertGentaurProductToELASTIC = async (index: string, product: IGentaurProduct) => {
    try {
        await searchClient.update({
            index,
            id: product.catalog_number, // Use `catalog_number` as the ID for upsert
            body: {
                doc: product, // Fields to update
                doc_as_upsert: true, // Insert if not exists
            },
        });

        return true
    } catch (error) {
        console.error('Error during upsert operation:', error);
        return false
    }
};

export const checkIfDocumentExistsInELASTIC = async (index: string, id: string): Promise<boolean> => {
    try {
        const exists = await searchClient.exists({
            index,
            id,
        });
        //   @ts-ignore
        return exists // Returns true if the document exists, otherwise false
    } catch (error) {
        console.error('Error checking if document exists:', error);
        return false; // Assume false on error to avoid accidental deletes
    }
};

export const deleteGentaurProductFromELASTIC = async (index: string, id: string) => {
    try {
        const response = await searchClient.delete({
            index,
            id, // Use the unique identifier (e.g., catalog_number)
        });

        //   console.log('Document deleted successfully:', response);
        return true
    } catch (error) {
        // If the document is not found, consider it a success and do not throw an error
        //   @ts-ignore
        if (error.meta && error.meta.statusCode === 404) {
            // console.log('Document not found, but considered a success');
            return true
        }

        // Handle other errors that may occur
        //   console.error('Error deleting document:', error);
        return false
    }
};

export const getFiltersWithLogic = async () => {
    try {
        const filters = await GentaurFilter.aggregate([
            {
                $match: {
                    "counts.logic": { $exists: true, $ne: {} }  // Ensure documents have counts with non-empty logic
                }
            },
            {
                $project: {
                    filter: 1, // Retain the filter name
                    counts: {
                        $filter: {
                            input: "$counts",
                            as: "count",
                            cond: {
                                $and: [
                                    { $ifNull: ["$$count.logic", false] },  // Check if logic exists
                                    { $ne: ["$$count.logic", {}] }          // Ensure logic is not an empty object
                                ]
                            }
                        }
                    }
                }
            }
        ]);
        return filters
    } catch (error) {
        return []
    }
}

export function GENERAL_ELSTIC_FILTERS_QUERY(operator: string, queryData: any, additionalData: any) {
    const mustClauses: any = [];
    const shouldClauses: any = [];
    const mustNotClauses: any = [];
    const filterClauses: any = [];

    const processValue = (value: any, field = 'product_name') => {
        if (value.includes('&')) {
            const values = value.split('&').map((v: any) => v.trim());
            return {
                bool: {
                    must: values.map((val: any) => ({ match_phrase: { [field]: val } }))
                }
            };
        } else if (value.includes('/')) {
            const values = value.split('/').map((v: any) => v.trim());
            return {
                bool: {
                    should: values.map((val: any) => ({ match_phrase: { [field]: val } })),
                    minimum_should_match: 1
                }
            };
        } else {
            return { match_phrase: { [field]: value } };
        }
    };

    // Process queryData
    queryData.forEach((item: any) => {
        if (item.option === 'inc') {
            const clause = processValue(item.value);
            if (operator === 'All') {
                mustClauses.push(clause);
            } else {
                shouldClauses.push(clause);
            }
        } else if (item.option === 'exc') {
            mustNotClauses.push(processValue(item.value));
        }
    });

    // Process additionalData for conditional logic
    if (additionalData && additionalData.length > 0) {
        additionalData.forEach((condition: any) => {
            const ifClause = processValue(condition.ifValue);
            const thenClause = processValue(condition.thenValue);

            let ifCondition;
            if (condition.ifOption === 'inc') {
                ifCondition = ifClause;
            } else if (condition.ifOption === 'exc') {
                ifCondition = { bool: { must_not: [ifClause] } };
            }

            let thenCondition;
            if (condition.thenOption === 'inc') {
                thenCondition = thenClause;
            } else if (condition.thenOption === 'exc') {
                thenCondition = { bool: { must_not: [thenClause] } };
            }

            // "If A then B" is equivalent to "NOT A OR B"
            const conditionalClause = {
                bool: {
                    should: [
                        {
                            bool: {
                                must_not: [ifCondition]
                            }
                        },
                        thenCondition
                    ],
                    minimum_should_match: 1
                }
            };

            filterClauses.push(conditionalClause);
        });
    }

    const query = {
        query: {
            bool: {
                must: mustClauses,
                should: operator === 'Any' ? shouldClauses : [],
                must_not: mustNotClauses,
                // Only include the filter if filterClauses is not empty
                ...(filterClauses.length > 0 && { filter: filterClauses }),
            }
        },
        size: 10000,
    };

    // If using 'should' clauses without 'must', ensure at least one 'should' clause matches
    if (operator === 'Any' && shouldClauses.length > 0) {
        // @ts-ignore
        query.query.bool.minimum_should_match = 1;
    }

    return query;
}

export const ELASTIC_SCROLL_QUERY_FILTERS = async (elasticSearchQuery: any) => {


    const result = await searchClient.search({
        index: "gentaur_products",
        body: elasticSearchQuery,
        scroll: "5m",
    });

    let catGentaurFields = [];

    let allDocuments = result.hits.hits.slice();
    catGentaurFields.push(
        // @ts-ignore
        ...allDocuments.map((doc) => doc._source.catalog_number)
    );

    let scrollId = result._scroll_id;

    while (true) {
        const scrollResults = await searchClient.scroll({
            scroll_id: scrollId,
            scroll: "5m",
        });

        if (scrollResults.hits.hits.length === 0) {
            console.log("No more documents to fetch.");
            break;
        }

        allDocuments = allDocuments.concat(scrollResults.hits.hits);
        catGentaurFields.push(
            // @ts-ignore
            ...scrollResults.hits.hits.map((doc) => doc._source.catalog_number)
        );

        scrollId = scrollResults._scroll_id;
    }

    return catGentaurFields



}

export const ELASTIC_BATCH_SCROLL_QUERY_FILTERS = async (elasticSearchQuery: any) => {

    let catGentaurFields: any = [];

    let searchResponse = await searchClient.search({
        index: "gentaur_products",
        body: elasticSearchQuery,
        scroll: "5m"
      });
    //   @ts-ignore
      catGentaurFields = searchResponse.hits.hits.map(doc => doc._source.catalog_number);
      let scrollId = searchResponse._scroll_id;

      try {
        while (searchResponse.hits.hits.length) {
          searchResponse = await searchClient.scroll({ scroll_id: scrollId, scroll: "5m" });
        //   @ts-ignore
          catGentaurFields.push(...searchResponse.hits.hits.map(doc => doc._source.catalog_number));
        }
      } finally {
        await searchClient.clearScroll({ scroll_id: scrollId });
      }
    return catGentaurFields



}

export const PROCESS_VARIATIONS_SINGLE_PRODUCT = (variations: any): any => {
    const result = [];
    const cleanedVariations = variations
    .replace(/NaN/g, '"0.00"') // Replace NaN with "0.00"
    .replace(/'(\d+[\w\s]*)'/g, '"$1"') // Replace single quotes around sizes (e.g., '96 Tests', '10 ml')
    .replace(/"\s*"/g, '"1 Unit"'); // Replace empty sizes or spaces with "1 Unit"

  // Parse the cleaned JSON string
  const json = JSON.parse(cleanedVariations.replace(/'/g, '"'));
  for (const [catGentaur, variant] of Object.entries(json)) {
    // @ts-ignore
    const cleanedBuyPrice = variant.buy_price.map((price: any) =>
        isNaN(price) ? 0.00 : parseFloat(price).toFixed(2)
)
// @ts-ignore
const cleanedSellPrice = variant.sell_price.map((price: any) =>
        isNaN(price) ? 0.00 : parseFloat(price).toFixed(2)
      )
    // @ts-ignore
    const cleanedSize = variant.size && variant.size.Size ? variant.size.Size[0] : ["1 Unit"][0];

    // Create the standardized object
    result.push({
      catalog_number: catGentaur,
      size: cleanedSize,
      sell_price: parseFloat(cleanedSellPrice[0]),
    });
  }
  return result
}



export function ELASTIC_WITH_CUSTOM_FILTERS_PAGINATION_QUERY(operator: string, queryData: any, additionalData: any, pageNumber: number, limit: number) {
    const mustClauses: any = [];
    const shouldClauses: any = [];
    const mustNotClauses: any = [];
    const filterClauses: any = [];

    const processValue = (value: any, field = 'product_name') => {
      if (value.includes('&')) {
        const values = value.split('&').map((v: any) => v.trim());
        return {
          bool: {
            must: values.map((val: any) => ({ match_phrase: { [field]: val } }))
          }
        };
      } else if (value.includes('/')) {
        const values = value.split('/').map((v: any) => v.trim());
        return {
          bool: {
            should: values.map((val: any) => ({ match_phrase: { [field]: val } })),
            minimum_should_match: 1
          }
        };
      } else {
        return { match_phrase: { [field]: value } };
      }
    };

    // Process queryData
    queryData.forEach((item: any) => {
      if (item.option === 'inc') {
        const clause = processValue(item.value);
        if (operator === 'All') {
          mustClauses.push(clause);
        } else {
          shouldClauses.push(clause);
        }
      } else if (item.option === 'exc') {
        mustNotClauses.push(processValue(item.value));
      }
    });

    // Process additionalData for conditional logic
    if (additionalData && additionalData.length > 0) {
      additionalData.forEach((condition: any) => {
        const ifClause = processValue(condition.ifValue);
        const thenClause = processValue(condition.thenValue);

        let ifCondition;
        if (condition.ifOption === 'inc') {
          ifCondition = ifClause;
        } else if (condition.ifOption === 'exc') {
          ifCondition = { bool: { must_not: [ifClause] } };
        }

        let thenCondition;
        if (condition.thenOption === 'inc') {
          thenCondition = thenClause;
        } else if (condition.thenOption === 'exc') {
          thenCondition = { bool: { must_not: [thenClause] } };
        }

        // "If A then B" is equivalent to "NOT A OR B"
        const conditionalClause = {
          bool: {
            should: [
              {
                bool: {
                  must_not: [ifCondition]
                }
              },
              thenCondition
            ],
            minimum_should_match: 1
          }
        };

        filterClauses.push(conditionalClause);
      });
    }

    const query = {
      query: {
        bool: {
          must: mustClauses,
          should: operator === 'Any' ? shouldClauses : [],
          must_not: mustNotClauses,
          // Only include the filter if filterClauses is not empty
          ...(filterClauses.length > 0 && { filter: filterClauses }),
        }
      },
      size: limit,
      from: (pageNumber - 1) * limit
    };

    // If using 'should' clauses without 'must', ensure at least one 'should' clause matches
    if (operator === 'Any' && shouldClauses.length > 0) {
        // @ts-ignore
      query.query.bool.minimum_should_match = 1;
    }

    return query;
  }



export const ELASTIC_WITH_FILTERS_PAGINATION_RESPONSE = async (elasticSearchQuery :any) => {
    const from = elasticSearchQuery.from
    const page = (from/100) + 1
    let total
    let pages
    let filters:any = []

    let products:any = []

    try {

        const result = await searchClient.search({
            index: "gentaur_products",
            body: elasticSearchQuery,
          });

// @ts-ignore
          total = result.hits.total.value
          const totalPages = Math.ceil(total / 100);
          pages  = totalPages



          const fieldsToReturn = [ 'id', 'name', 'shipment', 'catalog_number', 'price', 'size', 'variations', 'supplier', 'cluster_name', 'url'

          ];

          const products = result.hits.hits.map((item: any) => {
            const source = item._source;
            const product: any = {};

            for (const field of fieldsToReturn) {
              if (source[field] !== undefined && source[field] !== null) {
                product[field] = source[field];
              }
            }

            return product;
          });



          if (result.aggregations && result.aggregations.filters_count) {
            const filterNamesBuckets =
            // @ts-ignore
              result.aggregations.filters_count.filterNames.buckets;
            filterNamesBuckets.forEach((bucket: any) => {
              const filterName = bucket.key;

              const sortedValuesArray = bucket.filterValues.buckets
                .sort((a: any, b: any) => a.key.localeCompare(b.key))
                .map((valueBucket: any) => ({
                  key: valueBucket.key,
                  doc_count: valueBucket.doc_count,
                }));
              filters.push({
                key: filterName,
                filter_values: sortedValuesArray,
              });

            });
          }


          if (filters.length > 0) {



            filters.sort((a: any, b: any) => a.key.localeCompare(b.key));

          }



          return {
            count: total,
            pages: pages,
            page: page,
            filters: filters,
            products: products,
          };

    } catch (error) {
        return {
            count: 10000,
            pages: 100,
            page: 1,
            products: products,
            filters: filters
          };
    }


}
export const ELASTIC_SIMILARS_RESPONSE = async (elasticSearchQuery :any) => {


    let products:any = []

    try {

        const result = await searchClient.search({
            index: "gentaur_products",
            body: elasticSearchQuery,
          });









          const fieldsToReturn = [ 'id', 'name', 'shipment', 'catalog_number', 'price', 'size', 'variations', 'supplier', 'cluster_name', 'url'

          ];

          products = result.hits.hits.map((item: any) => {
            const source = item._source;
            const product: any = {};

            for (const field of fieldsToReturn) {
              if (source[field] !== undefined && source[field] !== null) {
                product[field] = source[field];
              }
            }

            return product;
          });





          return {

            products: products,
          };

    } catch (error) {
        return {

            products: products,

          };
    }


}
export const ELASTIC_WITH_CUSTOM_FILTERS_PAGINATION_RESPONSE = async (elasticSearchQuery :any) => {
    const from = elasticSearchQuery.from
    const page = (from/100) + 1
    let total
    let pages

    let products:any = []

    try {

        const result = await searchClient.search({
            index: "gentaur_products",
            body: elasticSearchQuery,
          });

// @ts-ignore
          total = result.hits.total.value
          const totalPages = Math.ceil(total / 100);
          pages  = totalPages



          const fieldsToReturn = [
            'product_name',
            'catalog_number',
            'sell_price',
            'size',
            'variations',
            'cluster_name',
            'url',
          ];

          const products = result.hits.hits.map((item: any) => {
            const source = item._source;
            const product: any = {};

            for (const field of fieldsToReturn) {
              if (source[field] !== undefined && source[field] !== null) {
                product[field] = source[field];
              }
            }

            return product;
          });

          return {
            count: total,
            pages: pages,
            page: page,
            products: products,
          };

    } catch (error) {
        return {
            count: total,
            pages: pages,
            page: page,
            products: products,
          };
    }


}
